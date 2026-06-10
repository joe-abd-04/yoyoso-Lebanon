"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, ArrowLeft, Mail } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/validation";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { useBotGuard, Honeypot } from "@/components/shared/botProtection";
import Turnstile, { turnstileConfigured } from "@/components/shared/Turnstile";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const { honeypotRef, check, recordSubmit } = useBotGuard({ formId: "forgot-password" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validity / bot signals: stay silent (show the generic success
    // state) so attackers can't probe which emails exist.
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success || !check().ok) {
      setSent(true);
      return;
    }

    if (turnstileConfigured && !captchaToken) {
      setFormError("Please complete the verification challenge below.");
      return;
    }
    recordSubmit();

    // The server verifies the CAPTCHA, then fires the reset email (ignoring
    // whether the address exists). A CAPTCHA failure is safe to surface — it
    // reveals nothing about account existence.
    const result = await forgotPasswordAction({
      email,
      turnstileToken: captchaToken ?? undefined,
      origin: window.location.origin,
    });

    if (!result.ok) {
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
      setFormError(result.error);
      return;
    }

    setSent(true);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail size={28} className="text-primary" />
        </div>

        <h1 className="mt-5 text-center font-heading text-2xl font-bold text-text-primary">
          Reset Your Password
        </h1>
        <p className="mt-1 text-center text-sm text-text-secondary">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-6 rounded-card border border-green-200 bg-green-50 px-5 py-4 text-center">
            <p className="text-sm font-semibold text-green-700">
              If an account exists for that email, a reset link is on its way.
            </p>
            <p className="mt-1 text-xs text-green-600">
              Check your inbox (and spam). The link opens a page to set a new
              password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative mt-6">
            <Honeypot inputRef={honeypotRef} />
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={254}
              required
              className="w-full rounded-button border border-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-4">
              <Turnstile
                key={captchaKey}
                action="forgot-password"
                onToken={setCaptchaToken}
              />
            </div>
            {formError && (
              <p className="mt-2 text-xs font-medium text-primary">{formError}</p>
            )}
            <button
              type="submit"
              className="mt-4 h-11 w-full rounded-button bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              Send Reset Link
            </button>
          </form>
        )}

        {/* WhatsApp fallback */}
        <div className="mt-6 rounded-card border border-border bg-surface p-5 text-center">
          <p className="text-sm text-text-secondary">
            Trouble resetting? Contact us directly on WhatsApp and we&apos;ll
            help you.
          </p>
          <a
            href="https://wa.me/96103133307"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-button bg-whatsapp py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle size={17} />
            Chat on WhatsApp
          </a>
        </div>

        {/* Back to login */}
        <Link
          href="/login"
          className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          <ArrowLeft size={15} />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
