"use client";

// Admin manager for the homepage "Follow us on Instagram" gallery (curated,
// not a live feed). Reuses the SAME upload approach as product images:
// client-side compress → webp → upload straight to the public "product-images"
// bucket with the admin's own session (Storage RLS allows insert only when
// is_admin()). Only the resulting public URLs are saved (via updateInstagram).
//
// Manages: handle + profile URL, up to 6 tiles, each with an optional per-tile
// outbound link, plus reorder / remove.

import { useId, useRef, useState, useTransition } from "react";
import { compressToSquareWebp } from "@/lib/images/squareImage";
import {
  Camera,
  ImagePlus,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage/product-images";
import { MAX_INSTAGRAM_POSTS, type InstagramConfig } from "@/lib/settings/shared";
import { updateInstagram } from "@/app/admin/settings/actions";
import { useUIStore } from "@/store/uiStore";
import SettingsCard, {
  fieldClass,
  FieldError,
  FieldLabel,
  SaveButton,
} from "@/components/admin/settings/SettingsCard";

type Post = { image: string; url: string };

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/tiff",
]);
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // 15 MB

export default function InstagramManager({
  initial,
}: {
  initial: InstagramConfig;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const showToast = useUIStore((s) => s.showToast);

  const [handle, setHandle] = useState(initial.handle);
  const [profileUrl, setProfileUrl] = useState(initial.profileUrl);
  const [posts, setPosts] = useState<Post[]>(initial.posts);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const atLimit = posts.length >= MAX_INSTAGRAM_POSTS;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);

    const remaining = MAX_INSTAGRAM_POSTS - posts.length;
    if (remaining <= 0) {
      setUploadError(`You can add at most ${MAX_INSTAGRAM_POSTS} images.`);
      return;
    }

    const valid: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setUploadError(`"${file.name}" isn't a supported image type.`);
        continue;
      }
      if (file.size > MAX_INPUT_BYTES) {
        setUploadError(`"${file.name}" is larger than 15 MB.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    const toUpload =
      valid.length > remaining ? valid.slice(0, remaining) : valid;
    if (valid.length > remaining) {
      setUploadError(
        `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added (max ${MAX_INSTAGRAM_POSTS}).`,
      );
    }

    const supabase = createClient();
    setBusy(true);
    setProgress({ done: 0, total: toUpload.length });
    const added: Post[] = [];
    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        let blob: Blob;
        try {
          // Square webp with a blurred-fill background — whole image kept (no crop).
          blob = await compressToSquareWebp(file);
        } catch {
          setUploadError(`Could not process "${file.name}". Skipped.`);
          setProgress({ done: i + 1, total: toUpload.length });
          continue;
        }
        const path = `${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(path, blob, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });
        if (upErr) {
          setUploadError(
            "Upload failed. You may not have permission, or the connection dropped.",
          );
          setProgress({ done: i + 1, total: toUpload.length });
          continue;
        }
        const { data } = supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .getPublicUrl(path);
        if (data?.publicUrl) added.push({ image: data.publicUrl, url: "" });
        setProgress({ done: i + 1, total: toUpload.length });
      }
      if (added.length > 0) setPosts((prev) => [...prev, ...added]);
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    setPosts((prev) => prev.filter((_, i) => i !== index));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= posts.length) return;
    setPosts((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function setPostUrl(index: number, url: string) {
    setPosts((prev) => prev.map((p, i) => (i === index ? { ...p, url } : p)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateInstagram({ handle, profileUrl, posts });
      if (res.ok) {
        showToast("Instagram gallery updated.", "success");
      } else {
        setError(res.error);
        showToast(res.error, "error");
      }
    });
  }

  return (
    <SettingsCard
      title="Instagram gallery"
      description="Curate up to 6 images for the “Follow us on Instagram” section on the homepage. Set the handle + profile link, and an optional custom link per image."
      icon={<Camera size={20} />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Instagram handle</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@+/, ""))}
                placeholder="yoyoso"
                maxLength={40}
                className={fieldClass() + " pl-7"}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Profile URL</FieldLabel>
            <input
              type="url"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://www.instagram.com/yoyoso/"
              maxLength={300}
              className={fieldClass()}
            />
          </div>
        </div>

        {/* Tiles */}
        {posts.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {posts.map((p, i) => (
              <li
                key={p.image}
                className="flex gap-3 rounded-card border border-border bg-surface p-2.5"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={`Instagram tile ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <input
                    type="url"
                    value={p.url}
                    onChange={(e) => setPostUrl(i, e.target.value)}
                    placeholder="Optional link (defaults to profile)"
                    maxLength={500}
                    className={fieldClass() + " py-1.5 text-xs"}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={busy || i === 0}
                      aria-label="Move up"
                      className="flex h-7 w-7 items-center justify-center rounded-button border border-border bg-white text-text-secondary transition-colors hover:text-primary disabled:opacity-40"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={busy || i === posts.length - 1}
                      aria-label="Move down"
                      className="flex h-7 w-7 items-center justify-center rounded-button border border-border bg-white text-text-secondary transition-colors hover:text-primary disabled:opacity-40"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <span className="ml-auto text-[11px] font-medium text-text-secondary">
                      #{i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      disabled={busy}
                      aria-label="Remove image"
                      className="flex h-7 w-7 items-center justify-center rounded-button border border-border bg-white text-text-secondary transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {uploadError && (
          <div className="flex items-start gap-2 rounded-button border border-accent/30 bg-accent/5 p-2.5 text-xs text-accent">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload */}
        <div>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy || atLimit}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label
            htmlFor={inputId}
            aria-disabled={busy || atLimit}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-5 text-center transition-colors hover:border-primary hover:bg-primary/5 ${
              busy || atLimit ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {busy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ImagePlus size={18} />
              )}
            </span>
            <p className="mt-2 text-sm font-semibold text-text-primary">
              {busy
                ? progress
                  ? `Uploading ${progress.done}/${progress.total}…`
                  : "Uploading…"
                : atLimit
                  ? `Maximum of ${MAX_INSTAGRAM_POSTS} images reached`
                  : "Click to upload images"}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              JPG, PNG, WEBP, GIF or AVIF up to 15 MB. Fitted into a square (whole
              image kept, never cropped) with a blurred fill, compressed to webp.
            </p>
          </label>
        </div>

        <div>
          <FieldError msg={error} />
          <SaveButton pending={pending} />
        </div>
      </form>
    </SettingsCard>
  );
}
