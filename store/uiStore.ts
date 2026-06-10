/**
 * UI store (Zustand). Transient UI state (drawers, toast) is kept in memory.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIState {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  filterDrawerOpen: boolean;
  setFilterDrawerOpen: (open: boolean) => void;
  toggleFilterDrawer: () => void;

  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      filterDrawerOpen: false,
      setFilterDrawerOpen: (open) => set({ filterDrawerOpen: open }),
      toggleFilterDrawer: () =>
        set((state) => ({ filterDrawerOpen: !state.filterDrawerOpen })),

      toasts: [],
      showToast: (message, type = "info") =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id: Math.random().toString(36).slice(2), message, type },
          ],
        })),
      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: "yys-ui",
      version: 2,
      partialize: () => ({}),
    },
  ),
);
