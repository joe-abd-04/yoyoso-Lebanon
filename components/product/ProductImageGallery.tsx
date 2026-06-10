"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  /** Overlay badge label shown top-left (e.g. "SALE", "NEW"). */
  badge?: string | null;
  /**
   * Optional controlled active-image index. When provided (together with
   * onActiveIndexChange), the parent owns which image is shown — e.g. so a
   * variant selection can switch the photo. Falls back to internal state when
   * omitted, preserving the original standalone behaviour.
   */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export default function ProductImageGallery({
  images,
  productName,
  badge,
  activeIndex,
  onActiveIndexChange,
}: ProductImageGalleryProps) {
  const safeImages = images.length > 0 ? images : [""];

  const [internalActive, setInternalActive] = useState(0);
  const controlled = activeIndex !== undefined;
  const active = Math.min(
    controlled ? activeIndex! : internalActive,
    safeImages.length - 1,
  );
  const setActive = (i: number) => {
    if (controlled) onActiveIndexChange?.(i);
    else setInternalActive(i);
  };

  const [mobileIndex, setMobileIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const onMobileScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== mobileIndex) {
      setMobileIndex(idx);
      if (controlled) onActiveIndexChange?.(idx);
    }
  };

  // When the active image is driven from outside (variant selection), scroll the
  // mobile carousel to match so both layouts stay in sync.
  useEffect(() => {
    if (!controlled) return;
    const el = trackRef.current;
    if (!el) return;
    const left = active * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) > 4) {
      el.scrollTo({ left, behavior: "smooth" });
    }
    setMobileIndex(active);
  }, [active, controlled]);

  const badgeOverlay = badge ? (
    <span className="absolute left-3 top-3 z-10 rounded-badge bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
      {badge}
    </span>
  ) : null;

  return (
    <div>
      {/* ── Desktop ── */}
      <div className="hidden md:block">
        <div className="group relative aspect-square overflow-hidden rounded-card bg-surface">
          {badgeOverlay}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeImages[active]}
            alt={productName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Thumbnails (only if >1 image) */}
        {safeImages.length > 1 && (
          <div className="mt-3 flex gap-2">
            {safeImages.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "h-20 w-20 shrink-0 overflow-hidden rounded-button border-2 bg-surface transition-colors",
                  i === active ? "border-primary" : "border-transparent",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${productName} thumbnail ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile ── */}
      <div className="md:hidden">
        <div className="relative">
          {badgeOverlay}
          <div
            ref={trackRef}
            onScroll={onMobileScroll}
            className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto rounded-card bg-surface"
          >
            {safeImages.map((src, i) => (
              <div key={i} className="aspect-square w-full shrink-0 snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={productName}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Dots (only if >1 image) */}
          {safeImages.length > 1 && (
            <div className="mt-3 flex justify-center gap-2">
              {safeImages.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200",
                    i === mobileIndex ? "w-6 bg-primary" : "w-2 bg-border",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
