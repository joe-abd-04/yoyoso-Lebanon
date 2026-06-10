-- ============================================================
-- Migration 002 — Table grants (FIX for Phase 9.1)
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================
--
-- The Phase 9.1 schema enabled RLS but did not grant table-level privileges.
-- On this project the roles (including service_role) have NO grants, so every
-- query fails with:  permission denied for table <name>  (SQLSTATE 42501).
--
-- RLS controls WHICH ROWS a role can touch; GRANTs control WHETHER the role can
-- touch the table at all. Both are required. These statements are idempotent —
-- safe to run more than once.

-- Schema usage for all roles.
grant usage on schema public to anon, authenticated, service_role;

-- service_role (used by SUPABASE_SECRET_KEY / the admin panel / the seed script)
-- gets full access. It also bypasses RLS.
grant all on all tables in schema public to service_role;

-- Public roles may READ the catalog tables (RLS already allows select on these).
grant select on public.categories, public.products, public.stores, public.settings
  to anon, authenticated;

-- Public roles may INSERT into the submission tables only. We deliberately do NOT
-- grant select/update/delete here — combined with the insert-only RLS policies,
-- the public can place orders / send messages / subscribe, but never read them.
grant insert on public.orders, public.contact_messages, public.newsletter_subscribers
  to anon, authenticated;
