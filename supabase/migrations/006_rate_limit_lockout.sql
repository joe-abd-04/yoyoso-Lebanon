-- ============================================================
-- YOYOSO Lebanon — Server-side rate limiting + account lockout (Phase 9.8B)
-- Migration: 006_rate_limit_lockout
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Why a DB-backed limiter? On Vercel serverless an in-memory counter does NOT
-- persist across instances, so it can't actually limit anything. A small
-- Postgres table shared by every instance is reliable and cheap.
--
-- Security model:
--   • These tables hold abuse-tracking data only. They are NOT readable or
--     writable by the public (anon/authenticated) roles — RLS is enabled with
--     NO policies, and no table grants are given to those roles.
--   • All access goes through SECURITY DEFINER functions called by our
--     server-side code using the service-role key. The functions run as their
--     owner (postgres), so they don't depend on caller grants and can't be
--     abused via the public API. EXECUTE is granted only to service_role.
--   • Every function does opportunistic cleanup of its own old rows, so the
--     tables stay small without a scheduler. An optional pg_cron purge is at the
--     bottom for belt-and-braces.
--
-- All statements are idempotent — safe to run more than once.

-- ─── TABLES ──────────────────────────────────────────────────────────────────

-- Generic sliding-window event log. One row per counted attempt.
-- `bucket` namespaces the limit, e.g. 'login:ip:1.2.3.4', 'placeOrder:ip:...'.
create table if not exists public.rate_limit_events (
  id         bigint generated always as identity primary key,
  bucket     text        not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_events_bucket_time_idx
  on public.rate_limit_events (bucket, created_at);

-- Failed-login log, used for temporary per-account/per-IP lockout.
-- `identifier` is a lowercased email ('email:...') or an IP ('ip:...').
create table if not exists public.auth_failed_attempts (
  id         bigint generated always as identity primary key,
  identifier text        not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_failed_attempts_id_time_idx
  on public.auth_failed_attempts (identifier, created_at);

-- ─── RLS: lock the tables down completely for public roles ──────────────────
-- RLS enabled + no policies ⇒ anon/authenticated can touch nothing.
-- service_role bypasses RLS; the SECURITY DEFINER functions run as owner.
alter table public.rate_limit_events    enable row level security;
alter table public.auth_failed_attempts enable row level security;

-- ─── FUNCTIONS ───────────────────────────────────────────────────────────────

-- Sliding-window rate limit. Returns TRUE if the attempt is ALLOWED (and records
-- it), FALSE if the caller is over `p_max` within the last `p_window_seconds`.
create or replace function public.rate_limit_check(
  p_bucket text,
  p_max int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window interval := make_interval(secs => p_window_seconds);
  v_count  int;
begin
  -- Opportunistic cleanup for this bucket.
  delete from public.rate_limit_events
  where bucket = p_bucket and created_at < now() - v_window;

  select count(*) into v_count
  from public.rate_limit_events
  where bucket = p_bucket and created_at >= now() - v_window;

  if v_count >= p_max then
    return false; -- over the limit
  end if;

  insert into public.rate_limit_events (bucket) values (p_bucket);
  return true; -- allowed
end;
$$;

-- Record one failed login attempt for an identifier.
create or replace function public.record_auth_failure(p_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.auth_failed_attempts (identifier) values (p_identifier);
end;
$$;

-- Clear all failed attempts for an identifier (call on a successful login).
create or replace function public.clear_auth_failures(p_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.auth_failed_attempts where identifier = p_identifier;
end;
$$;

-- Is this identifier currently locked out? Locked when there have been
-- >= p_threshold failures within the last p_window_seconds. The lockout lifts
-- p_window_seconds after the MOST RECENT failure (so repeated attempts during a
-- lockout extend it — a gentle backoff — while a real user just waits it out).
-- Never permanent: failures age out of the window automatically.
create or replace function public.check_auth_lockout(
  p_identifier text,
  p_threshold int,
  p_window_seconds int,
  out locked boolean,
  out retry_after_seconds int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window interval := make_interval(secs => p_window_seconds);
  v_count  int;
  v_last   timestamptz;
begin
  delete from public.auth_failed_attempts
  where identifier = p_identifier and created_at < now() - v_window;

  select count(*), max(created_at)
    into v_count, v_last
  from public.auth_failed_attempts
  where identifier = p_identifier and created_at >= now() - v_window;

  if v_count >= p_threshold and v_last is not null then
    locked := true;
    retry_after_seconds :=
      greatest(1, ceil(extract(epoch from (v_last + v_window - now())))::int);
  else
    locked := false;
    retry_after_seconds := 0;
  end if;
end;
$$;

-- Optional global purge (the per-call cleanup above usually suffices). Removes
-- anything older than a day across all buckets/identifiers.
create or replace function public.purge_rate_limit_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.rate_limit_events    where created_at < now() - interval '1 day';
  delete from public.auth_failed_attempts where created_at < now() - interval '1 day';
end;
$$;

-- ─── GRANTS ─────────────────────────────────────────────────────────────────
-- Functions default to EXECUTE by PUBLIC. Revoke that and grant only to the
-- service_role (which is all our server code uses). Public roles never call
-- these directly.
revoke all on function public.rate_limit_check(text, int, int)        from public;
revoke all on function public.record_auth_failure(text)               from public;
revoke all on function public.clear_auth_failures(text)               from public;
revoke all on function public.check_auth_lockout(text, int, int)      from public;
revoke all on function public.purge_rate_limit_data()                 from public;

grant execute on function public.rate_limit_check(text, int, int)     to service_role;
grant execute on function public.record_auth_failure(text)            to service_role;
grant execute on function public.clear_auth_failures(text)            to service_role;
grant execute on function public.check_auth_lockout(text, int, int)   to service_role;
grant execute on function public.purge_rate_limit_data()              to service_role;

-- Full table access for service_role (harmless; the functions are definer-owned
-- so this is just for admin/debug queries with the secret key).
grant all on public.rate_limit_events    to service_role;
grant all on public.auth_failed_attempts to service_role;

-- ============================================================
-- OPTIONAL: schedule a daily purge with pg_cron (if the extension is enabled
-- in your project under Database → Extensions). The per-call cleanup keeps the
-- tables small already, so this is optional:
-- ------------------------------------------------------------
--   select cron.schedule(
--     'purge-rate-limit-data', '17 3 * * *',
--     $$ select public.purge_rate_limit_data(); $$
--   );
-- ============================================================
