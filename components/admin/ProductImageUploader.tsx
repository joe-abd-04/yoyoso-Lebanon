"use client";

// Admin product image uploader.
//
// Flow: the admin picks one or more image files → each is compressed & resized
// CLIENT-SIDE (browser-image-compression → webp, ~1200px long edge, ≤300KB) →
// uploaded straight to the public "product-images" Supabase Storage bucket using
// the admin's OWN session (Storage RLS allows insert only when is_admin()). We
// never ship the service-role key to the browser and never push big files
// through a server action — only the resulting public URLs are saved with the
// product.
//
// The component is controlled: it owns no source-of-truth, it just reports the
// ordered image-URL list + chosen main (thumbnail) URL back via onChange. The
// first image is the default main; the admin can reorder, remove, or pick any
// image as the main.

import { useId, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  ImagePlus,
  Loader2,
  X,
  Star,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  PRODUCT_IMAGES_BUCKET,
  MAX_PRODUCT_IMAGES,
} from "@/lib/storage/product-images";

type Props = {
  images: string[];
  thumbnail: string;
  onChange: (images: string[], thumbnail: string) => void;
  disabled?: boolean;
};

// Accept common raster formats; reject anything else (incl. SVG — XSS risk).
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/tiff",
]);
// Max size of the ORIGINAL file the user drops in (before compression).
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // 15 MB

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3, // ≈300KB ceiling
  maxWidthOrHeight: 1200, // long edge
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.82,
};

export default function ProductImageUploader({
  images,
  thumbnail,
  onChange,
  disabled = false,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const mainUrl = thumbnail || images[0] || "";

  /** Normalise: ensure the main url is always one of the images. */
  function emit(nextImages: string[], nextThumb: string) {
    const thumb = nextImages.includes(nextThumb)
      ? nextThumb
      : (nextImages[0] ?? "");
    onChange(nextImages, thumb);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList);
    const remaining = MAX_PRODUCT_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`You can upload at most ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }

    // Validate up front; collect a friendly error if anything is off.
    const valid: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setError(`"${file.name}" isn't a supported image type.`);
        continue;
      }
      if (file.size > MAX_INPUT_BYTES) {
        setError(`"${file.name}" is larger than 15 MB.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    let toUpload = valid;
    if (valid.length > remaining) {
      toUpload = valid.slice(0, remaining);
      setError(
        `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added (max ${MAX_PRODUCT_IMAGES}).`,
      );
    }

    const supabase = createClient();
    setBusy(true);
    setProgress({ done: 0, total: toUpload.length });

    const uploaded: string[] = [];
    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        let blob: Blob;
        try {
          blob = await imageCompression(file, COMPRESSION_OPTIONS);
        } catch {
          // If compression fails, skip this file rather than uploading the
          // (potentially huge) original.
          setError(`Could not process "${file.name}". Skipped.`);
          setProgress({ done: i + 1, total: toUpload.length });
          continue;
        }

        const path = `${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(path, blob, {
            contentType: "image/webp",
            cacheControl: "31536000", // 1 year — files are content-addressed (uuid)
            upsert: false,
          });

        if (upErr) {
          // RLS will reject non-admins here; surface a clear message.
          setError(
            "Upload failed. You may not have permission, or the connection dropped.",
          );
          setProgress({ done: i + 1, total: toUpload.length });
          continue;
        }

        const { data } = supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .getPublicUrl(path);
        if (data?.publicUrl) uploaded.push(data.publicUrl);
        setProgress({ done: i + 1, total: toUpload.length });
      }

      if (uploaded.length > 0) {
        emit([...images, ...uploaded], thumbnail);
      }
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = ""; // allow re-picking same file
    }
  }

  function removeAt(index: number) {
    const next = images.filter((_, i) => i !== index);
    emit(next, thumbnail);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    emit(next, thumbnail);
  }

  function setAsMain(url: string) {
    emit(images, url);
  }

  const atLimit = images.length >= MAX_PRODUCT_IMAGES;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-button border border-accent/30 bg-accent/5 p-2.5 text-xs text-accent">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Existing images */}
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, i) => {
            const isMain = url === mainUrl;
            return (
              <li
                key={url}
                className="group relative overflow-hidden rounded-card border border-border bg-surface"
              >
                <div className="aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Product image ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                {isMain && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-badge bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    <Star size={10} className="fill-white" />
                    Main
                  </span>
                )}

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  disabled={disabled || busy}
                  aria-label="Remove image"
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-text-secondary shadow-sm transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
                >
                  <X size={15} />
                </button>

                {/* Bottom action bar */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/55 to-transparent px-1.5 py-1.5">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={disabled || busy || i === 0}
                      aria-label="Move image left"
                      className="flex h-6 w-6 items-center justify-center rounded-button bg-white/90 text-text-primary shadow-sm transition-colors hover:bg-white disabled:opacity-40"
                    >
                      <ChevronUp size={14} className="-rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={disabled || busy || i === images.length - 1}
                      aria-label="Move image right"
                      className="flex h-6 w-6 items-center justify-center rounded-button bg-white/90 text-text-primary shadow-sm transition-colors hover:bg-white disabled:opacity-40"
                    >
                      <ChevronDown size={14} className="-rotate-90" />
                    </button>
                  </div>
                  {!isMain && (
                    <button
                      type="button"
                      onClick={() => setAsMain(url)}
                      disabled={disabled || busy}
                      className="rounded-button bg-white/90 px-2 py-1 text-[11px] font-semibold text-primary shadow-sm transition-colors hover:bg-white disabled:opacity-50"
                    >
                      Set as main
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Upload dropzone / button */}
      <div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={disabled || busy || atLimit}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label
          htmlFor={inputId}
          aria-disabled={disabled || busy || atLimit}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-6 text-center transition-colors hover:border-primary hover:bg-primary/5 ${
            disabled || busy || atLimit
              ? "pointer-events-none opacity-60"
              : ""
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {busy ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ImagePlus size={20} />
            )}
          </span>
          <p className="mt-2.5 text-sm font-semibold text-text-primary">
            {busy
              ? progress
                ? `Uploading ${progress.done}/${progress.total}…`
                : "Uploading…"
              : atLimit
                ? `Maximum of ${MAX_PRODUCT_IMAGES} images reached`
                : "Click to upload images"}
          </p>
          <p className="mt-1 max-w-sm text-xs text-text-secondary">
            JPG, PNG, WEBP, GIF or AVIF up to 15 MB each. Images are auto-compressed
            to webp (max ~1200px). The first / starred image is the thumbnail.
          </p>
        </label>
      </div>
    </div>
  );
}
