import { getBestSellers } from "@/lib/data/products";
import ProductSection from "./ProductSection";

export default async function BestSellers() {
  const bestSellers = (await getBestSellers()).slice(0, 8);

  return (
    <ProductSection
      title="⭐ Best Sellers"
      subtitle="Most loved by our customers"
      products={bestSellers}
      viewAllHref="/category/best-sellers"
      viewAllLabel="View All"
    />
  );
}
