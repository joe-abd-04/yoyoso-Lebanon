import type { Product } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";

interface ProductRailProps {
  title: string;
  products: Product[];
}

/** Horizontal scroll on mobile, 4-col grid on desktop. */
export default function ProductRail({ title, products }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-5 font-heading text-xl font-bold text-text-primary sm:text-2xl">
        {title}
      </h2>
      <div className="scrollbar-hide -mx-4 grid grid-flow-col auto-cols-[60%] gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
