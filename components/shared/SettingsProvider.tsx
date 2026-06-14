"use client";

// Makes editable site settings (delivery fee, active promo code, contact info)
// available to the client component tree. Settings live in the Supabase
// `settings` table so they can be changed from the admin panel without a code
// deploy. They're read on the server in app/layout.tsx and passed in here, so
// cart/checkout/contact UI always reflect the current DB value with no client
// fetch.
//
// Consumers:
//   useDeliveryFee()  -> number (USD)
//   useActivePromo()  -> PromoConfig | null (only when enabled & valid)
//   useContactInfo()  -> ContactInfo

import { createContext, useContext, type ReactNode } from "react";
import { siteConfig } from "@/data/config";
import {
  DEFAULT_CONTACT,
  DEFAULT_INSTAGRAM,
  type ContactInfo,
  type PromoConfig,
  type InstagramConfig,
} from "@/lib/settings/shared";

interface SiteSettings {
  deliveryFee: number;
  promo: PromoConfig | null;
  contact: ContactInfo;
  instagram: InstagramConfig;
}

const SettingsContext = createContext<SiteSettings>({
  deliveryFee: siteConfig.deliveryFee,
  promo: null,
  contact: DEFAULT_CONTACT,
  instagram: DEFAULT_INSTAGRAM,
});

export function SettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Current delivery fee in USD (from the settings table, falls back to config). */
export function useDeliveryFee(): number {
  return useContext(SettingsContext).deliveryFee;
}

/** The active promo code config, or null when there is no usable promo. */
export function useActivePromo(): PromoConfig | null {
  return useContext(SettingsContext).promo;
}

/** Store contact info (phone / WhatsApp / email), with safe fallbacks. */
export function useContactInfo(): ContactInfo {
  return useContext(SettingsContext).contact;
}

/** Curated Instagram gallery config (handle + profile URL + posts). */
export function useInstagram(): InstagramConfig {
  return useContext(SettingsContext).instagram;
}
