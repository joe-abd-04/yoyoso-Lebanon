// CLIENT-ONLY image processing for product / gallery uploads.
//
// Turns any uploaded photo into a SQUARE webp WITHOUT cropping: the full image
// is drawn "contain"-fit and centered, and the empty bands are filled with a
// heavily blurred, "cover"-scaled copy of the same image (Spotify/Apple style).
// This keeps the product grid square+aligned while never cutting off part of a
// rectangular photo.
//
// Pipeline: load → compose on a square canvas (blurred bg + centered image) →
// encode webp → run through browser-image-compression to hit the size target.
// Pure canvas blur, so NO new dependency. Robust fallbacks:
//   • canvas blur unsupported / draw error → solid WHITE square (still no crop)
//   • no 2D context at all                 → plain resize-compress (no square)
// so an upload can never break.

import imageCompression from "browser-image-compression";

const SQUARE_SIZE = 1000; // output square edge (px)
const BLUR_PX = 28; // background blur radius
const TARGET_MAX_MB = 0.3; // ≈300KB ceiling
const INITIAL_QUALITY = 0.82;

export interface SquareImageOptions {
  /** Output square edge in px (default 1000). */
  size?: number;
  /** Target max output size in MB (default 0.3). */
  targetMaxMB?: number;
}

/** Load a File into a fully-decoded HTMLImageElement. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

/** Does this 2D context actually apply the CSS `filter` (canvas blur)? */
function supportsCanvasBlur(ctx: CanvasRenderingContext2D): boolean {
  try {
    ctx.filter = "blur(1px)";
    const ok = ctx.filter === "blur(1px)";
    ctx.filter = "none";
    return ok;
  } catch {
    return false;
  }
}

/** Draw the background (blurred cover, or solid white) + the centered contained image. */
function compose(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  size: number,
  useBlur: boolean,
): void {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  ctx.clearRect(0, 0, size, size);

  if (useBlur) {
    // Cover-scale the image to fill the square, enlarged by the blur radius on
    // every side so the blur never samples past the image into faded edges.
    const scale = Math.max(size / iw, size / ih);
    const w = iw * scale;
    const h = ih * scale;
    const pad = BLUR_PX * 2;
    const x = (size - w) / 2 - pad;
    const y = (size - h) / 2 - pad;
    ctx.filter = `blur(${BLUR_PX}px)`;
    ctx.drawImage(img, x, y, w + pad * 2, h + pad * 2);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
  }

  // Foreground: the WHOLE image, contain-fit and centered (never cropped).
  const fit = Math.min(size / iw, size / ih);
  const fw = iw * fit;
  const fh = ih * fit;
  ctx.drawImage(img, (size - fw) / 2, (size - fh) / 2, fw, fh);
}

/** Encode a canvas to a webp Blob. */
function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/webp",
      quality,
    );
  });
}

/**
 * Process an uploaded image File into a square webp Blob with a blurred-fill
 * background and the full image visible (no cropping). Compressed to ~webp,
 * ≤ targetMaxMB. Never throws for normal images — falls back gracefully.
 */
export async function compressToSquareWebp(
  file: File,
  opts?: SquareImageOptions,
): Promise<Blob> {
  const size = opts?.size ?? SQUARE_SIZE;
  const targetMaxMB = opts?.targetMaxMB ?? TARGET_MAX_MB;

  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Ultimate fallback: no 2D context → plain resize-compress (no square, but no
  // crop and the upload still works).
  if (!ctx) {
    return imageCompression(file, {
      maxSizeMB: targetMaxMB,
      maxWidthOrHeight: size,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: INITIAL_QUALITY,
    });
  }

  const canBlur = supportsCanvasBlur(ctx);
  try {
    compose(ctx, img, size, canBlur);
  } catch {
    // Blurred fill failed → solid white square background (still no crop).
    ctx.filter = "none";
    compose(ctx, img, size, false);
  }

  const composed = await canvasToWebp(canvas, 0.92);

  // Hit the size target (image is already square — no crop happens here).
  const composedFile = new File([composed], "image.webp", {
    type: "image/webp",
  });
  return imageCompression(composedFile, {
    maxSizeMB: targetMaxMB,
    maxWidthOrHeight: size,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: INITIAL_QUALITY,
  });
}
