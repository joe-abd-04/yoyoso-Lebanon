"use server";

// SERVER ACTIONS — edit site settings (delivery fee, promo, contact) and manage
// admins.
//
// Security model (identical to the products/orders actions):
//   • EVERY action verifies the caller is an admin server-side (getAdminUser)
//     before touching the database. The UI never decides authorization.
//   • Writes use the service-role server client (server-only; the secret key is
//     never shipped to the browser).
//   • All input is re-validated with the same zod schemas the forms use.
//   • After a write we revalidate so storefront + admin reflect the change. The
//     root layout reads settings, so revalidating it ('/', 'layout') pushes new
//     delivery-fee / promo / contact values to the whole (statically cached) site.

import { revalidatePath, updateTag } from "next/cache";
import { getAdminUser } from "@/lib/auth/admin";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/sanitize";
import {
  adminDeliveryFeeSchema,
  adminPromoSchema,
  adminContactSchema,
  addAdminSchema,
  adminInstagramSchema,
} from "@/lib/validation";
import { isProductImageUrl } from "@/lib/storage/product-images";
import { SETTINGS_KEYS } from "@/lib/settings/shared";
import { SETTINGS_CACHE_TAG } from "@/lib/data/settings";
import type { Json } from "@/lib/supabase/types";

export type SettingsActionResult = { ok: true } | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Push setting changes to the storefront (root layout reads them) + admin.
 *  updateTag (Next 16, Server-Action-only) immediately expires the cached
 *  settings reads (getSetting/unstable_cache, tagged SETTINGS_CACHE_TAG) so the
 *  next render reads the fresh value — read-your-own-writes. revalidatePath busts
 *  the static page cache so the storefront re-renders with it. Both are needed. */
function revalidateSettings() {
  updateTag(SETTINGS_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

/** Upsert one settings row. Returns an error message on failure, else null. */
async function saveSetting(key: string, value: Json): Promise<string | null> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) {
    console.error(`[saveSetting:${key}]`, error.message);
    return "We couldn't save your changes. Please try again.";
  }
  return null;
}

function firstError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Please check your input and try again.";
}

// ── Delivery fee ────────────────────────────────────────────────────────────────

export async function updateDeliveryFee(input: {
  fee: string;
}): Promise<SettingsActionResult> {
  if (!(await getAdminUser())) return { ok: false, error: "Not authorized." };

  const parsed = adminDeliveryFeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const fee = Math.round(Number(parsed.data.fee) * 100) / 100;
  const error = await saveSetting(SETTINGS_KEYS.deliveryFee, fee);
  if (error) return { ok: false, error };

  revalidateSettings();
  return { ok: true };
}

// ── Promo / discount code ────────────────────────────────────────────────────────

export async function updatePromo(input: {
  code: string;
  type: "percent" | "fixed";
  value: string;
  enabled: boolean;
}): Promise<SettingsActionResult> {
  if (!(await getAdminUser())) return { ok: false, error: "Not authorized." };

  const parsed = adminPromoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const value = {
    code: parsed.data.code.trim().toUpperCase(),
    type: parsed.data.type,
    value: Math.round(Number(parsed.data.value) * 100) / 100,
    enabled: parsed.data.enabled,
  };

  const error = await saveSetting(SETTINGS_KEYS.promo, value);
  if (error) return { ok: false, error };

  revalidateSettings();
  return { ok: true };
}

// ── Store contact info ───────────────────────────────────────────────────────────

export async function updateContactInfo(input: {
  phone: string;
  whatsapp: string;
  email: string;
}): Promise<SettingsActionResult> {
  if (!(await getAdminUser())) return { ok: false, error: "Not authorized." };

  const parsed = adminContactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const value = {
    phone: sanitizeText(parsed.data.phone),
    whatsapp: sanitizeText(parsed.data.whatsapp),
    email: parsed.data.email.trim(),
  };

  const error = await saveSetting(SETTINGS_KEYS.contact, value);
  if (error) return { ok: false, error };

  revalidateSettings();
  return { ok: true };
}

// ── Instagram "Follow us" gallery ──────────────────────────────────────────────

export async function updateInstagram(input: {
  handle: string;
  profileUrl: string;
  posts: { image: string; url: string }[];
}): Promise<SettingsActionResult> {
  if (!(await getAdminUser())) return { ok: false, error: "Not authorized." };

  const parsed = adminInstagramSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const value = {
    handle: parsed.data.handle.replace(/^@+/, ""),
    profileUrl: parsed.data.profileUrl,
    // Only keep images that live in OUR bucket (never persist arbitrary external
    // image URLs); cap at 6. The per-tile `url` is an outbound link, left as-is.
    posts: parsed.data.posts
      .filter((p) => isProductImageUrl(p.image))
      .slice(0, 6)
      .map((p) => ({ image: p.image, url: p.url })),
  };

  const error = await saveSetting(SETTINGS_KEYS.instagram, value);
  if (error) return { ok: false, error };

  revalidateSettings();
  return { ok: true };
}

// ── Manage admins ────────────────────────────────────────────────────────────────

/** Promote an existing REGISTERED user (looked up by email) to admin. */
export async function addAdmin(input: {
  email: string;
}): Promise<SettingsActionResult> {
  if (!(await getAdminUser())) return { ok: false, error: "Not authorized." };

  const parsed = addAdminSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = createServerClient();

  // ilike with no wildcards = case-insensitive exact match on email.
  const { data: rows, error: lookupErr } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", parsed.data.email)
    .limit(2);

  if (lookupErr) {
    console.error("[addAdmin] lookup", lookupErr.message);
    return { ok: false, error: "We couldn't look up that user. Please try again." };
  }
  if (!rows || rows.length === 0) {
    return {
      ok: false,
      error: "No registered user with that email. They must create an account first.",
    };
  }

  const profile = rows[0];
  if (profile.is_admin) {
    return { ok: false, error: "That user is already an admin." };
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", profile.id);

  if (updateErr) {
    console.error("[addAdmin] update", updateErr.message);
    return { ok: false, error: "We couldn't grant admin access. Please try again." };
  }

  revalidateSettings();
  return { ok: true };
}

/** Demote an admin. Guards: can't remove yourself, must keep ≥1 admin. */
export async function removeAdmin(input: {
  userId: string;
}): Promise<SettingsActionResult> {
  const current = await getAdminUser();
  if (!current) return { ok: false, error: "Not authorized." };

  if (!UUID_RE.test(input.userId)) {
    return { ok: false, error: "Invalid user." };
  }
  if (input.userId === current.id) {
    return { ok: false, error: "You can't remove your own admin access." };
  }

  const supabase = createServerClient();

  const { count, error: countErr } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_admin", true);

  if (countErr) {
    console.error("[removeAdmin] count", countErr.message);
    return { ok: false, error: "We couldn't update admins. Please try again." };
  }
  if ((count ?? 0) <= 1) {
    return { ok: false, error: "There must be at least one admin." };
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ is_admin: false })
    .eq("id", input.userId);

  if (updateErr) {
    console.error("[removeAdmin] update", updateErr.message);
    return { ok: false, error: "We couldn't remove that admin. Please try again." };
  }

  revalidateSettings();
  return { ok: true };
}
