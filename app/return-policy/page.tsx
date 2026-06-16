import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Return & Exchange Policy | YOYOSO",
  description:
    "YOYOSO Lebanon's return and exchange policy — 14-day returns on unused items for exchange or store credit only (no cash refunds).",
};

const WA_URL = "https://wa.me/96103133307";

export default function ReturnPolicyPage() {
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
            <span className="text-white">Return &amp; Exchange Policy</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Return &amp; Exchange Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-8">
        <p className="text-sm text-text-secondary">Last updated: January 2025</p>

        <div className="mt-8 space-y-10" style={{ lineHeight: "1.8" }}>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Our Commitment
            </h2>
            <p className="mt-3 text-text-secondary">
              At YOYOSO Lebanon, we want you to be completely satisfied with your purchase. If you are not happy with your order, we are here to help.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Return Period
            </h2>
            <p className="mt-3 text-text-secondary">
              You have <strong className="text-text-primary">14 days</strong> from the date of receiving your order to request a return.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Return Conditions
            </h2>
            <p className="mt-3 text-text-secondary">
              To be eligible for a return, your item must be:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Unused and in the same condition as received
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                In its original packaging with all tags intact
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Accompanied by proof of purchase (order number)
              </li>
            </ul>
            <p className="mt-3 text-text-secondary">
              Items that do not meet these conditions will not be accepted for return.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Non-Returnable Items
            </h2>
            <p className="mt-3 text-text-secondary">
              The following items cannot be returned:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Any item not in its original condition
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Damaged or missing parts items (unless due to our error)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Seasonal items after the season has passed
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Items marked as final sale
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              How to Initiate a Return
            </h2>
            <ol className="mt-3 space-y-3 text-text-secondary">
              {[
                "Contact us on WhatsApp at 03 133 307 within 14 days of receiving your order.",
                "Provide your order number and reason for return.",
                "Our team will guide you through the return process.",
                "Once approved, arrange to return the item to your nearest YOYOSO store, or we will arrange collection.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Exchange or Store Credit
            </h2>
            <p className="mt-3 text-text-secondary">
              We do <strong className="text-text-primary">not</strong> offer cash refunds. Once your return is received and inspected, approved items are either <strong className="text-text-primary">exchanged</strong> for another product or issued as <strong className="text-text-primary">store credit</strong> of equal value.
            </p>
            <p className="mt-3 text-text-secondary">
              Store credit can be used towards any future purchase. If you would like to exchange an item for a different product, contact us on WhatsApp and our team will be happy to assist you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Questions?
            </h2>
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
            Want to initiate a return?
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Message us on WhatsApp and we&apos;ll guide you through the process.
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
