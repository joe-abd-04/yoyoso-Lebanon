"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation";

// Reached from the password-reset email link, which establishes a temporary
// recovery session (via /auth/confirm) before redirecting here. The user sets
// a new password with supabase.auth.updateUser().

export default function ResetPasswordPage() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onValid = async (data: ResetPasswordInput) => {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      // Most commonly: no recovery session (link expired or opened wrong).
      const msg =
        (error.message ?? "").toLowerCase().includes("session") ||
        error.status === 401
          ? "This reset link has expired or is invalid. Please request a new one."
          : friendlyAuthError(error);
      setFormError(msg);
      return;
    }

    showToast("Your password has been updated. You're all set! 🎉", "success");
    router.push("/");
    router.refresh();
  };

  const fieldClass = (hasError: boolean) =>
    cn(
      "w-full rounded-button border bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
      hasError ? "border-primary" : "border-border focus:border-primary",
    );

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <KeyRound size={28} className="text-primary" />
        </div>

        <h1 className="mt-5 text-center font-heading text-2xl font-bold text-text-primary">
          Set a New Password
        </h1>
        <p className="mt-1 text-center text-sm text-text-secondary">
          Choose a strong password you haven&apos;t used before.
        </p>

        <div className="mt-6 rounded-card border border-border bg-white p-8 shadow-sm">
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-button border border-[#FF7A6B]/40 bg-[#FF7A6B]/10 px-3 py-2.5 text-sm font-medium text-[#C0392B]"
            >
              {formError}
              <Link
                href="/forgot-password"
                className="mt-2 block font-semibold text-primary underline hover:text-primary-dark"
              >
                Request a new link
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit(onValid)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={128}
                  className={cn(fieldClass(!!errors.password), "pr-10")}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-primary">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Confirm New Password *
              </label>
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                maxLength={128}
                className={fieldClass(!!errors.confirmPassword)}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs font-medium text-primary">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-button bg-primary text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
            >
              {isSubmitting ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
