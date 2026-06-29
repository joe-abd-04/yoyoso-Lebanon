/**
 * Product catalog for YOYOSO.
 *
 * TODO: replace with real YOYOSO product data via admin panel.
 * All entries below are PLACEHOLDERS using picsum.photos imagery and
 * fabricated prices/specs purely to exercise the data model and UI.
 */

export type ProductBadge = "NEW" | "SALE" | "HOT";

export type ProductVariantType = "color" | "model" | "size";

export interface ProductVariant {
  type: ProductVariantType;
  /** Display label, e.g. "Teal", "Model 1", "M", "Large". */
  value: string;
  /** Hex color, only meaningful for `type === "color"`. */
  colorHex?: string;
  /**
   * Optional image URL (one of the product's uploaded images) shown when this
   * option is selected. Supported for `color` and `model` options; when absent
   * the storefront keeps showing the current gallery image (graceful fallback).
   */
  image?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** PRIMARY category slug (see data/categories.ts) — drives breadcrumb/subcategory. */
  category: string;
  /** Every category slug this product belongs to (includes the primary). */
  categories: string[];
  subcategory: string;

  // Dual currency — USD + LBP always stored together for Lebanon.
  priceUSD: number;
  priceLBP: number;
  originalPriceUSD?: number;
  originalPriceLBP?: number;
  discountPercent?: number;

  images: string[];
  thumbnail: string;

  badge?: ProductBadge;
  hideNewBadge?: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;

  inStock: boolean;
  stockCount?: number;

  variants: ProductVariant[];

  description?: string;
  specifications?: Record<string, string>;
  sku?: string;
  tags: string[];
  createdAt: string; // ISO date
}

const LBP_PER_USD = 90000;

/** Convert a USD amount to LBP at the current rate. */
export const usdToLbp = (usd: number): number =>
  Math.round((usd * LBP_PER_USD) / 1000) * 1000;

/** Realistic createdAt dates spread over the past 6 months. */
const CREATED_AT: Record<string, string> = {
  "hydrating-facial-serum":       "2025-08-03",
  "vitamin-c-brightening-cream":  "2025-07-25",
  "aloe-vera-soothing-gel":       "2026-05-08",
  "matte-liquid-lipstick-set":    "2026-01-02",
  "12-color-eyeshadow-palette":   "2025-12-15",
  "makeup-brush-kit":             "2025-09-17",
  "scented-soy-candle":           "2025-08-21",
  "macrame-wall-hanging":         "2026-05-04",
  "ceramic-flower-vase":          "2025-08-12",
  "stackable-storage-boxes":      "2026-01-10",
  "microfiber-cleaning-cloths":   "2025-09-08",
  "silicone-kitchen-utensil-set": "2025-10-14",
  "oversized-sunglasses":         "2025-08-30",
  "minimalist-watch":             "2026-01-27",
  "layered-necklace-set":         "2026-05-12",
  "canvas-tote-bag":              "2025-12-24",
  "crossbody-mini-bag":           "2026-02-14",
  "laptop-backpack":              "2026-03-28",
  "wireless-earbuds":             "2026-03-12",
  "fast-charging-cable":          "2025-09-26",
  "phone-ring-holder":            "2025-10-05",
  "hardcover-dotted-notebook":    "2025-12-07",
  "gel-pen-set":                  "2025-11-28",
  "gift-box-surprise":            "2026-05-16",
  "building-blocks-set":          "2026-02-05",
  "plush-teddy-bear":             "2025-11-10",
  "baby-silicone-bib":            "2025-11-01",
  "ergonomic-school-backpack":    "2026-02-22",
  "geometry-math-set":            "2025-10-23",
  "a4-spiral-notebooks":          "2025-11-19",
  "non-slip-yoga-mat":            "2026-04-05",
  "resistance-bands-set":         "2026-01-18",
  "insulated-sports-bottle":      "2026-03-20",
  "birthday-balloon-arch-kit":    "2026-04-28",
  "led-fairy-string-lights":      "2026-03-04",
  "party-tableware-set":          "2026-05-20",
  "christmas-ornament-set":       "2025-07-16",
  "summer-beach-towel":           "2026-04-15",
  "led-strip-rgb-lights":         "2026-05-28",
  "mini-handheld-fan":            "2026-05-24",
};

