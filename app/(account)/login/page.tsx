"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { createClient } from "@/lib/supabase/client";
import { loginAction } from "@/lib/auth/actions";
import { friendlyAuthError } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { useBotGuard, Honeypot } from "@/components/shared/botProtection";
import Turnstile, { turnstileConfigured } from "@/components/shared/Turnstile";
import GoogleButton from "@/components/shared/GoogleButton";

const CALLBACK_ERRORS: Record<string, string> = {
  link_invalid:
    "That link is invalid or has expired. Please sign in, or request a new link.",
  oauth: "Google sign-in didn't complete. Please try again or use email.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const showToast = useUIStore((s) => s.showToast);
  const [showPw, setShowPw] = useState(false);

  const next = searchParams.get("next") || "/";
  const callbackError = searchParams.get("error");

  const [formError, setFormError] = useState<string | null>(
    callbackError ? (CALLBACK_ERRORS[callbackError] ?? null) : null,
  );
  // Set to the email when login fails because it isn't confirmed yet.
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Cloudflare Turnstile token + a key used to force a fresh widget (and thus a
  // fresh single-use token) after any failed attempt.
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
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const { honeypotRef, check, recordSubmit } = useBotGuard({ formId: "login" });

  const onValid = async (data: LoginInput) => {
    setFormError(null);
    setUnconfirmedEmail(null);
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

    const result = await loginAction({
      email: data.email,
      password: data.password,
      turnstileToken: captchaToken ?? undefined,
    });

    if (!result.ok) {
      // The token is single-use; reset the widget so a retry gets a fresh one.
      resetCaptcha();
      setUnconfirmedEmail(result.unconfirmedEmail ?? null);
      setFormError(result.error);
      return;
    }

    // The session cookies were set by the server action. Do a full-page
    // navigation so the browser Supabase client re-reads them and the
    // AuthProvider picks up the new session.
    showToast("Welcome back! 👋", "success");
    window.location.assign(next);
  };

  const resendConfirmation = async () => {
    if (!unconfirmedEmail) return;
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
      },
    });
    setResending(false);
    if (error) {
      showToast(friendlyAuthError(error), "error");
    } else {
      showToast("Confirmation email sent — check your inbox.", "success");
    }
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
        <Link href="/" className="mb-8 flex items-center justify-center">
          <span className="font-heading text-2xl font-bold tracking-widest text-primary">YOYOSO</span>
        </Link>

        <div className="rounded-card border border-border bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to your account</p>

          {formError && (
            <div
              role="alert"
              className="mt-4 rounded-button border border-[#FF7A6B]/40 bg-[#FF7A6B]/10 px-3 py-2.5 text-sm font-medium text-[#C0392B]"
            >
              {formError}
              {unconfirmedEmail && (
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={resending}
                  className="mt-2 block font-semibold text-primary underline hover:text-primary-dark disabled:opacity-60"
                >
                  {resending ? "Sending…" : "Resend confirmation email"}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onValid)} className="relative mt-6 space-y-4">
            <Honeypot inputRef={honeypotRef} />
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
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Password *
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
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

            <Turnstile
              key={captchaKey}
              action="login"
              onToken={setCaptchaToken}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-button bg-primary text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-secondary">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="mt-4">
            <GoogleButton label="Sign in with Google" next={next} />
          </div>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-primary-dark">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
