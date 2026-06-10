import {
  Sparkles,
  ShoppingBag,
  Home,
  Coffee,
  Briefcase,
  Baby,
  Pencil,
  Activity,
  PawPrint,
  Heart,
  Package,
  Tag,
  Flame,
  Snowflake,
  Star,
  type LucideIcon,
} from "lucide-react";

export interface CategoryIconDef {
  Icon: LucideIcon;
  accentColor: string;
  bgTint: string;
}

export const CATEGORY_ICONS: Record<string, CategoryIconDef> = {
  "beauty":               { Icon: Sparkles,    accentColor: "#EC4899", bgTint: "#FDF2F8" },
  "fashion-accessories":  { Icon: ShoppingBag, accentColor: "#8B5CF6", bgTint: "#F5F3FF" },
  "home-living":          { Icon: Home,        accentColor: "#2BC4B6", bgTint: "#EEFBF9" },
  "drinkware":            { Icon: Coffee,      accentColor: "#3B82F6", bgTint: "#EFF6FF" },
  "bags-travel":          { Icon: Briefcase,   accentColor: "#F59E0B", bgTint: "#FFFBEB" },
  "kids-baby":            { Icon: Baby,        accentColor: "#F97316", bgTint: "#FFF7ED" },
  "stationery":           { Icon: Pencil,      accentColor: "#6366F1", bgTint: "#EEF2FF" },
  "sports":               { Icon: Activity,    accentColor: "#22C55E", bgTint: "#F0FDF4" },
  "pet-accessories":      { Icon: PawPrint,    accentColor: "#CA8A04", bgTint: "#FEFCE8" },
  "massagers":            { Icon: Heart,       accentColor: "#F43F5E", bgTint: "#FFF1F2" },
  "blind-box":            { Icon: Package,     accentColor: "#D946EF", bgTint: "#FDF4FF" },
  "everything-175":       { Icon: Tag,         accentColor: "#2BC4B6", bgTint: "#EEFBF9" },
  "on-sale":              { Icon: Flame,       accentColor: "#FF7A6B", bgTint: "#FFF5F4" },
  "seasonal":             { Icon: Snowflake,   accentColor: "#06B6D4", bgTint: "#ECFEFF" },
  "new-arrivals":         { Icon: Star,        accentColor: "#2BC4B6", bgTint: "#EEFBF9" },
};
