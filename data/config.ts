/**
 * Site-wide configuration for YOYOSO.
 * Lebanon only — prices in USD.
 */

export type CurrencyCode = "USD";

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  decimals: number;
}

export const currencies: Record<CurrencyCode, Currency> = {
  USD: { code: "USD", symbol: "$", decimals: 2 },
};

export const siteConfig = {
  name: "YOYOSO",
  brandAliases: ["YOYOSO"],
  tagline: "Aesthetic. Fashionable. Affordable.",

  /**
   * Delivery charge in USD applied to every order.
   * TODO Phase 9: expose this in the admin panel so ops can update it
   *              without a code deployment — changing this value updates
   *              cart, checkout, and confirmation automatically.
   */
  deliveryFee: 4.5,

  contact: {
    /** Display form. wa.me link uses getWhatsAppNumber() which prepends "961" → 96103133307 */
    whatsappNumber: "03 133 307",
    instagram: "https://www.instagram.com/bestforlebanon/",
    facebook: "https://www.facebook.com/bestforlebanon/",
  },
} as const;

export type SiteConfig = typeof siteConfig;

export default siteConfig;
