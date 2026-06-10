"use client";

// Add / edit product form. Validates with the SAME zod schema the server action
// re-validates with (lib/validation → adminProductSchema). Numeric fields are
// strings here (text/number inputs); the server converts them. Images are
// uploaded to Supabase Storage by <ProductImageUploader> and tracked as URLs in
// the form's `images` / `thumbnail` fields.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, AlertCircle, Check } from "lucide-react";
import {
  adminProductSchema,
  PRODUCT_BADGES,
  type AdminProductInput,
} from "@/lib/validation";
import { NAMED_COLORS } from "@/lib/products/colors";
import type { CategoryOption } from "@/lib/data/admin-products";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import { useUIStore } from "@/store/uiStore";
import ProductImageUploader from "@/components/admin/ProductImageUploader";

type Props = {
  categories: CategoryOption[];
  mode: "create" | "edit";
  productId?: string;
  initial?: AdminProductInput;
};

const EMPTY: AdminProductInput = {
  name: "",
  description: "",
  priceUSD: "",
  originalPriceUSD: "",
  categoryId: "",
  subcategory: "",
  sku: "",
  badge: "",
  inStock: true,
  hideNewBadge: false,
  colors: [],
  models: [],
  sizes: [],
  images: [],
  thumbnail: "",
};

function Label({
  children,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-text-primary"
    >
      {children}
      {hint && (
        <span className="ml-1 font-normal text-text-secondary">{hint}</span>
      )}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-accent">{msg}</p>;
}

const inputCls =
  "w-full rounded-button border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary";

export default function ProductForm({
  categories,
  mode,
  productId,
  initial,
}: Props) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminProductInput>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: initial ?? EMPTY,
  });

  const modelArray = useFieldArray({ control, name: "models" });
  const sizeArray = useFieldArray({ control, name: "sizes" });

  // Colors are a fixed-palette multi-select (ticked names), so we manage the
  // array directly rather than with useFieldArray.
  const colors = watch("colors");
  const toggleColor = (name: string, hex: string) => {
    const exists = colors.some((c) => c.value === name);
    const next = exists
      ? colors.filter((c) => c.value !== name)
      : [...colors, { value: name, colorHex: hex, image: "" }];
    setValue("colors", next, { shouldValidate: true, shouldDirty: true });
  };
  // Remove a color entirely (drops it + any variant image it had). Used by the
  // explicit remove button so deselecting is always possible.
  const removeColor = (name: string) => {
    setValue(
      "colors",
      colors.filter((c) => c.value !== name),
      { shouldValidate: true, shouldDirty: true },
    );
  };
  const setColorImage = (name: string, url: string) => {
    setValue(
      "colors",
      colors.map((c) => (c.value === name ? { ...c, image: url } : c)),
      { shouldDirty: true },
    );
  };

  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const subOptions = selectedCategory?.subcategories ?? [];

  // Images are managed by <ProductImageUploader>; mirror its state into RHF.
  const images = watch("images");
  const thumbnail = watch("thumbnail");

  const onSubmit = async (values: AdminProductInput) => {
    setServerError(null);
    const result =
      mode === "create"
        ? await createProduct(values)
        : await updateProduct(productId!, values);

    if (result.ok) {
      showToast(
        mode === "create" ? "Product created." : "Changes saved.",
        "success",
      );
      router.push("/admin/products");
      router.refresh();
    } else {
      setServerError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && (
        <div className="flex items-start gap-2 rounded-card border border-accent/30 bg-accent/5 p-3 text-sm text-accent">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Basics */}
      <section className="rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-heading text-lg font-bold text-text-primary">
          Basics
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <input id="name" {...register("name")} className={inputCls} />
            <FieldError msg={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="description" hint="(optional)">
              Description
            </Label>
            <textarea
              id="description"
              rows={4}
              {...register("description")}
              className={`${inputCls} resize-y`}
            />
            <FieldError msg={errors.description?.message} />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-heading text-lg font-bold text-text-primary">
          Pricing
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="priceUSD">Price (USD)</Label>
            <input
              id="priceUSD"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              {...register("priceUSD")}
              className={inputCls}
            />
            <FieldError msg={errors.priceUSD?.message} />
          </div>
          <div>
            <Label htmlFor="originalPriceUSD" hint="(optional — for a sale)">
              Original price (USD)
            </Label>
            <input
              id="originalPriceUSD"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              {...register("originalPriceUSD")}
              className={inputCls}
            />
            <FieldError msg={errors.originalPriceUSD?.message} />
          </div>
        </div>
      </section>

      {/* Organization */}
      <section className="rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-heading text-lg font-bold text-text-primary">
          Organization
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              {...register("categoryId")}
              onChange={(e) => {
                setValue("categoryId", e.target.value, { shouldValidate: true });
                setValue("subcategory", ""); // reset sub when category changes
              }}
              className={inputCls}
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError msg={errors.categoryId?.message} />
          </div>

          <div>
            <Label htmlFor="subcategory" hint="(optional)">
              Subcategory
            </Label>
            <select
              id="subcategory"
              {...register("subcategory")}
              disabled={subOptions.length === 0}
              className={`${inputCls} disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-secondary`}
            >
              <option value="">
                {subOptions.length === 0 ? "—" : "Select a subcategory…"}
              </option>
              {subOptions.map((s) => (
                <option key={s.slug} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <FieldError msg={errors.subcategory?.message} />
          </div>

          <div>
            <Label htmlFor="sku" hint="(required)">
              SKU
            </Label>
            <input
              id="sku"
              {...register("sku")}
              placeholder="e.g. YYS-0001"
              className={inputCls}
            />
            <FieldError msg={errors.sku?.message} />
          </div>

          <div>
            <Label htmlFor="badge">Badge</Label>
            <select id="badge" {...register("badge")} className={inputCls}>
              <option value="">None</option>
              {PRODUCT_BADGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-secondary">
              NEW is automatic (14 days after creation). Only set SALE or HOT manually.
            </p>
            <FieldError msg={errors.badge?.message} />
          </div>
        </div>

        {/* In-stock toggle */}
        <div className="mt-4 flex items-center justify-between rounded-button border border-border bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text-primary">In stock</p>
            <p className="text-xs text-text-secondary">
              Customers can order this product when on.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              {...register("inStock")}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-primary" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        {/* Suppress auto-NEW badge toggle */}
        <div className="mt-4 flex items-center justify-between rounded-button border border-border bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text-primary">Suppress NEW badge</p>
            <p className="text-xs text-text-secondary">
              When on, hides the automatic NEW badge even if this product is less than 14 days old.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              {...register("hideNewBadge")}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-primary" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </label>
        </div>
      </section>

      {/* Variants — Colors / Models / Sizes (all optional, independent) */}
      <section className="rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 font-heading text-lg font-bold text-text-primary">
          Variants
        </h2>
        <p className="mb-5 text-xs text-text-secondary">
          All optional. Add options for any of the types below — a product can use
          colors, models, sizes, any combination, or none.
        </p>

        {/* Colors — tick names from a fixed palette */}
        <div className="mb-6">
          <h3 className="mb-1 text-sm font-bold text-text-primary">Colors</h3>
          <p className="mb-3 text-xs text-text-secondary">
            Click a color to add it; click it again (or use Remove below) to take
            it off. Optionally assign one of the product&apos;s images to a color
            so the storefront photo switches when it&apos;s selected.
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NAMED_COLORS.map((c) => {
              const checked = colors.some((x) => x.value === c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleColor(c.name, c.hex)}
                  aria-pressed={checked}
                  className={`flex select-none items-center gap-2 rounded-button border px-3 py-2 text-left text-sm transition-colors ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="font-medium text-text-primary">{c.name}</span>
                  {checked && <Check size={15} className="ml-auto text-primary" />}
                </button>
              );
            })}
          </div>

          {/* Selected colors — remove + optional image per color */}
          {colors.length > 0 && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold text-text-secondary">
                Selected colors
              </p>
              {colors.map((c) => (
                <div
                  key={c.value}
                  className="flex flex-col gap-1.5 rounded-card border border-border bg-surface/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <span
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ backgroundColor: c.colorHex }}
                      />
                      {c.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeColor(c.value)}
                      aria-label={`Remove ${c.value}`}
                      className="inline-flex items-center gap-1 rounded-button px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-text-secondary">
                      Image (optional)
                    </p>
                    <VariantImagePicker
                      images={images}
                      value={c.image ?? ""}
                      disabled={isSubmitting}
                      onChange={(url) => setColorImage(c.value, url)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Models */}
        <div className="mb-6 border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">Models</h3>
            <button
              type="button"
              onClick={() => modelArray.append({ value: "", image: "" })}
              className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <Plus size={15} />
              Add model
            </button>
          </div>
          <p className="mb-3 text-xs text-text-secondary">
            A label per option (e.g. Model 1, Model 2). An image is optional and,
            when set, switches the storefront photo on selection.
          </p>

          {modelArray.fields.length === 0 ? (
            <p className="text-sm text-text-secondary">No models added.</p>
          ) : (
            <div className="space-y-4">
              {modelArray.fields.map((field, i) => (
                <div
                  key={field.id}
                  className="rounded-card border border-border bg-surface/40 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        {...register(`models.${i}.value` as const)}
                        placeholder="Model label (e.g. Model 1)"
                        className={inputCls}
                      />
                      <FieldError msg={errors.models?.[i]?.value?.message} />
                    </div>
                    <button
                      type="button"
                      onClick={() => modelArray.remove(i)}
                      aria-label="Remove model"
                      className="mt-1 rounded-button p-2 text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2.5">
                    <p className="mb-1.5 text-xs font-semibold text-text-secondary">
                      Image (optional)
                    </p>
                    <VariantImagePicker
                      images={images}
                      value={watch(`models.${i}.image`) ?? ""}
                      disabled={isSubmitting}
                      onChange={(url) =>
                        setValue(`models.${i}.image`, url, { shouldDirty: true })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sizes */}
        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">Sizes</h3>
            <button
              type="button"
              onClick={() => sizeArray.append({ value: "" })}
              className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <Plus size={15} />
              Add size
            </button>
          </div>
          <p className="mb-3 text-xs text-text-secondary">
            A label per option (e.g. S, M, L or 38, 40, 42).
          </p>

          {sizeArray.fields.length === 0 ? (
            <p className="text-sm text-text-secondary">No sizes added.</p>
          ) : (
            <div className="space-y-3">
              {sizeArray.fields.map((field, i) => (
                <div key={field.id} className="flex items-start gap-3">
                  <div className="flex-1">
                    <input
                      {...register(`sizes.${i}.value` as const)}
                      placeholder="Size label (e.g. M)"
                      className={inputCls}
                    />
                    <FieldError msg={errors.sizes?.[i]?.value?.message} />
                  </div>
                  <button
                    type="button"
                    onClick={() => sizeArray.remove(i)}
                    aria-label="Remove size"
                    className="mt-1 rounded-button p-2 text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Images */}
      <section className="rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 font-heading text-lg font-bold text-text-primary">
          Images
        </h2>
        <p className="mb-4 text-xs text-text-secondary">
          Upload one or more photos. Reorder them, remove any, and choose which is
          the main thumbnail. Products with no image show a neutral placeholder.
        </p>
        <ProductImageUploader
          images={images}
          thumbnail={thumbnail}
          disabled={isSubmitting}
          onChange={(nextImages, nextThumb) => {
            setValue("images", nextImages, { shouldValidate: true, shouldDirty: true });
            setValue("thumbnail", nextThumb, { shouldValidate: true, shouldDirty: true });
          }}
        />
        <FieldError msg={errors.images?.message} />
        <FieldError msg={errors.thumbnail?.message} />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          disabled={isSubmitting}
          className="rounded-button border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-button bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

/**
 * Picks an optional image for a variant option from the product's already
 * uploaded images (a "None" choice clears it). Keeps the assignment robust:
 * only images that exist in the gallery can be chosen, so a variant can never
 * reference a deleted file.
 */
function VariantImagePicker({
  images,
  value,
  onChange,
  disabled,
}: {
  images: string[];
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  if (images.length === 0) {
    return (
      <p className="text-xs text-text-secondary">
        Upload images above first to assign one.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        disabled={disabled}
        className={`flex h-12 items-center rounded-button border px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${
          value === ""
            ? "border-primary bg-primary/5 text-primary"
            : "border-border text-text-secondary hover:border-primary/40"
        }`}
      >
        None
      </button>
      {images.map((url) => {
        const selected = url === value;
        return (
          <button
            key={url}
            type="button"
            onClick={() => onChange(url)}
            disabled={disabled}
            aria-label="Use this image"
            aria-pressed={selected}
            className={`h-12 w-12 overflow-hidden rounded-button border-2 transition-colors disabled:opacity-50 ${
              selected ? "border-primary" : "border-transparent hover:border-border"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}
