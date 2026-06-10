import { getNewArrivals } from "@/lib/data/products";
import ProductSection from "./ProductSection";

export default async function NewArrivals() {
  const newArrivals = await getNewArrivals(8);

  return (
    <ProductSection
      title="✨ New Arrivals"
      subtitle="The latest products added to our store"
      products={newArrivals}
      viewAllHref="/category/new-arrivals"
      viewAllLabel="View All New Arrivals"
    />
  );
}
