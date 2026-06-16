import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | YOYOSO",
  description:
    "YOYOSO Lebanon's privacy policy — how we collect, use, and protect your personal information.",
};

const WA_URL = "https://wa.me/96103133307";

export default function PrivacyPolicyPage() {
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
            <span className="text-white">Privacy Policy</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Privacy Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-8">
        <p className="text-sm text-text-secondary">Last updated: January 2025</p>

        <div className="mt-8 space-y-10" style={{ lineHeight: "1.8" }}>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Introduction
            </h2>
            <p className="mt-3 text-text-secondary">
              YOYOSO Lebanon is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you visit our website (<strong className="text-text-primary">yoyoso-lb.com</strong>) or purchase from our stores. By using our services, you agree to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Who Are We
            </h2>
            <p className="mt-3 text-text-secondary">
              YOYOSO Lebanon is operated by <strong className="text-text-primary">Construst Group S.A.R.L</strong>.
            </p>
            <ul className="mt-3 space-y-1.5 text-text-secondary">
              <li>
                <strong className="text-text-primary">Address:</strong> Dhour Street, Amioun, Koura, Lebanon / Dbayeh, Metn, Lebanon
              </li>
              <li>
                <strong className="text-text-primary">Phone:</strong>{" "}
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  03 133 307
                </a>
              </li>
              <li>
                <strong className="text-text-primary">Email:</strong>{" "}
                <a href="mailto:lebanon@bestfor-lb.com" className="text-primary hover:underline">
                  lebanon@bestfor-lb.com
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Why We Process Your Personal Information
            </h2>
            <p className="mt-3 text-text-secondary">
              We process your personal information for the following purposes:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary">
              {[
                "To fulfill and manage your orders, including delivery coordination",
                "To communicate with you about your orders and respond to your inquiries",
                "To improve our website, products, and customer service",
                "To handle returns, exchanges, and warranty claims",
                "To send you marketing communications (only with your consent)",
                "To operate CCTV in our physical stores for security purposes",
                "To comply with legal obligations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              What Personal Information We Collect
            </h2>
            <p className="mt-3 text-text-secondary">
              We may collect the following types of personal information:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary">
              {[
                "Full name and contact details (phone number, email address)",
                "Delivery address",
                "Purchase history and order details",
                "Payment information (for Cash on Delivery: confirmation details only)",
                "CCTV recordings in our physical store locations",
                "Communications with our customer service team",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              How We Collect Information
            </h2>
            <p className="mt-3 text-text-secondary">
              We collect your information in the following ways:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">Directly from you</strong> — when you place an order, create an account, contact our customer service, or fill in a form on our website
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">Via social media</strong> — when you interact with our social media pages
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">From business partners</strong> — such as delivery service providers
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Who We Share Your Information With
            </h2>
            <p className="mt-3 text-text-secondary">
              We do not sell your personal information. We may share it with:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">Delivery partners</strong> — to fulfill and deliver your orders
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">Service providers</strong> — who assist us in operating our website and business (under strict confidentiality agreements)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">Legal authorities</strong> — when required by applicable law or court order
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              How Long We Keep Your Information
            </h2>
            <ul className="mt-3 space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">Purchase records:</strong> retained for 5 years for legal and accounting purposes
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">CCTV recordings:</strong> retained for 30 days, then automatically deleted
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <strong className="text-text-primary">Marketing data:</strong> deleted upon your request or upon unsubscription
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Security Measures
            </h2>
            <p className="mt-3 text-text-secondary">
              We implement appropriate technical and organisational security measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. Access to your data is restricted to authorised personnel only.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Your Rights
            </h2>
            <p className="mt-3 text-text-secondary">
              You have the following rights regarding your personal data:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary">
              {[
                "Right of access — request a copy of the personal data we hold about you",
                "Right to rectification — request correction of inaccurate data",
                "Right to erasure — request deletion of your personal data",
                "Right to object — object to the processing of your data for marketing purposes",
                "Right to data portability — receive your data in a portable format",
              ].map((right) => (
                <li key={right} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {right}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-text-secondary">
              To exercise any of these rights, please contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Contact Us
            </h2>
            <p className="mt-3 text-text-secondary">
              For any privacy-related questions or to exercise your rights, please contact us:
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
            Questions about your privacy?
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            We&apos;re here to help. Contact us anytime.
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
