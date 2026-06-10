import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata: Metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your order at YOYOSO.",
  path: "/checkout",
});

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
        Checkout
      </h1>
      <CheckoutView />
    </div>
  );
}