interface ProductSeed {
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
  priceUSD: number;
  originalPriceUSD?: number;
  badge?: ProductBadge;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  stockCount?: number;
  variants?: ProductVariant[];
  description?: string;
  specifications?: Record<string, string>;
  tags?: string[];
  createdAt?: string;
}

const img = (slug: string, n: number) =>
  `https://picsum.photos/seed/yys-${slug}-${n}/600/600`;

/** Build a fully-typed Product from a compact seed, deriving LBP + discount. */
function makeProduct(seed: ProductSeed, index: number): Product {
  const priceLBP = usdToLbp(seed.priceUSD);
  const originalPriceLBP =
    seed.originalPriceUSD !== undefined
      ? usdToLbp(seed.originalPriceUSD)
      : undefined;
  const discountPercent =
    seed.originalPriceUSD && seed.originalPriceUSD > seed.priceUSD
      ? Math.round(
          ((seed.originalPriceUSD - seed.priceUSD) / seed.originalPriceUSD) *
            100,
        )
      : undefined;

  return {
    id: String(index + 1).padStart(4, "0"),
    slug: seed.slug,
    name: seed.name,
    category: seed.category,
    categories: [seed.category],
    subcategory: seed.subcategory ?? "",
    priceUSD: seed.priceUSD,
    priceLBP,
    originalPriceUSD: seed.originalPriceUSD,
    originalPriceLBP,
    discountPercent,
    images: [img(seed.slug, 1), img(seed.slug, 2), img(seed.slug, 3)],
    thumbnail: img(seed.slug, 1),
    badge: seed.badge,
    isNew: seed.isNew ?? false,
    isBestSeller: seed.isBestSeller ?? false,
    isFeatured: seed.isFeatured ?? false,
    inStock: seed.inStock ?? true,
    stockCount: seed.stockCount,
    variants: seed.variants ?? [],
    description:
      seed.description ??
      "Placeholder description. TODO: replace with real YOYOSO product data.",
    specifications: seed.specifications,
    sku: `YYS-${String(index + 1).padStart(4, "0")}`,
    tags: seed.tags ?? [],
    createdAt: seed.createdAt ?? CREATED_AT[seed.slug] ?? "2026-01-01",
  };
}

const COLORS = {
  teal:  { type: "color", value: "Teal",  colorHex: "#2BC4B6" },
  coral: { type: "color", value: "Coral", colorHex: "#FF7A6B" },
  black: { type: "color", value: "Black", colorHex: "#1F2A2A" },
  white: { type: "color", value: "White", colorHex: "#FFFFFF" },
  blue:  { type: "color", value: "Blue",  colorHex: "#3B82F6" },
  green: { type: "color", value: "Green", colorHex: "#25D366" },
} as const satisfies Record<string, ProductVariant>;

const SIZES = {
  s: { type: "size", value: "S" },
  m: { type: "size", value: "M" },
  l: { type: "size", value: "L" },
} as const satisfies Record<string, ProductVariant>;

