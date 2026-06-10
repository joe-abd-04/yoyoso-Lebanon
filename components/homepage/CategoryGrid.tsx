"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCategories } from "@/components/shared/CategoriesProvider";
import { CATEGORY_ICONS } from "@/components/shared/categoryIcons";

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
};

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function CategoryGrid() {
  const categories = useCategories();
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="text-center"
      >
        <h2 className="font-heading text-[26px] font-extrabold tracking-tight text-text-primary sm:text-[32px]">
          Shop by Category
        </h2>
        <p className="mt-2 text-sm text-text-secondary sm:text-base">
          Explore our full range of affordable lifestyle products
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-5"
      >
        {categories.map((cat) => {
          const def = CATEGORY_ICONS[cat.slug];
          const Icon = def?.Icon;
          return (
            <motion.div key={cat.slug} variants={tileVariants}>
              <Link
                href={`/category/${cat.slug}`}
                className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white p-3.5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] sm:gap-3 sm:p-5"
              >
                {/* Icon container */}
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-250 group-hover:scale-110 sm:h-13 sm:w-13 sm:rounded-2xl"
                  style={{ backgroundColor: def?.bgTint ?? "#EEFBF9" }}
                >
                  {Icon && (
                    <Icon
                      size={20}
                      strokeWidth={1.75}
                      style={{ color: def?.accentColor ?? "#2BC4B6" }}
                    />
                  )}
                </div>
                <span className="text-[11px] font-semibold leading-tight text-text-primary sm:text-xs">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-8 text-center"
      >
        <Link
          href="/category"
          className="inline-flex items-center gap-2 rounded-button border border-border bg-white px-6 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:border-primary hover:shadow-md"
        >
          View All Categories
          <ArrowRight size={15} />
        </Link>
      </motion.div>
    </section>
  );
}
