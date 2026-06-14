// SERVER-ONLY data access for the key-value settings table.
// Import only from Server Components / Route Handlers / Server Actions.
//
// Used so editable values (delivery fee, promo code, contact info) can be changed
// from the admin panel without a code deploy. Always falls back to a safe default
// if the row is missing or the DB is unreachable.

import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import {
  SETTINGS_KEYS,
  normalizePromo,
  normalizeContact,
  normalizeInstagram,
  isPromoActive,
  DEFAULT_CONTACT,
  DEFAULT_INSTAGRAM,
  type PromoConfig,
  type ContactInfo,
  type InstagramConfig,
} from "@/lib/settings/shared";

const FALLBACK_DELIVERY_FEE = 4.5;

/** Cache tag for ALL settings reads. The admin settings actions call
 *  revalidateTag(SETTINGS_CACHE_TAG) after a write so the next render reads the
 *  fresh value. */
export const SETTINGS_CACHE_TAG = "settings";

// The raw DB read, wrapped in unstable_cache so the storefront stays STATICALLY
// rendered (a plain uncached read here would force every page dynamic, and the
// implicit fetch Data Cache can freeze a stale value). Invalidation is explicit
// via revalidateTag(SETTINGS_CACHE_TAG) in the settings server actions, so an
// admin edit reliably surfaces on the live site. `key` is part of the cache key
// (unstable_cache keys on the function arguments).
const readSettingCached = unstable_cache(
  async (key: string): Promise<unknown> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return null;
    return data.value;
  },
  ["site-setting"],
  { tags: [SETTINGS_CACHE_TAG] },
);

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  try {
    return (await readSettingCached(key)) as T | null;
  } catch {
    return null;
  }
}

/** Delivery fee in USD. Falls back to 4.5 if the setting can't be read. */
export async function getDeliveryFee(): Promise<number> {
  const val = await getSetting<number>(SETTINGS_KEYS.deliveryFee);
  return typeof val === "number" && !Number.isNaN(val) && val >= 0
    ? val
    : FALLBACK_DELIVERY_FEE;
}

/** Full promo configuration (for the admin form). null if never configured. */
export async function getPromoConfig(): Promise<PromoConfig | null> {
  const val = await getSetting(SETTINGS_KEYS.promo);
  return normalizePromo(val);
}

/**
 * The promo ONLY if it's currently active (enabled + non-empty code + value>0).
 * This is what the storefront/checkout use to validate entered codes. null when
 * there is no usable promo, so codes never match.
 */
export async function getActivePromo(): Promise<PromoConfig | null> {
  const promo = await getPromoConfig();
  return isPromoActive(promo) ? promo : null;
}

/** Store contact info, with per-field fallback to the current hardcoded values. */
export async function getContactInfo(): Promise<ContactInfo> {
  const val = await getSetting(SETTINGS_KEYS.contact);
  return val ? normalizeContact(val) : { ...DEFAULT_CONTACT };
}

/** Curated Instagram gallery config (handle + profile URL + up to 6 posts). */
export async function getInstagram(): Promise<InstagramConfig> {
  const val = await getSetting(SETTINGS_KEYS.instagram);
  return val ? normalizeInstagram(val) : { ...DEFAULT_INSTAGRAM, posts: [] };
}
