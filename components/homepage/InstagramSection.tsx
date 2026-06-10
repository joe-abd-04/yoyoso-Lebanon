"use client";

import { motion, type Variants } from "framer-motion";
import { siteConfig } from "@/data/config";
import { ArrowUpRight } from "lucide-react";

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const TILES: { gradient: string; label: string }[] = [
  { gradient: "linear-gradient(135deg, #2BC4B6 0%, #1BA89B 100%)", label: "Beauty" },
  { gradient: "linear-gradient(135deg, #FF7A6B 0%, #FF9A8E 100%)", label: "Style" },
  { gradient: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)", label: "Fashion" },
  { gradient: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)", label: "Home" },
  { gradient: "linear-gradient(135deg, #1BA89B 0%, #3BE0D0 100%)", label: "Lifestyle" },
  { gradient: "linear-gradient(135deg, #D946EF 0%, #EC4899 100%)", label: "Deals" },
];

const tileVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function InstagramSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-col items-center gap-1 text-center"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white shadow-sm">
          <InstagramIcon />
        </div>
        <h2 className="mt-3 font-heading text-[26px] font-extrabold tracking-tight text-text-primary sm:text-3xl">
          Follow Us on Instagram
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          @yoyoso · Follow us for daily inspo
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
        transition={{ staggerChildren: 0.06 }}
        className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-3"
      >
        {TILES.map((tile) => (
          <motion.a
            key={tile.label}
            variants={tileVariants}
            href={siteConfig.contact.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${tile.label} on Instagram`}
            className="group relative flex aspect-square items-end overflow-hidden rounded-card p-3 sm:p-4"
            style={{ background: tile.gradient }}
          >
            <span className="relative z-10 text-xs font-bold text-white/90 drop-shadow-sm">
              {tile.label}
            </span>
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
            <ArrowUpRight
              size={16}
              className="absolute right-2.5 top-2.5 text-white/70 opacity-0 transition-all duration-200 group-hover:opacity-100"
            />
          </motion.a>
        ))}
      </motion.div>

      <div className="mt-8 text-center">
        <a
          href={siteConfig.contact.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[12px] px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)",
          }}
        >
          <InstagramIcon />
          Follow @yoyoso
        </a>
      </div>
    </section>
  );
}
