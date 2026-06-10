/**
 * SEO helpers: page metadata builders + JSON-LD structured data.
 */

import type { Metadata } from "next";
import { siteConfig } from "@/data/config";
import { formatUSD } from "@/lib/formatPrice";
import type { Product } from "@/data/products";

// TODO: set the real production domain.
export const SITE_URL = "https://yoyoso.com";

interface PageMetaInput {
  title?: string;
  description?: string;
  path?: string;
  images?: string[];
}

/** Build Next.js Metadata with sensible site-wide defaults + Open Graph. */
export function buildMetadata({
  title,
  description,
  path = "/",
  images,
}: PageMetaInput = {}): Metadata {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const desc = description ?? siteConfig.tagline;
  const url = `${SITE_URL}${path}`;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: siteConfig.name,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images,
    },
  };
}

/** JSON-LD Product schema (https://schema.org/Product). */
export function buildProductJsonLd(product: Product): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "USD",
      price: product.priceUSD.toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

/** JSON-LD Organization schema for the site root. */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: SITE_URL,
    slogan: siteConfig.tagline,
    sameAs: [siteConfig.contact.instagram, siteConfig.contact.facebook],
  };
}

// Characters that must be escaped before JSON is embedded in inline HTML.
// U+2028 / U+2029 are valid in JSON but are raw JS line terminators that can
// break a <script> block, so they are built from char codes (never as literals).
const HTML_UNSAFE_IN_JSON: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [String.fromCharCode(0x2028)]: "\\u2028",
  [String.fromCharCode(0x2029)]: "\\u2029",
};

/**
 * Serialize JSON-LD for safe embedding in a <script type="application/ld+json">.
 *
 * Even though this data is developer-controlled today, we escape the characters
 * that could let a value break out of the <script> element or be reinterpreted
 * as HTML — so this stays safe if product fields ever become user-editable
 * (e.g. an admin panel / DB in Phase 9). See OWASP "JSON in HTML" guidance.
 */
export function jsonLdScript(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  let out = "";
  for (const ch of json) out += HTML_UNSAFE_IN_JSON[ch] ?? ch;
  return out;
}

// Re-exported for convenience in price-related SEO fields.
export { formatUSD };
