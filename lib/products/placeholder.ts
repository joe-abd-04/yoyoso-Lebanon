// Neutral "no image yet" placeholder. Products created in the admin panel before
// Phase 9.5 step 3 (image upload) have no images; the storefront and admin table
// fall back to this so an empty <img src> never shows a broken icon. Stored
// nowhere in the DB — applied at the data-mapping layer only.

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#F2F5F5"/><g fill="#AEB9B9"><path d="M300 250a34 34 0 1 0 0 68 34 34 0 0 0 0-68zm-110 130 70-84 50 60 40-46 70 84z"/></g><text x="50%" y="430" font-family="system-ui, sans-serif" font-size="26" fill="#9AA6A6" text-anchor="middle">No image yet</text></svg>`;

export const PRODUCT_IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  SVG,
)}`;
