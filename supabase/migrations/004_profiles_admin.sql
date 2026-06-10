-- ============================================================
-- YOYOSO Lebanon — Profiles + admin access (Phase 9.5, step 1)
-- Migration: 004_profiles_admin
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Goal: give each registered user a row in public.profiles carrying an
-- `is_admin` flag. The admin panel (/admin) is gated server-side on this flag.
--
-- Security model:
--   • A user may READ ONLY their own profile (RLS select policy).
--   • NOBODY can change is_admin through the public/anon/authenticated API —
--     there is deliberately NO user-facing update/insert policy. Only the
--     service-role key (used by our server-side admin actions and by you in the
--     SQL editor) can set is_admin. service_role bypasses RLS entirely.
--   • A SECURITY DEFINER helper public.is_admin() lets us reuse the same check
--     inside Storage RLS policies later (Phase 9.5 step 3) without exposing the
--     profiles table to those roles.
--
-- All statements are idempotent — safe to run more than once.

-- 1. The profiles table. One row per auth user (1:1, shared primary key).
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user app profile. is_admin gates the /admin panel; only service_role may set it.';

-- 2. Row Level Security.
alter table public.profiles enable row level security;

-- A logged-in user can read ONLY their own profile row.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- NOTE: intentionally no insert/update/delete policy for anon/authenticated.
-- Profiles are created by the trigger below (runs as definer) and modified only
-- via the service-role key. This makes it impossible for a customer to grant
-- themselves admin through the API.

-- 3. SECURITY DEFINER helper: "is the current request from an admin?"
--    Reused by Storage policies in step 3. Runs with the function owner's
--    privileges so it can read profiles regardless of the caller's RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- 4. Auto-create a profile whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Backfill: create profiles for users who registered BEFORE this migration
--    (e.g. your own account from Phase 9.3). Without this they'd have no row.
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
on conflict (id) do nothing;

-- 6. Table grants. RLS is the ROW gate; GRANTs are the TABLE gate — both needed
--    (see migration 002). authenticated may SELECT (filtered to own row by RLS);
--    service_role gets full access. anon is intentionally NOT granted anything.
grant select on public.profiles to authenticated;
grant all    on public.profiles to service_role;

-- ============================================================
-- AFTER running the above, make YOURSELF the first admin.
-- Run this as a SEPARATE query, replacing the email if needed:
-- ------------------------------------------------------------
--   update public.profiles
--   set is_admin = true
--   where email = 'royabdallah2005@gmail.com';
--
-- Verify it worked:
--   select email, is_admin from public.profiles where is_admin = true;
-- ============================================================
