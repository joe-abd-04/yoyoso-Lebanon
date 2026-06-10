import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = buildMetadata({
  title: "Your Cart",
  description: "Review the items in your cart and checkout at YOYOSO.",
  path: "/cart",
});

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
        Your Cart
      </h1>
      <div className="mt-7">
        <CartView />
      </div>
    </div>
  );
}
