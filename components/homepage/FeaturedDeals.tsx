import { getProducts } from "@/lib/data/products";
import ProductSection from "./ProductSection";

export default async function FeaturedDeals() {
  const deals = (await getProducts())
    .filter((p) => p.badge === "SALE" || (p.discountPercent ?? 0) > 0)
    .slice(0, 8);

  return (
    <ProductSection
      title="🔥 Hot Deals"
      subtitle="Limited time offers you don't want to miss"
      products={deals}
      viewAllHref="/category/sale"
      viewAllLabel="View All Deals"
    />
  );
}
