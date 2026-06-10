import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping Policy | YOYOSO",
  description:
    "Learn about YOYOSO Lebanon's shipping and delivery policy — flat $4.50 delivery fee, delivered within 4 working days across Lebanon.",
};

const WA_URL = "https://wa.me/96103133307";

export default function ShippingPolicyPage() {
  return (
    <div>
      {/* Hero */}
      <div
        className="py-12 text-white"
        style={{
          background: "linear-gradient(135deg, #1BA89B 0%, #2BC4B6 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <nav className="mb-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span>/</span>
            <span className="text-white">Shipping Policy</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Shipping Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-8">
        <p className="text-sm text-text-secondary">Last updated: January 2025</p>

        <div className="mt-8 space-y-10" style={{ lineHeight: "1.8" }}>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Delivery Coverage
            </h2>
            <p className="mt-3 text-text-secondary">
              We deliver to all regions across Lebanon.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Delivery Timeframe
            </h2>
            <p className="mt-3 text-text-secondary">
              Orders are delivered within <strong className="text-text-primary">4 working days</strong> from the date of order confirmation. Orders placed on weekends or public holidays will be processed the next working day.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Delivery Fee
            </h2>
            <p className="mt-3 text-text-secondary">
              A flat delivery fee of <strong className="text-text-primary">$4.50</strong> applies to all orders, regardless of location within Lebanon.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Order Confirmation
            </h2>
            <p className="mt-3 text-text-secondary">
              Once you place your order, you will receive a confirmation email with your order details.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Order Updates
            </h2>
            <p className="mt-3 text-text-secondary">
              If you need any information about your order, please contact us on WhatsApp at{" "}
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                03 133 307
              </a>{" "}
              or email{" "}
              <a href="mailto:lebanon@bestfor-lb.com" className="font-medium text-primary hover:underline">
                lebanon@bestfor-lb.com
              </a>{" "}
              and we&apos;ll be happy to help.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Questions?
            </h2>
            <p className="mt-3 text-text-secondary">
              For any questions about your delivery, please contact us:
            </p>
            <ul className="mt-3 space-y-1.5 text-text-secondary">
              <li>
                WhatsApp:{" "}
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  03 133 307
                </a>
              </li>
              <li>
                Email:{" "}
                <a
                  href="mailto:lebanon@bestfor-lb.com"
                  className="font-medium text-primary hover:underline"
                >
                  lebanon@bestfor-lb.com
                </a>
              </li>
            </ul>
          </section>

        </div>

        {/* WhatsApp CTA */}
        <div className="mt-12 rounded-card bg-surface px-6 py-8 text-center">
          <p className="font-medium text-text-primary">
            Have a question about your delivery?
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Chat with us on WhatsApp — we&apos;re happy to help.
          </p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-button bg-whatsapp px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle size={18} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
