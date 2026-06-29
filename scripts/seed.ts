/**
 * Seed script — migrates the static /data files into Supabase.
 *
 * Run with:   npm run seed
 *
 * - Uses the SERVICE-ROLE key (SUPABASE_SECRET_KEY) so inserts bypass RLS.
 *   This is a local/admin script — it is NEVER bundled into the site.
 * - Idempotent: safe to run multiple times.
 *     * categories / products / settings -> upsert on their unique key (slug/key)
 *     * stores -> check-before-insert by name (the stores table has no unique
 *       business key, so we skip rows whose name already exists)
 *
 * The static data files are kept as-is (backup/reference). This only copies
 * their contents into the database.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── 1. Load .env.local manually (this script runs outside Next.js) ────────────
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  let content: string;
  try {
    content = readFileSync(envPath, "utf8");
  } catch {
    throw new Error(
      `Could not read .env.local at ${envPath}. Run this from the project root.`,
    );
  }
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

// Imports that need the static data. (createServerClient reads env lazily,
// inside its function body, so loading env above is sufficient.)
import { createServerClient } from "../lib/supabase/server";
import { categories as staticCategories } from "../data/categories";
import { stores as staticStores } from "../data/stores";
import { products as staticProducts } from "../data/products";

// Small helper: log + throw on Supabase errors so the script stops loudly.
function check(label: string, error: { message: string } | null) {
  if (error) {
    console.error(`  ✗ ${label}: ${error.message}`);
    throw new Error(`Seed failed at: ${label}`);
  }
}

async function main() {
  const supabase = createServerClient();
  console.log("🌱 Seeding Supabase from static /data files...\n");

  // ── SETTINGS ────────────────────────────────────────────────────────────
  console.log("→ settings");
  {
    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: "delivery_fee", value: 4.5, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    check("settings.delivery_fee", error);
    console.log("  ✓ delivery_fee = 4.5");
  }

  // ── CATEGORIES (parents first, then subcategories) ────────────────────────
  console.log("\n→ categories");
  {
    const parentRows = staticCategories.map((c, i) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon, // emoji used by the UI tiles
      color: c.bgColor, // pastel card background
      parent_id: null,
      sort_order: i,
    }));
    const { error: parentErr } = await supabase
      .from("categories")
      .upsert(parentRows, { onConflict: "slug" });
    check("categories (parents)", parentErr);
    console.log(`  ✓ ${parentRows.length} parent categories`);

    // Look up the parent ids we just upserted.
    const { data: parents, error: fetchErr } = await supabase
      .from("categories")
      .select("id, slug");
    check("categories (fetch ids)", fetchErr);
    const idBySlug = new Map((parents ?? []).map((c) => [c.slug, c.id]));

    // Subcategories inherit their parent's icon + color (the static subcategory
    // shape only carries slug + name, but those DB columns are NOT NULL).
    const subRows: {
      slug: string;
      name: string;
      icon: string;
      color: string;
      parent_id: string | null;
      sort_order: number;
    }[] = [];
    for (const c of staticCategories) {
      const parentId = idBySlug.get(c.slug) ?? null;
      c.subcategories.forEach((sub, j) => {
        subRows.push({
          slug: sub.slug,
          name: sub.name,
          icon: c.icon,
          color: c.bgColor,
          parent_id: parentId,
          sort_order: j,
        });
      });
    }
    if (subRows.length) {
      const { error: subErr } = await supabase
        .from("categories")
        .upsert(subRows, { onConflict: "slug" });
      check("categories (subcategories)", subErr);
    }
    console.log(`  ✓ ${subRows.length} subcategories`);
  }

  // ── STORES (check-before-insert by name) ──────────────────────────────────
  console.log("\n→ stores");
  {
    const { data: existing, error: exErr } = await supabase
      .from("stores")
      .select("name");
    check("stores (fetch existing)", exErr);
    const existingNames = new Set((existing ?? []).map((s) => s.name));

    const rows = staticStores.map((s, i) => ({
      name: s.name,
      region: s.region,
      address: s.address,
      phone: s.phone ? s.phone : null, // Tripoli has no phone -> null
      hours: s.hours,
      maps_url: s.mapsUrl,
      sort_order: i,
    }));
    const toInsert = rows.filter((r) => !existingNames.has(r.name));

    if (toInsert.length) {
      const { error } = await supabase.from("stores").insert(toInsert);
      check("stores (insert)", error);
    }
    console.log(
      `  ✓ ${toInsert.length} inserted, ${rows.length - toInsert.length} already present`,
    );
  }

  // ── PRODUCTS (need category_id from slug) ─────────────────────────────────
  console.log("\n→ products");
  {
    const { data: cats, error: catErr } = await supabase
      .from("categories")
      .select("id, slug");
    check("products (fetch category ids)", catErr);
    const catIdBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

    const rows = staticProducts.map((p) => {
      const category_id = catIdBySlug.get(p.category);
      if (!category_id) {
        throw new Error(
          `Product "${p.slug}" references unknown category slug "${p.category}"`,
        );
      }
      return {
        slug: p.slug,
        name: p.name,
        description: p.description ?? "",
        category_id,
        category_ids: [category_id],
        subcategory: p.subcategory ? p.subcategory : null,
        price_usd: p.priceUSD,
        original_price_usd: p.originalPriceUSD ?? null,
        sku: p.sku ?? null,
        in_stock: p.inStock,
        stock_count: p.stockCount ?? null,
        is_featured: p.isFeatured,
        is_best_seller: p.isBestSeller,
        badge: p.badge ?? null,
        images: p.images,
        thumbnail: p.thumbnail,
        variants: p.variants && p.variants.length ? p.variants : null,
        tags: p.tags ?? null,
        created_at: p.createdAt,
      };
    });

    const { error } = await supabase
      .from("products")
      .upsert(rows, { onConflict: "slug" });
    check("products (upsert)", error);
    console.log(`  ✓ ${rows.length} products`);
  }

  console.log("\n✅ Seed complete.");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
