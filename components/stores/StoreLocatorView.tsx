"use client";

import { useState } from "react";
import { MapPin, Clock, Phone, Navigation, MessageCircle } from "lucide-react";
import type { Store } from "@/data/stores";
import { buildSupportWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const REGIONS = ["All", "Beirut", "Mount Lebanon", "North Lebanon"] as const;
type Region = (typeof REGIONS)[number];

function regionOf(storeRegion: string): Region {
  if (storeRegion.includes("Beirut")) return "Beirut";
  if (storeRegion.includes("Mount Lebanon")) return "Mount Lebanon";
  if (storeRegion.includes("North Lebanon")) return "North Lebanon";
  return "All";
}

const REGION_COLORS: Record<string, string> = {
  "Beirut": "bg-[#D6F5F0] text-[#1BA89B]",
  "Mount Lebanon": "bg-[#E7F0FD] text-[#3B82F6]",
  "North Lebanon": "bg-[#E4F4F1] text-[#059669]",
};

const cleanAddress = (addr: string) =>
  addr.startsWith("TODO") ? "Address coming soon" : addr;

export default function StoreLocatorView({ stores }: { stores: Store[] }) {
  const [activeRegion, setActiveRegion] = useState<Region>("All");
  const waUrl = buildSupportWhatsAppUrl();

  const filtered =
    activeRegion === "All"
      ? stores
      : stores.filter((s) => regionOf(s.region) === activeRegion);

  return (
    <div>
      {/* Hero */}
      <div
        className="py-14 text-white"
        style={{
          background: "linear-gradient(135deg, #1BA89B 0%, #2BC4B6 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find a Store Near You
          </h1>
          <p className="mt-2 text-lg text-white/85">
            Visit us at any of our 5 locations across Lebanon
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRegion(r)}
              className={cn(
                "rounded-badge border px-4 py-2 text-sm font-medium transition-colors",
                activeRegion === r
                  ? "border-primary bg-primary text-white"
                  : "border-border text-text-secondary hover:border-primary hover:text-primary",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Store cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((store) => {
            const region = regionOf(store.region);
            const regionColor =
              REGION_COLORS[region] ?? "bg-surface text-text-secondary";
            const dirUrl =
              store.mapsUrl ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                store.name + " " + store.region,
              )}`;

            return (
              <div
                key={store.slug}
                className="flex flex-col rounded-card bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-heading text-lg font-bold text-text-primary">
                    {store.name}
                  </h2>
                  <span
                    className={cn(
                      "shrink-0 rounded-badge px-2.5 py-1 text-xs font-semibold",
                      regionColor,
                    )}
                  >
                    {region}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-sm text-text-secondary">
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                    <span>{cleanAddress(store.address)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="shrink-0 text-primary" />
                    <span>{store.hours}</span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="shrink-0 text-primary" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex gap-3 pt-1">
                  <a
                    href={dirUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-button border border-border py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                  >
                    <Navigation size={15} />
                    Get Directions
                  </a>
                  {store.phone && (
                    <a
                      href={`tel:${store.phone}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-button border border-border py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                    >
                      <Phone size={15} />
                      Call Us
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 rounded-card bg-whatsapp/10 px-6 py-10 text-center">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Chat with us on WhatsApp — we&apos;re happy to help
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-button bg-whatsapp px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle size={18} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
