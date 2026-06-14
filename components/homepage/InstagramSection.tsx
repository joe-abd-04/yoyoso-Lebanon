"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useInstagram } from "@/components/shared/SettingsProvider";

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

const tileVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function InstagramSection() {
  const { handle, profileUrl, posts } = useInstagram();

  // Curated gallery is empty → hide the whole section (incl. its spacing).
  if (posts.length === 0) return null;

  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
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
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-primary-dark"
            >
              @{handle}
            </a>{" "}
            · Follow us for daily inspo
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          transition={{ staggerChildren: 0.06 }}
          className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3"
        >
          {posts.map((post, i) => (
            <motion.a
              key={post.image}
              variants={tileVariants}
              href={post.url || profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View YOYOSO post ${i + 1} on Instagram`}
              className="group relative block aspect-square overflow-hidden rounded-card bg-surface"
            >
              <Image
                src={post.image}
                alt={`@${handle} on Instagram`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 420px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Hover veil + icon */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
                <InstagramIcon />
              </div>
              <ArrowUpRight
                size={16}
                className="absolute right-2.5 top-2.5 text-white opacity-0 drop-shadow transition-opacity duration-200 group-hover:opacity-100"
              />
            </motion.a>
          ))}
        </motion.div>

        <div className="mt-8 text-center">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[12px] px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)",
            }}
          >
            <InstagramIcon />
            Follow @{handle}
          </a>
        </div>
      </div>
    </section>
  );
}
