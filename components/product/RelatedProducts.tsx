import { getRelatedProducts } from "@/lib/data/products";
import ProductRail from "@/components/product/ProductRail";

interface RelatedProductsProps {
  category: string;
  currentSlug: string;
}

export default async function RelatedProducts({
  category,
  currentSlug,
}: RelatedProductsProps) {
  const related = await getRelatedProducts(category, currentSlug, 8);

  return <ProductRail title="You Might Also Like" products={related} />;
}
