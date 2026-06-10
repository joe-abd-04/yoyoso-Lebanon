"use client";

// Makes the category catalog available to the client component tree without
// every component importing the static data file. The categories are fetched
// once on the server (in app/layout.tsx via getCategories()) and passed in as
// a prop, so they're present in the initial SSR HTML — good for SEO and no
// client-side fetch/loading flash.
//
// Consumers:
//   useCategories()          -> Category[]
//   useCategoryBySlug(slug)  -> Category | undefined

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Category } from "@/data/categories";

const CategoriesContext = createContext<Category[]>([]);

export function CategoriesProvider({
  categories,
  children,
}: {
  categories: Category[];
  children: ReactNode;
}) {
  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
}

/** All top-level categories (with subcategories nested), in display order. */
export function useCategories(): Category[] {
  return useContext(CategoriesContext);
}

/** Look up a single top-level category by slug. */
export function useCategoryBySlug(slug: string): Category | undefined {
  const categories = useContext(CategoriesContext);
  return useMemo(
    () => categories.find((c) => c.slug === slug),
    [categories, slug],
  );
}
