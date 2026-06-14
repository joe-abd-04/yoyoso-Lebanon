/**
 * Centralised input-validation schemas (zod) for every user-facing form.
 *
 * These run on the CLIENT today (no backend yet). They are the first line of
 * defence against malformed / oversized / malicious input and MUST be
 * re-validated on the server in Phase 9 — never trust the client alone.
 *
 * Every field has an explicit max length to prevent flooding / memory abuse.
 */

import { z } from "zod";
import {
  isSafeImageUrl,
  MAX_PRODUCT_IMAGES,
} from "@/lib/storage/product-images";

// ── Shared primitives ─────────────────────────────────────────────────────────

/** Max lengths, centralised so they stay consistent across forms. */
export const LIMITS = {
  name: 100,
  email: 254, // RFC 5321 maximum
  phone: 30,
  subject: 60,
  message: 2000,
  address: 200,
  city: 100,
  notes: 1000,
  password: 128,
  promo: 40,
  search: 100,
} as const;

// Pragmatic email + phone patterns (mirrors the UI's existing EMAIL_RE).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_RE = /^[0-9+\-\s()]+$/;

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(LIMITS.email, "Email is too long")
  .refine((v) => EMAIL_RE.test(v), "Enter a valid email");

/** Phone: restricted charset + at least 8 digits. */
const phone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .max(LIMITS.phone, "Phone number is too long")
  .regex(PHONE_CHARS_RE, "Enter a valid phone number")
  .refine((v) => v.replace(/\D/g, "").length >= 8, "Enter a valid phone number (min 8 digits)");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(LIMITS.password, "Password is too long");

// ── Contact ───────────────────────────────────────────────────────────────────

export const SUBJECTS = [
  "General Inquiry",
  "Order Question",
  "Return Request",
  "Product Question",
  "Other",
] as const;

export const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(LIMITS.name, "Name is too long"),
  email,
  phone,
  subject: z.enum(SUBJECTS, { message: "Please select a subject" }),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(LIMITS.message, "Message is too long"),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email,
  password,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Required").max(LIMITS.name, "Too long"),
    lastName: z.string().trim().min(1, "Required").max(LIMITS.name, "Too long"),
    email,
    countryCode: z.enum(["+961", "+974"]),
    phone,
    password,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeTerms: z.boolean().refine((v) => v === true, "You must agree to the terms to continue"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// ── Checkout ──────────────────────────────────────────────────────────────────

export const LEBANON_REGIONS = [
  "Beirut",
  "Mount Lebanon",
  "North Lebanon",
  "South Lebanon",
  "Bekaa",
  "Nabatieh",
  "Akkar",
  "Baalbek-Hermel",
] as const;

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(LIMITS.name, "Too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(LIMITS.name, "Too long"),
  email,
  phone,
  address1: z.string().trim().min(1, "Address is required").max(LIMITS.address, "Address is too long"),
  address2: z.string().trim().max(LIMITS.address, "Address is too long").optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(LIMITS.city, "City is too long"),
  region: z.enum(LEBANON_REGIONS, { message: "Region is required" }),
  notes: z.string().trim().max(LIMITS.notes, "Notes are too long").optional().or(z.literal("")),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ── Single-field forms ────────────────────────────────────────────────────────

export const newsletterSchema = z.object({ email });
export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const promoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter a promo code")
    .max(LIMITS.promo, "Promo code is too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid promo code"),
});

/** Search is permissive (it only drives client-side filtering) but length-capped. */
export const searchSchema = z.object({
  q: z.string().trim().max(LIMITS.search),
});

// ── Admin: site settings ─────────────────────────────────────────────────────
//
// Shared by the client settings forms (zodResolver / light checks) AND the server
// actions (re-validation — never trust the client). Numeric inputs are strings so
// they map cleanly to text inputs; the server converts after validating.

const isNonNegativeNumber = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

export const adminDeliveryFeeSchema = z.object({
  fee: z
    .string()
    .trim()
    .min(1, "Enter a delivery fee")
    .refine(isNonNegativeNumber, "Enter a valid non-negative number")
    .refine((v) => Number(v) <= 100000, "That fee is unreasonably high"),
});
export type AdminDeliveryFeeInput = z.infer<typeof adminDeliveryFeeSchema>;

export const PROMO_TYPES = ["percent", "fixed"] as const;

export const adminPromoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .max(LIMITS.promo, "Promo code is too long")
      .regex(/^[A-Za-z0-9_-]*$/, "Use letters, numbers, - and _ only"),
    type: z.enum(PROMO_TYPES),
    value: z.string().trim(),
    enabled: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const n = Number(d.value);
    if (d.value === "" || !Number.isFinite(n) || n < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Enter a valid amount",
      });
      return;
    }
    if (d.type === "percent" && n > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Percent must be between 0 and 100",
      });
    }
    if (d.enabled) {
      if (!d.code) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["code"],
          message: "Set a code to enable the promo",
        });
      }
      if (!(n > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "Discount must be greater than 0 to enable",
        });
      }
    }
  });
export type AdminPromoInput = z.infer<typeof adminPromoSchema>;

export const adminContactSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(LIMITS.phone, "Phone number is too long"),
  whatsapp: z
    .string()
    .trim()
    .min(1, "WhatsApp number is required")
    .max(LIMITS.phone, "WhatsApp number is too long")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 8,
      "Enter a valid WhatsApp number (min 8 digits)",
    ),
  email,
});
export type AdminContactInput = z.infer<typeof adminContactSchema>;

