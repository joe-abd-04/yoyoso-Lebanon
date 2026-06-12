import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions | YOYOSO",
  description:
    "YOYOSO Lebanon's terms and conditions — governing law, terms of sale, intellectual property, and more.",
};

const WA_URL = "https://wa.me/96103133307";

export default function TermsPage() {
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
            <span className="text-white">Terms &amp; Conditions</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Terms &amp; Conditions
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-8">
        <p className="text-sm text-text-secondary">Last updated: January 2025</p>

        <div className="mt-8 space-y-10" style={{ lineHeight: "1.8" }}>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              General Information
            </h2>
            <p className="mt-3 text-text-secondary">
              The website <strong className="text-text-primary">yoyoso-lb.com</strong> is operated by <strong className="text-text-primary">Construst Group S.A.R.L</strong>, registered in Lebanon with offices at Dhour Street, Amioun, Koura, Lebanon and Dbayeh, Metn, Lebanon. By accessing or using this website, you agree to be bound by these Terms &amp; Conditions.
            </p>
            <p className="mt-3 text-text-secondary">
              We reserve the right to update these terms at any time. Continued use of the website following any changes constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Intellectual Property
            </h2>
            <p className="mt-3 text-text-secondary">
              All content on this website — including but not limited to text, graphics, logos, images, product descriptions, and software — is the property of YOYOSO Lebanon / Construst Group S.A.R.L and is protected by applicable intellectual property laws. You may not reproduce, distribute, or use any content from this website without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Links to Other Websites
            </h2>
            <p className="mt-3 text-text-secondary">
              Our website may contain links to third-party websites for your convenience. YOYOSO Lebanon is not responsible for the content, privacy practices, or accuracy of information on any linked third-party websites. Visiting such links is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Terms of Sale
            </h2>
            <ul className="mt-3 space-y-3 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong className="text-text-primary">Order acceptance:</strong> All orders are subject to product availability. We reserve the right to refuse or cancel any order at our sole discretion.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong className="text-text-primary">Order accuracy:</strong> All information provided when placing an order (name, address, phone number) must be accurate and complete. YOYOSO Lebanon is not responsible for failed deliveries due to incorrect information.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong className="text-text-primary">Delivery:</strong> Orders are delivered within 4 working days from order confirmation. A flat delivery fee of $4.50 applies to all orders across Lebanon.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong className="text-text-primary">Payment:</strong> We currently accept Cash on Delivery only. Payment is collected upon delivery of your order.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong className="text-text-primary">Eligibility:</strong> You must be legally capable of entering into a binding contract to place an order. By placing an order, you confirm that you have legal capacity to do so.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Indemnification
            </h2>
            <p className="mt-3 text-text-secondary">
              You agree to indemnify and hold harmless YOYOSO Lebanon, Construst Group S.A.R.L, and their officers, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your use of this website or your violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Limitation of Liability
            </h2>
            <p className="mt-3 text-text-secondary">
              To the fullest extent permitted by applicable law, YOYOSO Lebanon and Construst Group S.A.R.L shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of this website or any products purchased from us. Our total liability shall not exceed the value of the order in question.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Disclaimer
            </h2>
            <p className="mt-3 text-text-secondary">
              This website and its content are provided on an &ldquo;as is&rdquo; basis. YOYOSO Lebanon makes no warranties, express or implied, regarding the accuracy, completeness, or fitness for a particular purpose of any information on this website.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Product Information
            </h2>
            <p className="mt-3 text-text-secondary">
              We make every effort to display product information and pricing accurately. However, prices may change without notice and product availability is not guaranteed across all store locations. In the event of a pricing error, we reserve the right to cancel the affected order and notify you accordingly.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Alterations
            </h2>
            <p className="mt-3 text-text-secondary">
              YOYOSO Lebanon reserves the right to update, modify, or discontinue any part of this website, its content, or these Terms &amp; Conditions at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Governing Law
            </h2>
            <p className="mt-3 text-text-secondary">
              These Terms &amp; Conditions are governed by and construed in accordance with the laws of Lebanon. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Lebanon.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-primary">
              Contact Us
            </h2>
            <p className="mt-3 text-text-secondary">
              For any questions regarding these Terms &amp; Conditions, please contact us:
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
            Have questions about our terms?
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            We&apos;re happy to clarify anything — just reach out.
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