// TODO: replace with real YOYOSO product data via admin panel.
const seeds: ProductSeed[] = [
  // Beauty — Skin Care
  {
    slug: "hydrating-facial-serum",
    name: "Hydrating Facial Serum",
    category: "beauty",
    subcategory: "Skin Care",
    priceUSD: 8.5,
    originalPriceUSD: 12,
    badge: "SALE",
    isBestSeller: true,
    isFeatured: true,
    stockCount: 40,
    tags: ["serum", "hydrating", "skincare"],
  },
  {
    slug: "vitamin-c-brightening-cream",
    name: "Vitamin C Brightening Cream",
    category: "beauty",
    subcategory: "Skin Care",
    priceUSD: 10,
    badge: "HOT",
    stockCount: 25,
    tags: ["cream", "vitamin-c"],
  },
  {
    slug: "aloe-vera-soothing-gel",
    name: "Aloe Vera Soothing Gel",
    category: "beauty",
    subcategory: "Skin Care",
    priceUSD: 6,
    isNew: true,
    badge: "NEW",
    stockCount: 60,
    tags: ["aloe", "gel"],
  },

  // Beauty — Cosmetic Accessories
  {
    slug: "matte-liquid-lipstick-set",
    name: "Matte Liquid Lipstick Set",
    category: "beauty",
    subcategory: "Cosmetic Accessories",
    priceUSD: 9.99,
    originalPriceUSD: 15,
    badge: "SALE",
    isFeatured: true,
    variants: [COLORS.coral, COLORS.teal, COLORS.black],
    stockCount: 30,
    tags: ["lipstick", "makeup"],
  },
  {
    slug: "12-color-eyeshadow-palette",
    name: "12-Color Eyeshadow Palette",
    category: "beauty",
    subcategory: "Cosmetic Accessories",
    priceUSD: 12.5,
    isBestSeller: true,
    stockCount: 22,
    tags: ["eyeshadow", "palette"],
  },
  {
    slug: "makeup-brush-kit",
    name: "Makeup Brush Kit (10 pcs)",
    category: "beauty",
    subcategory: "Cosmetic Accessories",
    priceUSD: 7.5,
    badge: "HOT",
    stockCount: 45,
    tags: ["brushes", "makeup"],
  },

  // Home & Living
  {
    slug: "scented-soy-candle",
    name: "Scented Soy Candle",
    category: "home-living",
    subcategory: "",
    priceUSD: 5.5,
    isFeatured: true,
    variants: [COLORS.white, COLORS.teal],
    stockCount: 50,
    tags: ["candle", "decor"],
  },
  {
    slug: "macrame-wall-hanging",
    name: "Macramé Wall Hanging",
    category: "home-living",
    subcategory: "Plush & Pillows",
    priceUSD: 14,
    badge: "NEW",
    isNew: true,
    stockCount: 18,
    tags: ["wall", "decor"],
  },
  {
    slug: "ceramic-flower-vase",
    name: "Ceramic Flower Vase",
    category: "home-living",
    subcategory: "",
    priceUSD: 11,
    stockCount: 27,
    tags: ["vase", "decor"],
  },
  {
    slug: "stackable-storage-boxes",
    name: "Stackable Storage Boxes (Set of 3)",
    category: "home-living",
    subcategory: "Storage",
    priceUSD: 13,
    originalPriceUSD: 18,
    badge: "SALE",
    isBestSeller: true,
    stockCount: 35,
    tags: ["storage", "organization"],
  },
  {
    slug: "microfiber-cleaning-cloths",
    name: "Microfiber Cleaning Cloths (12 pcs)",
    category: "home-living",
    subcategory: "Kitchen",
    priceUSD: 4.5,
    stockCount: 80,
    tags: ["cleaning"],
  },
  {
    slug: "silicone-kitchen-utensil-set",
    name: "Silicone Kitchen Utensil Set",
    category: "home-living",
    subcategory: "Kitchen",
    priceUSD: 9,
    badge: "HOT",
    stockCount: 40,
    tags: ["kitchen", "utensils"],
  },

  // Fashion Accessories
  {
    slug: "oversized-sunglasses",
    name: "Oversized Sunglasses",
    category: "fashion-accessories",
    subcategory: "Sunglasses",
    priceUSD: 7,
    variants: [COLORS.black, COLORS.coral],
    isFeatured: true,
    stockCount: 33,
    tags: ["sunglasses", "fashion"],
  },
  {
    slug: "minimalist-watch",
    name: "Minimalist Wrist Watch",
    category: "fashion-accessories",
    subcategory: "General Accessories",
    priceUSD: 19.99,
    originalPriceUSD: 28,
    badge: "SALE",
    isBestSeller: true,
    stockCount: 15,
    tags: ["watch", "fashion"],
  },
  {
    slug: "layered-necklace-set",
    name: "Layered Necklace Set",
    category: "fashion-accessories",
    subcategory: "General Accessories",
    priceUSD: 6.5,
    isNew: true,
    badge: "NEW",
    stockCount: 48,
    tags: ["necklace", "jewelry"],
  },

  // Bags & Travel
  {
    slug: "canvas-tote-bag",
    name: "Canvas Tote Bag",
    category: "bags-travel",
    subcategory: "Bags",
    priceUSD: 8,
    variants: [COLORS.white, COLORS.black],
    isFeatured: true,
    stockCount: 55,
    tags: ["tote", "bag"],
  },
  {
    slug: "crossbody-mini-bag",
    name: "Crossbody Mini Bag",
    category: "bags-travel",
    subcategory: "Bags",
    priceUSD: 15,
    originalPriceUSD: 22,
    badge: "SALE",
    variants: [COLORS.coral, COLORS.black, COLORS.teal],
    stockCount: 20,
    tags: ["crossbody", "bag"],
  },
  {
    slug: "laptop-backpack",
    name: "Water-Resistant Laptop Backpack",
    category: "bags-travel",
    subcategory: "Bags",
    priceUSD: 24,
    badge: "HOT",
    isBestSeller: true,
    variants: [COLORS.black, COLORS.blue],
    stockCount: 17,
    tags: ["backpack", "bag"],
  },

  // Home & Living — Tools & Gadgets (digital accessories)
  {
    slug: "wireless-earbuds",
    name: "Wireless Bluetooth Earbuds",
    category: "home-living",
    subcategory: "Tools & Gadgets",
    priceUSD: 18,
    originalPriceUSD: 26,
    badge: "SALE",
    isBestSeller: true,
    isFeatured: true,
    variants: [COLORS.white, COLORS.black],
    stockCount: 30,
    tags: ["earbuds", "audio"],
  },
  {
    slug: "fast-charging-cable",
    name: "Fast-Charging USB-C Cable",
    category: "home-living",
    subcategory: "Tools & Gadgets",
    priceUSD: 3.5,
    stockCount: 120,
    tags: ["cable", "charging"],
  },
  {
    slug: "phone-ring-holder",
    name: "Phone Ring Holder & Stand",
    category: "home-living",
    subcategory: "Tools & Gadgets",
    priceUSD: 2.5,
    badge: "HOT",
    variants: [COLORS.coral, COLORS.black, COLORS.green],
    stockCount: 90,
    tags: ["phone", "stand"],
  },

  // Stationery
  {
    slug: "hardcover-dotted-notebook",
    name: "Hardcover Dotted Notebook",
    category: "stationery",
    subcategory: "",
    priceUSD: 5,
    isFeatured: true,
    variants: [COLORS.coral, COLORS.teal, COLORS.blue],
    stockCount: 70,
    tags: ["notebook", "stationery"],
  },
  {
    slug: "gel-pen-set",
    name: "Colorful Gel Pen Set (24 pcs)",
    category: "stationery",
    subcategory: "",
    priceUSD: 6.5,
    badge: "HOT",
    stockCount: 60,
    tags: ["pens", "stationery"],
  },

  // Blind Box
  {
    slug: "gift-box-surprise",
    name: "Surprise Gift Box",
    category: "blind-box",
    subcategory: "",
    priceUSD: 12,
    isNew: true,
    badge: "NEW",
    stockCount: 25,
    tags: ["gift", "blind-box"],
  },

  // Kids & Baby
  {
    slug: "building-blocks-set",
    name: "Creative Building Blocks (120 pcs)",
    category: "kids-baby",
    subcategory: "Toys",
    priceUSD: 14,
    originalPriceUSD: 20,
    badge: "SALE",
    isBestSeller: true,
    stockCount: 28,
    tags: ["toys", "blocks"],
  },
  {
    slug: "plush-teddy-bear",
    name: "Soft Plush Teddy Bear",
    category: "kids-baby",
    subcategory: "Toys",
    priceUSD: 9,
    isFeatured: true,
    variants: [SIZES.s, SIZES.m, SIZES.l],
    stockCount: 40,
    tags: ["plush", "toys"],
  },
  {
    slug: "baby-silicone-bib",
    name: "Waterproof Baby Silicone Bib",
    category: "kids-baby",
    subcategory: "Baby",
    priceUSD: 4,
    variants: [COLORS.coral, COLORS.green, COLORS.teal],
    stockCount: 65,
    tags: ["baby", "bib"],
  },

  // Bags & Travel (school backpack)
  {
    slug: "ergonomic-school-backpack",
    name: "Ergonomic School Backpack",
    category: "bags-travel",
    subcategory: "Bags",
    priceUSD: 16,
    originalPriceUSD: 23,
    badge: "SALE",
    isBestSeller: true,
    variants: [COLORS.blue, COLORS.coral, COLORS.black],
    stockCount: 22,
    tags: ["backpack", "school"],
  },

  // Stationery (school supplies)
  {
    slug: "geometry-math-set",
    name: "Geometry Math Set",
    category: "stationery",
    subcategory: "",
    priceUSD: 3,
    stockCount: 100,
    tags: ["math", "school"],
  },
  {
    slug: "a4-spiral-notebooks",
    name: "A4 Spiral Notebooks (Pack of 5)",
    category: "stationery",
    subcategory: "",
    priceUSD: 7,
    badge: "HOT",
    stockCount: 50,
    tags: ["notebook", "school"],
  },

  // Sports
  {
    slug: "non-slip-yoga-mat",
    name: "Non-Slip Yoga Mat",
    category: "sports",
    subcategory: "",
    priceUSD: 13,
    isFeatured: true,
    variants: [COLORS.coral, COLORS.blue, COLORS.black],
    stockCount: 30,
    tags: ["yoga", "fitness"],
  },
  {
    slug: "resistance-bands-set",
    name: "Resistance Bands Set (5 levels)",
    category: "sports",
    subcategory: "",
    priceUSD: 9.5,
    badge: "HOT",
    isBestSeller: true,
    stockCount: 44,
    tags: ["resistance", "fitness"],
  },

  // Drinkware
  {
    slug: "insulated-sports-bottle",
    name: "Insulated Stainless Sports Bottle",
    category: "drinkware",
    subcategory: "",
    priceUSD: 11,
    originalPriceUSD: 16,
    badge: "SALE",
    variants: [COLORS.black, COLORS.coral, COLORS.green],
    stockCount: 38,
    tags: ["bottle", "drinkware"],
  },

  // Seasonal
  {
    slug: "birthday-balloon-arch-kit",
    name: "Birthday Balloon Arch Kit",
    category: "seasonal",
    subcategory: "Birthday",
    priceUSD: 10,
    isFeatured: true,
    stockCount: 26,
    tags: ["balloons", "party"],
  },
  {
    slug: "led-fairy-string-lights",
    name: "LED Fairy String Lights (10m)",
    category: "seasonal",
    subcategory: "",
    priceUSD: 6,
    badge: "HOT",
    isBestSeller: true,
    stockCount: 70,
    tags: ["lights", "party"],
  },
  {
    slug: "party-tableware-set",
    name: "Disposable Party Tableware Set",
    category: "seasonal",
    subcategory: "",
    priceUSD: 8.5,
    isNew: true,
    badge: "NEW",
    stockCount: 33,
    tags: ["tableware", "party"],
  },
  {
    slug: "christmas-ornament-set",
    name: "Christmas Ornament Set (24 pcs)",
    category: "seasonal",
    subcategory: "Christmas",
    priceUSD: 12,
    originalPriceUSD: 18,
    badge: "SALE",
    isFeatured: true,
    stockCount: 20,
    tags: ["christmas", "seasonal"],
  },
  {
    slug: "summer-beach-towel",
    name: "Summer Beach Towel",
    category: "seasonal",
    subcategory: "Beach",
    priceUSD: 9,
    variants: [COLORS.coral, COLORS.teal, COLORS.blue],
    stockCount: 42,
    tags: ["beach", "summer"],
  },

  // Home & Living — Tools & Gadgets (cont.)
  {
    slug: "led-strip-rgb-lights",
    name: "Smart RGB LED Strip Lights",
    category: "home-living",
    subcategory: "Tools & Gadgets",
    priceUSD: 14.5,
    isNew: true,
    badge: "NEW",
    isFeatured: true,
    stockCount: 24,
    tags: ["led", "smart-home"],
  },
  {
    slug: "mini-handheld-fan",
    name: "Rechargeable Mini Handheld Fan",
    category: "home-living",
    subcategory: "Tools & Gadgets",
    priceUSD: 7.5,
    isNew: true,
    badge: "NEW",
    variants: [COLORS.coral, COLORS.white, COLORS.green],
    stockCount: 55,
    tags: ["fan", "gadget"],
  },
];

export const products: Product[] = seeds.map((seed, i) => makeProduct(seed, i));

// ----- Lookup / filter helpers -----

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const getProductsByCategory = (categorySlug: string): Product[] =>
  products.filter((p) => p.category === categorySlug);

export const getFeaturedProducts = (): Product[] =>
  products.filter((p) => p.isFeatured);

export const getNewProducts = (): Product[] => products.filter((p) => p.isNew);

/** Products sorted by createdAt descending (newest first). Pass limit to cap. */
export const getNewArrivals = (limit?: number): Product[] => {
  const sorted = [...products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return limit ? sorted.slice(0, limit) : sorted;
};

export const getBestSellers = (): Product[] =>
  products.filter((p) => p.isBestSeller);

export default products;
