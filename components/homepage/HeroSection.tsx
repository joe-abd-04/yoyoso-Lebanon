"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // Latest index for event handlers (no stale closures, no re-subscribing).
  const indexRef = useRef(0);
  indexRef.current = index;

  // Auto-rotate, restarted on any manual nav so a tap/swipe gives the new slide
  // a fresh interval rather than flipping immediately.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex((p) => (p + 1) % SLIDES.length);
    }, ROTATE_MS);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const goTo = useCallback(
    (i: number) => {
      const len = SLIDES.length;
      const target = ((i % len) + len) % len;
      setDirection(target >= indexRef.current ? 1 : -1);
      setIndex(target);
      startTimer(); // reset auto-rotate on manual navigation
    },
    [startTimer],
  );

  const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  // Horizontal swipe for touch/pointer devices. `touch-action: pan-y` on the
  // banner lets vertical page scrolling continue while we own horizontal drags.
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // Treat as a swipe only if it's clearly horizontal (ignores taps + scrolls).
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

  const slide = SLIDES[index];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-8">
      <div
        className="relative h-[300px] overflow-hidden rounded-3xl shadow-[0_24px_60px_-24px_rgba(27,168,155,0.6)] md:h-[460px]"
        style={{ background: slide.gradient, touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >

        {/* Soft light blob (top-right) + a second deeper one (bottom-left) for depth */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full blur-3xl md:h-[500px] md:w-[500px]"
          style={{ backgroundColor: slide.accentGlow }}
        />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-[260px] w-[260px] rounded-full bg-white/10 blur-3xl" />
        {/* Subtle corner vignette — adds depth and keeps the text crisp. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_18%_0%,transparent_45%,rgba(0,0,0,0.16))]"
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
                  className="group/btn inline-flex items-center gap-2 rounded-button bg-white px-5 py-2.5 text-sm font-bold text-primary-dark shadow-md transition-[transform,box-shadow] duration-200 [transition-timing-function:var(--ease-soft)] hover:-translate-y-0.5 hover:shadow-xl md:px-6 md:py-3 md:text-base"
                >
                  {slide.cta}
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </Link>
                {slide.secondaryCta && slide.secondaryHref && (
                  <Link
                    href={slide.secondaryHref}
                    className="inline-flex items-center gap-1.5 rounded-button border border-white/45 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-[transform,background-color] duration-200 [transition-timing-function:var(--ease-soft)] hover:-translate-y-0.5 hover:bg-white/15 md:px-5 md:py-3"
                  >
                    {slide.secondaryCta}
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Illustration — right: a layered "halo" of concentric rings around a
                softly glowing icon. Reads more premium than a flat icon box. */}
            <div
              aria-hidden="true"
              className="pointer-events-none relative hidden h-44 w-44 shrink-0 select-none items-center justify-center md:flex"
            >
              <span className="absolute inset-0 rounded-full border border-white/15" />
              <span className="absolute inset-5 rounded-full border border-white/20" />
              <span className="absolute inset-10 rounded-full bg-white/10 shadow-[inset_0_1px_12px_rgba(255,255,255,0.25)] backdrop-blur-sm" />
              <slide.IllustrationIcon
                size={62}
                strokeWidth={1.25}
                className="relative text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              />
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

        {/* Dots — each is a 44px-tall touch target (a small visible bar centred
            inside), so they're easy to tap on a phone. */}
        <div className="absolute bottom-1 left-1/2 z-30 flex -translate-x-1/2 items-center">
          {SLIDES.map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={active}
                className="flex h-11 items-center justify-center px-2.5"
                style={{ touchAction: "manipulation" }}
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
