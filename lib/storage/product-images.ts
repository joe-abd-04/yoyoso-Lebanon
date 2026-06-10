// Shared helpers for the "product-images" Supabase Storage bucket.
//
// Safe to import from BOTH client and server code: it only touches
// NEXT_PUBLIC_SUPABASE_URL (inlined into the browser bundle by Next) and does
// pure string work — no service-role key, no server-only imports.
//
// Why this exists: admin-uploaded product images live in a public Storage
// bucket and we store their public URLs in products.images / products.thumbnail.
// We must be able to (a) validate that a URL really points at our own bucket
// before persisting it (never trust the client with an arbitrary URL), and
// (b) turn a public URL back into a storage object path so we can delete the
// underlying file (orphan cleanup) with the service-role client.

export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Max number of images per product (UI + server both enforce this). */
export const MAX_PRODUCT_IMAGES = 10;

/**
 * The public-object URL prefix for this bucket, e.g.
 *   https://<ref>.supabase.co/storage/v1/object/public/product-images/
 * Returns "" if the env var is missing (then isProductImageUrl rejects all).
 */
export function productImagesPublicPrefix(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
}

/**
 * Is `url` a public URL pointing at an object in our product-images bucket?
 * Used to reject arbitrary / external URLs before saving them to the DB.
 */
export function isProductImageUrl(url: string): boolean {
  const prefix = productImagesPublicPrefix();
  if (!prefix) return false;
  // Must start with our exact bucket prefix and have a non-empty object path.
  return url.startsWith(prefix) && url.length > prefix.length;
}

/**
 * Is `url` a safe image URL to PERSIST on a product? Accepts only http(s) URLs.
 * This is what the product form / server action validate against, so it both
 * (a) blocks dangerous schemes (javascript:, data:, etc.) that could be abused
 * if ever rendered, and (b) still tolerates pre-existing external placeholder
 * images (e.g. the seeded picsum.photos URLs) so editing a legacy product never
 * breaks. NEW uploads always go to our own bucket (see isProductImageUrl), which
 * is a strict subset of this.
 */
export function isSafeImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Extract the storage object path (the part after `.../product-images/`) from a
 * public URL, so it can be passed to `storage.from(bucket).remove([path])`.
 * Returns null if the URL isn't one of ours. Strips any query string.
 */
export function productImagePathFromUrl(url: string): string | null {
  const prefix = productImagesPublicPrefix();
  if (!prefix || !url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length).split("?")[0];
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Map a list of public URLs → storage object paths, dropping any non-ours. */
export function productImagePaths(urls: string[]): string[] {
  return urls
    .map(productImagePathFromUrl)
    .filter((p): p is string => p !== null && p.length > 0);
}
