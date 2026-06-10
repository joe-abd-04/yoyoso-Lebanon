"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref: string;
  viewAllLabel: string;
}

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref,
  viewAllLabel,
}: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-8">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mb-7 flex items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-heading text-[26px] font-extrabold tracking-tight text-text-primary sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
        <Link
          href={viewAllHref}
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark sm:flex"
        >
          {viewAllLabel}
          <ArrowRight size={15} />
        </Link>
      </motion.div>

      {/* Product grid */}
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={cardVariants}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile view-all */}
      <div className="mt-5 sm:hidden">
        <Link
          href={viewAllHref}
          className="flex items-center justify-center gap-1.5 rounded-button border border-border py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary"
        >
          {viewAllLabel}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
