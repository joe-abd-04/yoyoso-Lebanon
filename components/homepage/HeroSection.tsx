"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, ShoppingBag, Home } from "lucide-react";

interface Slide {
  headline: string;
  subheadline: string;
  cta: string;
  secondaryCta?: string;
  secondaryHref?: string;
  gradient: string;
  primaryHref: string;
  accentGlow: string;
  IllustrationIcon: React.ElementType;
  illustrationColor: string;
}

const SLIDES: Slide[] = [
  {
    headline: "Aesthetic. Fashionable. Affordable.",
    subheadline: "Discover beauty, home, fashion & more",
    cta: "Shop Now",
    secondaryCta: "New Arrivals",
    secondaryHref: "/category/new-arrivals",
    gradient: "linear-gradient(135deg, #2BC4B6 0%, #1BA89B 40%, #159088 100%)",
    accentGlow: "rgba(43,196,182,0.35)",
    primaryHref: "/category",
    IllustrationIcon: Sparkles,
    illustrationColor: "rgba(255,255,255,0.15)",
  },
  {
    headline: "New Arrivals Every Week",
    subheadline: "Be the first to get the latest products",
    cta: "View New Arrivals",
    gradient: "linear-gradient(135deg, #1BA89B 0%, #2BC4B6 50%, #5DD6CB 100%)",
    accentGlow: "rgba(43,196,182,0.3)",
    primaryHref: "/category/new-arrivals",
    IllustrationIcon: ShoppingBag,
    illustrationColor: "rgba(255,255,255,0.15)",
  },
  {
    headline: "Make Your Home Beautiful",
    subheadline: "Fresh home décor & lifestyle accessories",
    cta: "Shop Home",
    gradient: "linear-gradient(135deg, #2BC4B6 0%, #3DCFC1 50%, #5BE0D4 100%)",
    accentGlow: "rgba(43,196,182,0.3)",
    primaryHref: "/category/home-living",
    IllustrationIcon: Home,
    illustrationColor: "rgba(255,255,255,0.15)",
  },
];

const ROTATE_MS = 4500;

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (i: number) => {
      const next = ((i % SLIDES.length) + SLIDES.length) % SLIDES.length;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const id = setInterval(() => {
      setDirection(1);
      setIndex((p) => (p + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [index]);

  const slide = SLIDES[index];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-8">
      <div className="relative h-[300px] overflow-hidden rounded-2xl md:h-[460px]"
        style={{ background: slide.gradient }}>

        {/* Animated background blob */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full blur-3xl md:h-[500px] md:w-[500px]"
          style={{ backgroundColor: slide.accentGlow }}
        />

        {/* Slide content */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-between gap-4 px-6 md:px-14"
          >
            {/* Text — left */}
            <div className="relative z-10 max-w-md text-white">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm"
              >
                YOYOSO Lebanon
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="font-heading text-2xl font-extrabold leading-[1.15] tracking-tight drop-shadow-sm md:text-5xl"
              >
                {slide.headline}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.35 }}
                className="mt-2 text-sm text-white/85 md:mt-3 md:text-lg"
              >
                {slide.subheadline}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.35 }}
                className="mt-5 flex flex-wrap gap-3 md:mt-7"
              >
                <Link
                  href={slide.primaryHref}
                  className="inline-flex items-center gap-2 rounded-[10px] bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg md:px-6 md:py-3 md:text-base"
                >
                  {slide.cta}
                  <ArrowRight size={16} />
                </Link>
                {slide.secondaryCta && slide.secondaryHref && (
                  <Link
                    href={slide.secondaryHref}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/40 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/15 md:px-5 md:py-3"
                  >
                    {slide.secondaryCta}
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Illustration — right */}
            <div
              aria-hidden="true"
              className="pointer-events-none hidden shrink-0 select-none md:flex"
            >
              <div
                className="flex h-40 w-40 items-center justify-center rounded-3xl"
                style={{ backgroundColor: slide.illustrationColor }}
              >
                <slide.IllustrationIcon
                  size={80}
                  strokeWidth={1}
                  className="text-white/70"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next arrows */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-all hover:bg-black/35 sm:flex"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-all hover:bg-black/35 sm:flex"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-7 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
