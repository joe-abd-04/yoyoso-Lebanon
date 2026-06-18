"use client";

// Wraps the app so EVERY Framer Motion animation (scroll reveals, hover lifts,
// hero transitions, whileTap) automatically honours the OS "Reduce motion"
// setting. With reducedMotion="user", transform/layout animations are skipped
// for those users (opacity still resolves), so the site stays accessible
// without per-component guards. The CSS media query in globals.css only covers
// CSS transitions/animations — this covers the JS-driven motion.

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
