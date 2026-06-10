"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Home } from "lucide-react";

interface Banner {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
  Icon: React.ElementType;
  accentShape: string;
}

const BANNERS: Banner[] = [
  {
    title: "Beauty Essentials",
    subtitle: "Glow up with our best picks",
    cta: "Shop Beauty",
    href: "/category/beauty",
    gradient: "linear-gradient(135deg, #2BC4B6 0%, #1BA89B 100%)",
    Icon: Sparkles,
    accentShape: "rgba(255,255,255,0.12)",
  },
  {
    title: "Home Must-Haves",
    subtitle: "Make your space beautiful",
    cta: "Explore Home",
    href: "/category/home-living",
    gradient: "linear-gradient(135deg, #1BA89B 0%, #3BE0D0 100%)",
    Icon: Home,
    accentShape: "rgba(255,255,255,0.10)",
  },
];

export default function FeatureBanners() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {BANNERS.map((banner, i) => (
          <motion.div
            key={banner.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
          >
            <Link
              href={banner.href}
              className="group relative flex h-[160px] items-center justify-between overflow-hidden rounded-2xl px-7 text-white transition-transform duration-300 hover:scale-[1.015] md:h-[200px] md:px-10"
              style={{ background: banner.gradient }}
            >
              {/* Background accent blob */}
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full blur-2xl"
                style={{ backgroundColor: banner.accentShape }}
              />

              {/* Text */}
              <div className="relative z-10 max-w-[65%]">
                <h3 className="font-heading text-xl font-extrabold tracking-tight drop-shadow-sm md:text-2xl">
                  {banner.title}
                </h3>
                <p className="mt-1 text-sm text-white/85 md:text-base">
                  {banner.subtitle}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2 text-sm font-bold text-primary shadow-sm transition-all duration-200 group-hover:gap-3 group-hover:shadow-md">
                  {banner.cta}
                  <ArrowRight size={14} />
                </span>
              </div>

              {/* Icon illustration */}
              <div
                aria-hidden="true"
                className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 md:h-24 md:w-24"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              >
                <banner.Icon
                  size={40}
                  strokeWidth={1.25}
                  className="text-white/90"
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
