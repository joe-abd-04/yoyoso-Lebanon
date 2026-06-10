-- ============================================================
-- YOYOSO Lebanon — Initial Database Schema
-- Migration: 001_initial_schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Ensure the pgcrypto extension is available for gen_random_uuid()
create extension if not exists "pgcrypto";


-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
-- Supports nested subcategories via self-referencing parent_id.

create table categories (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        unique not null,
  name        text        not null,
  icon        text        not null,       -- lucide icon name, e.g. 'sparkles'
  color       text        not null,       -- accent hex, e.g. '#2BC4B6'
  parent_id   uuid        references categories(id) on delete set null,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);


-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

create table products (
  id                  uuid        primary key default gen_random_uuid(),
  slug                text        unique not null,
  name                text        not null,
  description         text        not null default '',
  category_id         uuid        not null references categories(id) on delete restrict,
  subcategory         text,
  price_usd           numeric     not null,
  original_price_usd  numeric,              -- non-null means item is on sale
  sku                 text,
  in_stock            boolean     not null default true,
  stock_count         int,
  is_featured         boolean     not null default false,
  is_best_seller      boolean     not null default false,
  badge               text        check (badge in ('NEW', 'SALE', 'HOT')),
  images              text[]      not null default '{}',
  thumbnail           text        not null default '',
  variants            jsonb,               -- ProductVariantData[] | null
  tags                text[],
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at on every products row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();


-- ─── ORDERS ──────────────────────────────────────────────────────────────────

create table orders (
  id               uuid        primary key default gen_random_uuid(),
  order_number     text        unique not null,  -- e.g. YYS-100234
  customer_name    text        not null,
  customer_email   text        not null,
  customer_phone   text        not null,
  address_line1    text        not null,
  address_line2    text,
  city             text        not null,
  region           text        not null,
  delivery_notes   text,
  items            jsonb       not null,          -- OrderItem[]
  subtotal_usd     numeric     not null,
  delivery_fee_usd numeric     not null,
  discount_usd     numeric     not null default 0,
  total_usd        numeric     not null,
  payment_method   text        not null default 'cash_on_delivery',
  status           text        not null default 'pending'
                               check (status in (
                                 'pending',
                                 'processing',
                                 'out_for_delivery',
                                 'delivered',
                                 'cancelled'
                               )),
  created_at       timestamptz not null default now()
);


-- ─── CONTACT MESSAGES ────────────────────────────────────────────────────────

create table contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  phone      text        not null default '',
  subject    text        not null,
  message    text        not null,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);


-- ─── NEWSLETTER SUBSCRIBERS ──────────────────────────────────────────────────

create table newsletter_subscribers (
  id         uuid        primary key default gen_random_uuid(),
  email      text        unique not null,
  created_at timestamptz not null default now()
);


-- ─── SETTINGS ────────────────────────────────────────────────────────────────
-- Key-value store for editable site configuration.

create table settings (
  key        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- Seed: delivery fee in USD
insert into settings (key, value) values
  ('delivery_fee', '4.5');


-- ─── STORES ──────────────────────────────────────────────────────────────────
-- The 5 physical YOYOSO Lebanon store locations.

create table stores (
  id         uuid    primary key default gen_random_uuid(),
  name       text    not null,
  region     text    not null,
  address    text    not null,
  phone      text,
  hours      text    not null,
  maps_url   text    not null,
  sort_order int     not null default 0
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- The service-role key (SUPABASE_SECRET_KEY) bypasses ALL RLS
-- policies. Use it only server-side for admin operations.
-- The anon key is governed by the policies below.

alter table categories            enable row level security;
alter table products              enable row level security;
alter table orders                enable row level security;
alter table contact_messages      enable row level security;
alter table newsletter_subscribers enable row level security;
alter table settings              enable row level security;
alter table stores                enable row level security;


-- CATEGORIES: anyone can read, no public writes
create policy "categories: public read"
  on categories for select
  to anon, authenticated
  using (true);

-- PRODUCTS: anyone can read, no public writes
create policy "products: public read"
  on products for select
  to anon, authenticated
  using (true);

-- STORES: anyone can read, no public writes
create policy "stores: public read"
  on stores for select
  to anon, authenticated
  using (true);

-- SETTINGS: anyone can read (needed for delivery fee on checkout),
-- no public writes — only service role can update settings
create policy "settings: public read"
  on settings for select
  to anon, authenticated
  using (true);

-- ORDERS: anyone can place an order (insert), but cannot read any orders.
-- Only the service-role key (admin/server) can select or update orders.
create policy "orders: public insert"
  on orders for insert
  to anon, authenticated
  with check (true);

-- CONTACT MESSAGES: anyone can submit a message (insert), cannot read any.
-- Only service-role can select (admin reads messages in admin panel).
create policy "contact_messages: public insert"
  on contact_messages for insert
  to anon, authenticated
  with check (true);

-- NEWSLETTER SUBSCRIBERS: anyone can subscribe (insert), cannot read the list.
-- Duplicate emails are rejected by the unique constraint, not a second policy.
create policy "newsletter_subscribers: public insert"
  on newsletter_subscribers for insert
  to anon, authenticated
  with check (true);


-- ============================================================
-- TABLE GRANTS
-- ============================================================
-- RLS is the ROW gate; grants are the TABLE gate. Both must allow an action.
-- New Supabase projects do not always auto-grant these, so we set them
-- explicitly (without grants you get: "permission denied for table ...").

-- Schema usage for all roles.
grant usage on schema public to anon, authenticated, service_role;

-- service_role (the secret key / admin) gets full access; it also bypasses RLS.
grant all on all tables in schema public to service_role;

-- Public roles may READ the catalog tables (RLS already allows select).
grant select on public.categories, public.products, public.stores, public.settings
  to anon, authenticated;

-- Public roles may INSERT into the submission tables (RLS restricts to insert-only,
-- and grants intentionally exclude select/update/delete for these).
grant insert on public.orders, public.contact_messages, public.newsletter_subscribers
  to anon, authenticated;
