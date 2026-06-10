"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false during SSR and the initial client hydration render, then true
 * afterwards. Lets components that depend on client-only state (e.g. the
 * localStorage-persisted cart) avoid hydration mismatches without calling
 * setState inside an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
