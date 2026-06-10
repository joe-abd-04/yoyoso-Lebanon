-- ============================================================
-- YOYOSO Lebanon — Link orders to user accounts (Phase 9.4)
-- Migration: 003_orders_user_id
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Goal: guest checkout still works (user_id stays NULL), but when a logged-in
-- customer places an order we record their auth user id so they can see it in
-- "My Orders". RLS lets a logged-in user read ONLY their own orders; guests and
-- other users still cannot read any order (only the service-role key can read
-- all, as before).

-- 1. Nullable user_id linked to the auth user. ON DELETE SET NULL keeps the
--    order row (for the shop's records) even if the account is later deleted.
alter table orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 2. Index for the "my orders" lookup (orders where user_id = current user).
create index if not exists orders_user_id_idx on orders (user_id);

-- 3. RLS: a logged-in user may SELECT only the orders that belong to them.
--    (The existing "orders: public insert" policy is unchanged. There is still
--    no anon SELECT policy, so guests cannot read any order.)
drop policy if exists "orders: read own" on orders;
create policy "orders: read own"
  on orders for select
  to authenticated
  using (auth.uid() = user_id);

-- 4. Table grant: RLS is the ROW gate, grants are the TABLE gate — both needed.
--    Allow the authenticated role to SELECT (rows are still filtered by the
--    policy above). anon is intentionally NOT granted select.
grant select on public.orders to authenticated;