/** Promote a registered user (by email) to admin. */
export const addAdminSchema = z.object({ email });
export type AddAdminInput = z.infer<typeof addAdminSchema>;

// ── Admin: Instagram "Follow us" gallery ─────────────────────────────────────

const httpUrl = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, "URL is too long")
    .refine(isSafeImageUrl, "Enter a valid http(s) URL");

export const adminInstagramSchema = z.object({
  // Handle without "@" (the server strips any the admin types).
  handle: z
    .string()
    .trim()
    .max(40, "Handle is too long")
    .regex(/^@?[A-Za-z0-9._]*$/, "Use letters, numbers, dots and underscores"),
  profileUrl: httpUrl(300),
  posts: z
    .array(
      z.object({
        // Must be an uploaded product-images URL (re-checked in the action).
        image: httpUrl(500),
        // Optional per-tile link; "" = fall back to the profile URL.
        url: z
          .string()
          .trim()
          .max(500, "URL is too long")
          .refine((v) => v === "" || isSafeImageUrl(v), "Enter a valid http(s) URL"),
      }),
    )
    .max(6, "At most 6 images"),
});
export type AdminInstagramInput = z.infer<typeof adminInstagramSchema>;

// ── Admin: product form ─────────────────────────────────────────────────────
//
// One schema, shared by the client form (zodResolver) AND the server action
// (re-validation — never trust the client). Numeric fields are kept as STRINGS
// here so they map 1:1 to text/number inputs without coercion ambiguity (an
// empty <input type="number"> yields "", not 0); the server converts to numbers
// after validation.

export const PRODUCT_BADGES = ["SALE", "HOT"] as const;
/** "" = "None" in the badge <select>. */
export const BADGE_OPTIONS = ["", ...PRODUCT_BADGES] as const;

const isPositiveNumber = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
};

// An optional per-option image (color/model). Empty string = no image; any
// value must be a safe http(s) URL (the form only offers the product's own
// uploaded images; the action additionally drops any that aren't in images[]).
const variantImage = z
  .string()
  .trim()
  .max(500, "Image URL is too long")
  .refine((v) => v === "" || isSafeImageUrl(v), "Invalid image URL")
  .optional();

// Color options carry a name (from the fixed palette) + its known hex swatch,
// plus an optional image. Models carry a label + optional image. Sizes are
// just labels.
export const colorVariantSchema = z.object({
  value: z.string().trim().min(1, "Color name is required").max(40, "Too long"),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a color"),
  image: variantImage,
});

export const modelVariantSchema = z.object({
  value: z.string().trim().min(1, "Required").max(40, "Too long"),
  image: variantImage,
});

export const labelVariantSchema = z.object({
  value: z.string().trim().min(1, "Required").max(40, "Too long"),
});

// An image URL must be a safe http(s) URL (blocks javascript:/data: schemes).
// New uploads always land in our own product-images bucket; pre-existing
// external placeholder URLs (seeded picsum.photos) are tolerated so legacy
// products stay editable. Validated on the client (zodResolver) AND re-validated
// server-side in the action.
const productImageUrl = z
  .string()
  .trim()
  .max(500, "Image URL is too long")
  .refine(isSafeImageUrl, "Invalid image URL");

export const adminProductSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(150, "Name is too long"),
    description: z.string().trim().max(5000, "Description is too long"),
    priceUSD: z
      .string()
      .trim()
      .min(1, "Price is required")
      .refine(isPositiveNumber, "Enter a valid price")
      .refine((v) => Number(v) <= 1_000_000, "Price is too high"),
    originalPriceUSD: z
      .string()
      .trim()
      .refine((v) => v === "" || isPositiveNumber(v), "Enter a valid price")
      .refine((v) => v === "" || Number(v) <= 1_000_000, "Price is too high"),
    categoryId: z.string().uuid("Please select a category"),
    subcategory: z.string().trim().max(100, "Too long"),
    sku: z.string().trim().min(1, "SKU is required").max(60, "SKU is too long"),
    badge: z.enum(BADGE_OPTIONS),
    inStock: z.boolean(),
    hideNewBadge: z.boolean(),
    // Three optional, independent variant groups. A product may use any
    // combination (or none). Stored together in the products.variants jsonb.
    colors: z.array(colorVariantSchema).max(30, "Too many colors"),
    models: z.array(modelVariantSchema).max(30, "Too many models"),
    sizes: z.array(labelVariantSchema).max(30, "Too many sizes"),
    images: z
      .array(productImageUrl)
      .max(MAX_PRODUCT_IMAGES, `At most ${MAX_PRODUCT_IMAGES} images`),
    // The main/thumbnail image. Empty (no images) or one of `images` — enforced
    // by the refine below; the server also normalises it defensively.
    thumbnail: z.string().trim().max(500),
  })
  .refine(
    (d) => d.originalPriceUSD === "" || Number(d.originalPriceUSD) > Number(d.priceUSD),
    {
      message: "Original price must be higher than the current price",
      path: ["originalPriceUSD"],
    },
  )
  .refine((d) => d.thumbnail === "" || d.images.includes(d.thumbnail), {
    message: "The main image must be one of the uploaded images",
    path: ["thumbnail"],
  });

export type AdminProductInput = z.infer<typeof adminProductSchema>;
