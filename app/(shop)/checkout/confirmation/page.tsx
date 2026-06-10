import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ConfirmationView from "@/components/checkout/ConfirmationView";

export const metadata: Metadata = buildMetadata({
  title: "Order Confirmed",
  description: "Your order has been placed successfully.",
  path: "/checkout/confirmation",
});

export default function ConfirmationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <ConfirmationView />
    </div>
  );
}
