"use client";

import { motion, type Variants } from "framer-motion";
import { Truck, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";

const BADGES = [
  {
    Icon: Truck,
    title: "Fast Delivery",
    text: "Quick delivery across Lebanon",
    accentColor: "#2BC4B6",
    bgTint: "#EEFBF9",
  },
  {
    Icon: MessageCircle,
    title: "WhatsApp Ordering",
    text: "Order easily on WhatsApp",
    accentColor: "#25d366",
    bgTint: "#F0FDF4",
  },
  {
    Icon: RotateCcw,
    title: "Easy Returns",
    text: "Hassle-free return policy",
    accentColor: "#6366F1",
    bgTint: "#EEF2FF",
  },
  {
    Icon: ShieldCheck,
    title: "Quality Products",
    text: "Carefully selected items",
    accentColor: "#F59E0B",
    bgTint: "#FFFBEB",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function TrustBadges() {
  return (
    <section className="border-y border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {BADGES.map(({ Icon, title, text, accentColor, bgTint }, i) => (
            // Outer: one-time scroll reveal (Framer). Inner: continuous float —
            // separate elements so the two transforms never fight. The negative,
            // staggered delay puts each badge at a different point in the cycle
            // so they drift out of unison (more natural). Reduced-motion users
            // get them static (global prefers-reduced-motion rule).
            <motion.div key={title} variants={itemVariants}>
              <div
                className="flex items-center gap-3 animate-badge-float will-change-transform"
                style={{ animationDelay: `${-i * 0.9}s` }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: bgTint }}
                >
                  <Icon size={20} strokeWidth={1.75} style={{ color: accentColor }} />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-xs font-bold leading-tight text-text-primary sm:text-sm">
                    {title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-text-secondary sm:text-xs">
                    {text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
