"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { MapPin, Clock, Phone, Navigation, ArrowRight, Store } from "lucide-react";
import type { Store as StoreData } from "@/data/stores";

const cleanAddress = (address: string) =>
  address.startsWith("TODO") ? "Address coming soon" : address;

const directionsUrl = (mapsUrl: string, query: string) =>
  mapsUrl ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function StoreLocatorPreview({
  stores,
}: {
  stores: StoreData[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex items-center justify-center gap-3 text-center"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Store size={20} strokeWidth={1.75} className="text-primary" />
        </div>
        <div className="text-left">
          <h2 className="font-heading text-[26px] font-extrabold tracking-tight text-text-primary sm:text-3xl">
            Visit Our Stores
          </h2>
          <p className="text-sm text-text-secondary">Find us across Lebanon</p>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
        transition={{ staggerChildren: 0.08 }}
        className="scrollbar-hide mt-8 grid grid-flow-col auto-cols-[80vw] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3"
      >
        {stores.map((store) => (
          <motion.div
            key={store.slug}
            variants={cardVariants}
            className="flex snap-start flex-col rounded-card bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
          >
            <h3 className="font-heading text-base font-bold text-text-primary">
              {store.name}
            </h3>

            <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-badge bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <MapPin size={11} />
              {store.region}
            </span>

            <div className="mt-3 space-y-1.5 text-sm text-text-secondary">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-primary/60" />
                <span>{cleanAddress(store.address)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="shrink-0 text-primary/60" />
                <span>{store.hours}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2 pt-1">
              <a
                href={directionsUrl(store.mapsUrl, `${store.name} ${store.region}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-button border border-border py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
              >
                <Navigation size={14} />
                Directions
              </a>
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-button border border-border py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  <Phone size={14} />
                  Call Us
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 text-center">
        <Link
          href="/stores"
          className="inline-flex items-center gap-2 rounded-button border border-border bg-white px-6 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary hover:shadow-md"
        >
          View All Stores
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
