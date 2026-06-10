// SERVER-ONLY data access for categories.
// Uses the service-role server client, so only import this from Server
// Components / Route Handlers — never from a 'use client' file. Client
// components receive categories via <CategoriesProvider> (see
// components/shared/CategoriesProvider.tsx).
//
// Returns the existing UI `Category` shape (from data/categories.ts) so
// presentational components don't need to change:
//   DB `color`     -> UI `bgColor`
//   DB `icon`      -> UI `icon` (emoji, kept as-is)
//   parent_id=null -> top-level category; children link via parent_id.
//
// The static data/categories.ts file is kept as a backup: if the DB is
// unreachable or returns nothing, we fall back to it so navigation never
// breaks (the whole site hangs off the category nav).

import { createServerClient } from "@/lib/supabase/server";
import {
  categories as staticCategories,
  type Category,
  type Subcategory,
} from "@/data/categories";

/**
 * All top-level categories, each with its subcategories nested, ordered by
 * `sort_order`. Falls back to the static catalog if the DB can't be read.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("[getCategories] Supabase error:", error.message);
      return staticCategories;
    }

    const parents = data.filter((row) => row.parent_id === null);

    return parents.map((parent) => ({
      slug: parent.slug,
      name: parent.name,
      icon: parent.icon,
      bgColor: parent.color,
      subcategories: data
        .filter((row) => row.parent_id === parent.id)
        .map<Subcategory>((row) => ({ slug: row.slug, name: row.name })),
    }));
  } catch (err) {
    console.error("[getCategories] Unexpected error:", err);
    return staticCategories;
  }
}

/** A single top-level category (with subcategories) by slug, or undefined. */
export async function getCategoryBySlug(
  slug: string,
): Promise<Category | undefined> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug);
}

/** Subcategories of a given parent category slug (empty if none/not found). */
export async function getSubcategories(
  parentSlug: string,
): Promise<Subcategory[]> {
  const category = await getCategoryBySlug(parentSlug);
  return category?.subcategories ?? [];
}
