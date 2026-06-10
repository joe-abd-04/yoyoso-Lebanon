// Fixed, basic named-color palette for product color variants.
//
// The admin TICKS color names from this list (no manual hex picking); each name
// carries a known display hex so the storefront can show a small color dot.
// Shared by the admin form (client), the edit-page initial mapping (server) and
// the create/update actions (server) — pure data + string helpers, no imports.

export type NamedColor = { name: string; hex: string };

/** The basic palette the admin can choose from. Order = display order. */
export const NAMED_COLORS: NamedColor[] = [
  { name: "Black", hex: "#1F2A2A" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#9CA3AF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Green", hex: "#22C55E" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Brown", hex: "#92400E" },
  { name: "Beige", hex: "#E3D5C5" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Silver", hex: "#C0C0C0" },
];

const BY_NAME = new Map(NAMED_COLORS.map((c) => [c.name.toLowerCase(), c]));

/** Known display hex for a palette name (case-insensitive), or undefined. */
export function colorHexByName(name: string): string | undefined {
  return BY_NAME.get(name.trim().toLowerCase())?.hex;
}

/** Is this (case-insensitive) name part of the fixed palette? */
export function isNamedColor(name: string): boolean {
  return BY_NAME.has(name.trim().toLowerCase());
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/**
 * Map an arbitrary hex to the nearest palette color (Euclidean RGB distance).
 * Used to migrate pre-existing custom color swatches onto the fixed palette so
 * the admin checkboxes reflect them. Falls back to the first palette color when
 * the hex is unparseable.
 */
export function nearestNamedColor(hex: string): NamedColor {
  const rgb = hexToRgb(hex);
  if (!rgb) return NAMED_COLORS[0];
  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const c of NAMED_COLORS) {
    const crgb = hexToRgb(c.hex);
    if (!crgb) continue;
    const d =
      (rgb[0] - crgb[0]) ** 2 +
      (rgb[1] - crgb[1]) ** 2 +
      (rgb[2] - crgb[2]) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * Normalise an existing color variant (name + hex) onto the fixed palette:
 *   • if the name already matches a palette color, keep it (use its known hex);
 *   • otherwise map it to the nearest palette color by hex.
 * Returns the canonical { name, hex } so legacy products migrate cleanly.
 */
export function toPaletteColor(value: string, hex?: string): NamedColor {
  const known = BY_NAME.get(value.trim().toLowerCase());
  if (known) return known;
  return nearestNamedColor(hex ?? "#000000");
}
