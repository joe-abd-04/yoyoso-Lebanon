-- ============================================================
-- YOYOSO Lebanon — Multiple categories per product
-- Migration: 007_product_categories
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- A product can now belong to SEVERAL categories and appear under each one.
--
-- Approach: a `category_ids uuid[]` array column on products (chosen over a
-- join table because the catalog is already loaded in a single query and mapped
-- in memory — an array needs no extra JOIN/round-trip and keeps that fast path).
--   • `category_id` (existing) stays as the PRIMARY category: it drives the
--     subcategory, breadcrumb, and analytics. NOT removed — nothing breaks.
--   • `category_ids` holds EVERY category the product is shown in (including the
--     primary). Storefront/admin membership is based on this array.
--
-- Existing products are migrated so their current single category is preserved.
-- All statements are idempotent — safe to run more than once.

-- 1. The array column. Defaults to empty; backfilled below.
alter table products
  add column if not exists category_ids uuid[] not null default '{}';

-- 2. MIGRATE existing data: seed each product's array with its current category
--    so nothing your mum has entered is lost. Only fills rows not already set.
update products
  set category_ids = array[category_id]
  where category_id is not null
    and (category_ids is null or category_ids = '{}');

-- 3. GIN index for fast "is category X in the array?" lookups (admin filter,
--    and any membership query). `&&` / `@>` operators use this.
create index if not exists products_category_ids_idx
  on products using gin (category_ids);

-- ============================================================
-- Verify (optional):
--   select slug, category_id, category_ids from products limit 10;
--   -- every row's category_ids should contain at least its category_id.
-- ============================================================
--
-- NOTE: Postgres can't put a foreign key on array elements, so category_ids
-- integrity is enforced at the app layer (the admin only ever picks real
-- categories, and the server zod-validates them). This is fine for a
-- single-store admin.
