-- ============================================================
-- YOYOSO — Storage RLS for the product-images bucket (Phase 9.5, step 3)
-- Migration: 005_storage_product_images
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Goal: let the public VIEW product images (so they render on the storefront),
-- but let ONLY admins upload / replace / delete them.
--
-- Security model:
--   • Reads: anyone (the bucket is public; this policy makes that explicit and
--     also allows the storage API list/select for completeness).
--   • Writes (insert / update / delete): only an authenticated user whose
--     profiles.is_admin = true. We reuse the SECURITY DEFINER helper
--     public.is_admin() created in migration 004 — it reads the caller's own
--     profile row regardless of RLS, so no extra grants on profiles are needed.
--   • The secret/service-role key is NEVER shipped to the browser. Admin uploads
--     happen from the admin's OWN logged-in session (anon key + JWT), and these
--     policies are what authorize them. Server-side cleanup uses the service-role
--     key, which bypasses RLS entirely.
--
-- Prerequisite: a PUBLIC bucket named 'product-images' must already exist
-- (Dashboard → Storage → New bucket → name "product-images", Public = on).
--
-- All statements are idempotent — safe to run more than once.

-- RLS is already enabled on storage.objects by Supabase; we only add policies.

-- 1. PUBLIC READ — anyone can view/list objects in this bucket.
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select
  to public
  using ( bucket_id = 'product-images' );

-- 2. ADMIN INSERT — only admins may upload new files into this bucket.
drop policy if exists "product-images admin insert" on storage.objects;
create policy "product-images admin insert"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'product-images' and public.is_admin() );

-- 3. ADMIN UPDATE — only admins may overwrite existing files.
drop policy if exists "product-images admin update" on storage.objects;
create policy "product-images admin update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'product-images' and public.is_admin() )
  with check ( bucket_id = 'product-images' and public.is_admin() );

-- 4. ADMIN DELETE — only admins may delete files.
drop policy if exists "product-images admin delete" on storage.objects;
create policy "product-images admin delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'product-images' and public.is_admin() );

-- ============================================================
-- Verify (optional):
--   select policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--     and policyname like 'product-images%';
-- ============================================================
