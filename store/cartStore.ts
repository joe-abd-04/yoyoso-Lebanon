/**
 * Cart store (Zustand + localStorage persist).
 *
 * Stores a lightweight snapshot of each product so totals can be computed
 * in BOTH USD and LBP without re-fetching the catalog.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/data/products";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceUSD: number;
  priceLBP: number;
  thumbnail: string;
  /** Selected variant label, e.g. "Coral" or "M". Empty when none. */
  variant: string;
  quantity: number;
}

export interface CartTotals {
  count: number; // total units
  subtotalUSD: number;
  subtotalLBP: number;
}

interface CartState {
  items: CartItem[];
  addItem: (
    product: Pick<
      Product,
      "id" | "slug" | "name" | "priceUSD" | "priceLBP" | "thumbnail"
    >,
    options?: { quantity?: number; variant?: string },
  ) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQty: (productId: string, quantity: number, variant?: string) => void;
  clear: () => void;
  getTotals: () => CartTotals;
}

/** Items match on product + variant so colors/sizes are distinct lines. */
const sameLine = (a: CartItem, productId: string, variant: string) =>
  a.productId === productId && a.variant === variant;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, options) => {
        const quantity = options?.quantity ?? 1;
        const variant = options?.variant ?? "";
        set((state) => {
          const existing = state.items.find((i) =>
            sameLine(i, product.id, variant),
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, product.id, variant)
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
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
                variant,
                quantity,
              },
            ],
          };
        });
      },

      removeItem: (productId, variant = "") =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, variant)),
        })),

      updateQty: (productId, quantity, variant = "") =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => !sameLine(i, productId, variant))
              : state.items.map((i) =>
                  sameLine(i, productId, variant) ? { ...i, quantity } : i,
                ),
        })),

      clear: () => set({ items: [] }),

      getTotals: () => {
        const { items } = get();
        return items.reduce<CartTotals>(
          (acc, i) => {
            acc.count += i.quantity;
            acc.subtotalUSD += i.priceUSD * i.quantity;
            acc.subtotalLBP += i.priceLBP * i.quantity;
            return acc;
          },
          { count: 0, subtotalUSD: 0, subtotalLBP: 0 },
        );
      },
    }),
    {
      name: "yys-cart",
      version: 1,
      // Recover gracefully from any older/foreign persisted shape instead of
      // erroring ("couldn't be migrated since no migrate function provided").
      migrate: (persisted) => {
        const items = (persisted as Partial<CartState> | undefined)?.items;
        return { items: Array.isArray(items) ? items : [] } as CartState;
      },
    },
  ),
);
