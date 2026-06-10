/**
 * Wishlist store (Zustand + localStorage persist).
 *
 * Stores a lightweight product snapshot so wishlist cards can render
 * without re-fetching the catalog.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/data/products";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  priceUSD: number;
  priceLBP: number;
  thumbnail: string;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (
    product: Pick<
      Product,
      "id" | "slug" | "name" | "priceUSD" | "priceLBP" | "thumbnail"
    >,
  ) => void;
  remove: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) =>
        set((state) => {
          const exists = state.items.some((i) => i.productId === product.id);
          if (exists) {
            return {
              items: state.items.filter((i) => i.productId !== product.id),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                priceUSD: product.priceUSD,
                priceLBP: product.priceLBP,
                thumbnail: product.thumbnail,
              },
            ],
          };
        }),

      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      isInWishlist: (productId) =>
        get().items.some((i) => i.productId === productId),

      clear: () => set({ items: [] }),
    }),
    {
      name: "yys-wishlist",
      version: 1,
      // Recover gracefully from any older/foreign persisted shape.
      migrate: (persisted) => {
        const items = (persisted as Partial<WishlistState> | undefined)?.items;
        return { items: Array.isArray(items) ? items : [] } as WishlistState;
      },
    },
  ),
);
