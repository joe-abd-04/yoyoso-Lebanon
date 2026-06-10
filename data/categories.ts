/**
 * Product categories for YOYOSO.
 *
 * Each category has a distinct pastel background color used for category
 * cards/tiles. Subcategories appear in dropdowns/mega-menu on desktop and
 * as expandable items in the mobile menu.
 */

export interface Subcategory {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
  /** Emoji icon used in category tiles. */
  icon: string;
  /** Distinct pastel background color (hex) for the category card. */
  bgColor: string;
  subcategories: Subcategory[];
}

export const categories: Category[] = [
  {
    slug: "beauty",
    name: "Beauty",
    icon: "💄",
    bgColor: "#E0F7F5",
    subcategories: [
      { slug: "skin-care", name: "Skin Care" },
      { slug: "fragrance", name: "Fragrance" },
      { slug: "cosmetic-accessories", name: "Cosmetic Accessories" },
    ],
  },
  {
    slug: "fashion-accessories",
    name: "Fashion Accessories",
    icon: "👜",
    bgColor: "#D5F3F0",
    subcategories: [
      { slug: "hair-accessories", name: "Hair Accessories" },
      { slug: "sunglasses", name: "Sunglasses" },
      { slug: "caps-hats", name: "Caps & Hats" },
      { slug: "socks", name: "Socks" },
      { slug: "slippers-flip-flops", name: "Slippers & Flip-Flops" },
      { slug: "general-accessories", name: "General Accessories" },
    ],
  },
  {
    slug: "home-living",
    name: "Home & Living",
    icon: "🏠",
    bgColor: "#DAEEF8",
    subcategories: [
      { slug: "kitchen", name: "Kitchen" },
      { slug: "bathroom", name: "Bathroom" },
      { slug: "storage", name: "Storage" },
      { slug: "plush-pillows", name: "Plush & Pillows" },
      { slug: "tools-gadgets", name: "Tools & Gadgets" },
    ],
  },
  {
    slug: "drinkware",
    name: "Drinkware",
    icon: "🥤",
    bgColor: "#D6F5F0",
    subcategories: [],
  },
  {
    slug: "bags-travel",
    name: "Bags & Travel",
    icon: "🎒",
    bgColor: "#E3F5E8",
    subcategories: [
      { slug: "bags", name: "Bags" },
      { slug: "travel", name: "Travel" },
    ],
  },
  {
    slug: "kids-baby",
    name: "Kids & Baby",
    icon: "🧸",
    bgColor: "#EDE8FB",
    subcategories: [
      { slug: "toys", name: "Toys" },
      { slug: "baby", name: "Baby" },
    ],
  },
  {
    slug: "stationery",
    name: "Stationery",
    icon: "✏️",
    bgColor: "#FFF4DA",
    subcategories: [],
  },
  {
    slug: "sports",
    name: "Sports",
    icon: "⚽",
    bgColor: "#DBF0FB",
    subcategories: [],
  },
  {
    slug: "pet-accessories",
    name: "Pet Accessories",
    icon: "🐾",
    bgColor: "#FDEEE9",
    subcategories: [],
  },
  {
    slug: "massagers",
    name: "Massagers",
    icon: "💆",
    bgColor: "#FDE8F0",
    subcategories: [],
  },
  {
    slug: "blind-box",
    name: "Blind Box",
    icon: "🎁",
    bgColor: "#E0F9F5",
    subcategories: [],
  },
  {
    slug: "everything-175",
    name: "Everything $1.75",
    icon: "🏷️",
    bgColor: "#FFF0E0",
    subcategories: [],
  },
  {
    slug: "on-sale",
    name: "On Sale",
    icon: "🔥",
    bgColor: "#FFEAE0",
    subcategories: [],
  },
  {
    slug: "seasonal",
    name: "Seasonal",
    icon: "🎉",
    bgColor: "#EEE8FC",
    subcategories: [
      { slug: "beach", name: "Beach" },
      { slug: "winter", name: "Winter" },
      { slug: "halloween", name: "Halloween" },
      { slug: "christmas", name: "Christmas" },
      { slug: "back-to-school", name: "Back to School" },
      { slug: "ramadan", name: "Ramadan" },
      { slug: "birthday", name: "Birthday" },
      { slug: "valentine", name: "Valentine" },
      { slug: "football", name: "Football" },
    ],
  },
  {
    slug: "new-arrivals",
    name: "New Arrivals",
    icon: "✨",
    bgColor: "#E8FAF5",
    subcategories: [],
  },
];

/** Lookup helper. */
export const getCategoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

export default categories;
