/**
 * Fuse.js fuzzy product search.
 *
 * The product catalog now comes from the database (via <ProductsProvider>), so
 * instead of a single module-level instance we expose a factory that builds a
 * Fuse index from whatever product list the caller has. Client components
 * memoize this over the catalog from useProducts().
 */
import Fuse, { type IFuseOptions } from "fuse.js";
import type { Product } from "@/data/products";

export const FUSE_OPTIONS: IFuseOptions<Product> = {
  keys: [
    { name: "name", weight: 2 },
    { name: "tags", weight: 1.5 },
    { name: "category", weight: 1 },
    { name: "categories", weight: 1 },
    { name: "subcategory", weight: 1 },
    { name: "description", weight: 0.5 },
  ],
  threshold: 0.4, // 0 = exact only, 0.4 = tolerates typos like "lipstik"
  minMatchCharLength: 2,
  ignoreLocation: true, // match anywhere in the string, not just prefix
};

/** Build a Fuse index over the given products. */
export function createProductFuse(products: Product[]): Fuse<Product> {
  return new Fuse(products, FUSE_OPTIONS);
}
