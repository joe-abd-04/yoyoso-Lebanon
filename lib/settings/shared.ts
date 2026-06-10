// Framework-free, side-effect-free shared types + normalizers for editable site
// settings (delivery fee, promo code, contact info). Safe to import from BOTH
// server code (lib/data/settings.ts, server actions) and client components
// (SettingsProvider, cart/checkout) — no React, no Next, no DB.
//
// Settings live in the Supabase `settings` table as (key, jsonb value) rows.
// These helpers parse the loosely-typed jsonb into a known shape and provide the
// hardcoded fallbacks used when a key is missing.

// ── Setting keys ───────────────────────────────────────────────────────────────

export const SETTINGS_KEYS = {
  deliveryFee: "delivery_fee",
  promo: "promo",
  contact: "contact",
} as const;

// ── Promo / discount code ───────────────────────────────────────────────────────

export type PromoType = "percent" | "fixed";

/** The full promo configuration stored under settings.promo. */
export interface PromoConfig {
  code: string;
  type: PromoType;
  /** Percent (0–100) when type==='percent', or a flat USD amount when 'fixed'. */
  value: number;
  enabled: boolean;
}

export const EMPTY_PROMO: PromoConfig = {
  code: "",
  type: "percent",
  value: 0,
  enabled: false,
};

/** Parse loose jsonb into a PromoConfig (or null if there's nothing usable). */
export function normalizePromo(raw: unknown): PromoConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const code = typeof r.code === "string" ? r.code.trim() : "";
  const type: PromoType = r.type === "fixed" ? "fixed" : "percent";
  const value =
    typeof r.value === "number" && Number.isFinite(r.value) && r.value >= 0
      ? r.value
      : 0;
  const enabled = r.enabled === true;
  return { code, type, value, enabled };
}

/** Is this promo currently usable (enabled, has a code, and a positive value)? */
export function isPromoActive(promo: PromoConfig | null | undefined): boolean {
  return !!promo && promo.enabled && promo.code.length > 0 && promo.value > 0;
}

// ── Store contact info ──────────────────────────────────────────────────────────

export interface ContactInfo {
  /** Local display number, e.g. "03 133 307" (shown as phone + WhatsApp text). */
  phone: string;
  /** Full international digits for wa.me links, e.g. "96103133307". */
  whatsapp: string;
  email: string;
}

/** Current hardcoded values — used as the fallback when settings.contact is missing. */
export const DEFAULT_CONTACT: ContactInfo = {
  phone: "03 133 307",
  whatsapp: "96103133307",
  email: "lebanon@bestfor-lb.com",
};

/** Merge stored contact info over the defaults (each field falls back individually). */
export function normalizeContact(raw: unknown): ContactInfo {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const pick = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;
  return {
    phone: pick(r.phone, DEFAULT_CONTACT.phone),
    whatsapp: pick(r.whatsapp, DEFAULT_CONTACT.whatsapp),
    email: pick(r.email, DEFAULT_CONTACT.email),
  };
}
