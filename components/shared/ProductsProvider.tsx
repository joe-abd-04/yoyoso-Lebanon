"use client";

// Makes the full product catalog available to the client component tree
// without components importing the static data file. The catalog is fetched
// once on the server (in app/layout.tsx via getProducts()) and passed in as a
// prop, so it's present in the initial SSR HTML — good for SEO and no
// client-side fetch/loading flash.
//
// The header search box lives on every page and needs the whole catalog to do
// instant fuzzy search, so the catalog is provided globally from the layout.
//
// Consumers: useProducts() -> Product[]

import { createContext, useContext, type ReactNode } from "react";
import type { Product } from "@/data/products";

const ProductsContext = createContext<Product[]>([]);

export function ProductsProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  return (
    <ProductsContext.Provider value={products}>
      {children}
    </ProductsContext.Provider>
  );
}

/** The full product catalog (UI shape), as fetched on the server. */
export function useProducts(): Product[] {
  return useContext(ProductsContext);
}
