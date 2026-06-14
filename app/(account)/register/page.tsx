"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { registerAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBotGuard, Honeypot } from "@/components/shared/botProtection";
import Turnstile, { turnstileConfigured } from "@/components/shared/Turnstile";

export default function RegisterPage() {
  const showToast = useUIStore((s) => s.showToast);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Set once the confirmation email has been sent — swaps the form for a notice.
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Cloudflare Turnstile token + a key to force a fresh widget after a failure.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { countryCode: "+961" },
  });

  const { honeypotRef, check, recordSubmit } = useBotGuard({ formId: "register" });

  const onValid = async (data: RegisterInput) => {
    setFormError(null);
    const guard = check();
    if (!guard.ok) {
      if (guard.reason === "rate-limited" || guard.reason === "cooldown") {
        showToast("Please wait a moment before trying again.", "error");
      }
      return;
    }

    if (turnstileConfigured && !captchaToken) {
      setFormError("Please complete the verification challenge below.");
      return;
    }
    recordSubmit();

    const result = await registerAction({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      countryCode: data.countryCode,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      agreeTerms: data.agreeTerms,
      turnstileToken: captchaToken ?? undefined,
      origin: window.location.origin,
    });

    if (!result.ok) {
      // The token is single-use; reset the widget so a retry gets a fresh one.
      resetCaptcha();
      setFormError(result.error);
      showToast(result.error, "error");
      return;
    }

    setSentTo(result.email);
    showToast("Account created! Check your email to confirm. 🎉", "success");
  };

  const fieldClass = (hasError: boolean) =>
    cn(
      "w-full rounded-button border bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
      hasError ? "border-primary" : "border-border focus:border-primary",
    );

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <Link href="/" aria-label="YOYOSO home" className="mb-8 flex items-center justify-center">
          <Image src="/yoyoso-logo.png" alt="YOYOSO" width={600} height={106} priority className="h-9 w-auto" />
        </Link>

        <div className="rounded-card border border-border bg-white p-8 shadow-sm">
          {sentTo ? (
            // ── Confirmation-sent notice ──────────────────────────────────
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MailCheck size={30} className="text-primary" />
              </div>
              <h1 className="mt-5 font-heading text-2xl font-bold text-text-primary">
                Confirm your email
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                We&apos;ve sent a verification link to{" "}
                <span className="font-semibold text-text-primary">{sentTo}</span>.
                Click it to activate your account, then sign in.
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Didn&apos;t get it? Check your spam folder, or try{" "}
                <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
                  signing in
                </Link>{" "}
                to resend.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-button bg-primary text-base font-bold text-white transition-colors hover:bg-primary-dark"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-bold text-text-primary">
                Create Account
              </h1>
              <p className="mt-1 text-sm text-text-secondary">Join YOYOSO</p>

              {formError && (
                <div
                  role="alert"
                  className="mt-4 rounded-button border border-[#FF7A6B]/40 bg-[#FF7A6B]/10 px-3 py-2.5 text-sm font-medium text-[#C0392B]"
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit(onValid)} className="relative mt-6 space-y-4">
                <Honeypot inputRef={honeypotRef} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      First Name *
                    </label>
                    <input
                      maxLength={100}
                      className={fieldClass(!!errors.firstName)}
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs font-medium text-primary">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Last Name *
                    </label>
                    <input
                      maxLength={100}
                      className={fieldClass(!!errors.lastName)}
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs font-medium text-primary">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    className={fieldClass(!!errors.email)}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs font-medium text-primary">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="shrink-0 rounded-button border border-border bg-white px-2 py-3 text-sm focus:border-primary focus:outline-none"
                      {...register("countryCode")}
                    >
                      <option value="+961">🇱🇧 +961</option>
                      <option value="+974">🇶🇦 +974</option>
                    </select>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="76 520 447"
                      maxLength={30}
                      className={cn(fieldClass(!!errors.phone), "flex-1")}
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs font-medium text-primary">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Password *
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
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      maxLength={128}
                      className={cn(fieldClass(!!errors.confirmPassword), "pr-10")}
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs font-medium text-primary">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <label className="flex items-start gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-primary"
                    {...register("agreeTerms")}
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" className="font-semibold text-primary hover:text-primary-dark">
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="font-semibold text-primary hover:text-primary-dark">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-xs font-medium text-primary">{errors.agreeTerms.message}</p>
                )}

                <Turnstile
                  key={captchaKey}
                  action="register"
                  onToken={setCaptchaToken}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 w-full items-center justify-center rounded-button bg-primary text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
                >
                  {isSubmitting ? "Creating account…" : "Create Account"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-text-secondary">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
