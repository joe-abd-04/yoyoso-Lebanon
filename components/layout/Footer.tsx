"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ChevronDown } from "lucide-react";
import { siteConfig } from "@/data/config";
import { buildSupportWhatsAppUrl } from "@/lib/whatsapp";
import { useContactInfo } from "@/components/shared/SettingsProvider";

// ── Brand icon SVGs (lucide-react 1.x dropped social brand icons) ─────────────

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

// ── Static data ───────────────────────────────────────────────────────────────

const SHOP_SECTION: FooterSection = {
  title: "Shop",
  links: [
    { label: "All Categories", href: "/category" },
    { label: "New Arrivals", href: "/category/new-arrivals" },
    { label: "On Sale", href: "/category/on-sale" },
  ],
};

/** Help & Support links. The WhatsApp link uses the editable contact number. */
function helpSection(whatsappUrl: string): FooterSection {
  return {
    title: "Help & Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "WhatsApp Support", href: whatsappUrl, external: true },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Return & Exchange", href: "/return-policy" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  };
}

// ── Accordion section (mobile-collapsible, always open on desktop) ────────────

function AccordionSection({ section }: { section: FooterSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border lg:border-none">
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left lg:hidden"
        aria-expanded={open}
      >
        <span className="font-heading font-semibold text-text-primary">
          {section.title}
        </span>
        <ChevronDown
          size={18}
          className={`text-text-secondary transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Desktop heading — always visible */}
      <h3 className="mb-4 hidden font-heading font-semibold text-text-primary lg:block">
        {section.title}
      </h3>

      {/* Links */}
      <ul
        className={`space-y-3 overflow-hidden transition-all duration-300 lg:max-h-none lg:opacity-100 lg:pb-0 ${
          open ? "max-h-80 pb-4 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {section.links.map((link) =>
          link.external ? (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            </li>
          ) : (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

export default function Footer() {
  const contact = useContactInfo();
  const supportWhatsAppUrl = buildSupportWhatsAppUrl(contact.whatsapp);
  const HELP_SECTION = helpSection(supportWhatsAppUrl);
  return (
    <footer className="mt-16 bg-card">
      {/* Brand keyline — a thin teal gradient finishing the page. */}
      <div
        aria-hidden="true"
        className="h-0.5 w-full bg-gradient-to-r from-primary via-primary-dark to-primary"
      />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* ── Section 1: Brand ── */}
          <div>
            {/* Logo — bg-card footer is light, so the teal wordmark shows fine. */}
            <Link href="/" aria-label="YOYOSO home" className="mb-3 inline-flex items-center">
              <Image
                src="/yoyoso-logo.png"
                alt="YOYOSO"
                width={600}
                height={106}
                className="h-7 w-auto"
              />
            </Link>

            <p className="mb-5 text-sm leading-relaxed text-text-secondary">
              {siteConfig.tagline}
            </p>

            {/* Social icons */}
            <div className="flex gap-2">
              <a
                href={siteConfig.contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-button border border-border p-2 text-text-secondary transition-[transform,color,border-color,background-color] duration-200 [transition-timing-function:var(--ease-soft)] hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:text-primary"
                aria-label="YOYOSO on Facebook"
              >
                <FacebookIcon size={18} />
              </a>
              <a
                href={siteConfig.contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-button border border-border p-2 text-text-secondary transition-[transform,color,border-color,background-color] duration-200 [transition-timing-function:var(--ease-soft)] hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:text-primary"
                aria-label="YOYOSO on Instagram"
              >
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>

          {/* ── Section 2: Shop ── */}
          <div>
            <AccordionSection section={SHOP_SECTION} />
          </div>

          {/* ── Section 3: Help & Support ── */}
          <div>
            <AccordionSection section={HELP_SECTION} />
          </div>

          {/* ── Section 4: Contact ── */}
          <div>
            <h3 className="mb-4 font-heading font-semibold text-text-primary">
              Contact
            </h3>
            <div className="space-y-3">
              <a
                href={supportWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg font-semibold text-whatsapp transition-opacity hover:opacity-80"
              >
                <MessageCircle size={20} />
                {contact.phone}
              </a>

              <a
                href={siteConfig.contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-primary"
              >
                <InstagramIcon size={15} />
                @yoyoso
              </a>

              <Link
                href="/stores"
                className="block text-sm text-text-secondary transition-colors hover:text-primary"
              >
                Visit our stores →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-sm text-text-secondary sm:flex-row">
          <p>© {new Date().getFullYear()} YOYOSO. All rights reserved.</p>
          <p className="text-center">
            <span className="font-medium text-text-primary">Payment:</span>{" "}
            Cash on Delivery
          </p>
          <p>Lebanon 🇱🇧</p>
        </div>
      </div>
    </footer>
  );
}
