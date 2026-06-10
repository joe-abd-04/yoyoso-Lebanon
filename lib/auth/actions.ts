"use server";

// SERVER ACTIONS — authentication (Phase 9.8).
//
// Login, registration and password-reset now run THROUGH the server so we can
// enforce real protections the client can't bypass:
//   1. zod re-validation of every field (never trust the client).
//   2. Cloudflare Turnstile token verification (server-side siteverify).
//   3. (Phase 9.8B) IP rate-limiting + per-account lockout — slots in here.
//
// The actual Supabase auth call uses the @supabase/ssr server client, which
// sets the session cookies on the response. After a successful login the client
// does a full-page navigation so the browser Supabase client re-reads the fresh
// session cookies (keeping the existing client-side AuthProvider model intact).
//
// Error messages returned to the client are always generic/friendly — raw
// Supabase errors and codes never leak.

import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { getClientIp } from "@/lib/security/request";
import {
  checkRateLimit,
  checkAuthLockout,
  recordAuthFailure,
  clearAuthFailures,
  retryAfterText,
  emailKey,
  RL,
} from "@/lib/security/rate-limit";
import { friendlyAuthError, isEmailNotConfirmed } from "@/lib/auth-errors";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from "@/lib/validation";

// ── Shared types ──────────────────────────────────────────────────────────────

export type LoginActionResult =
  | { ok: true }
  | { ok: false; error: string; unconfirmedEmail?: string };

export type RegisterActionResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export type ForgotActionResult =
  | { ok: true }
  | { ok: false; error: string };

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Validate a client-supplied origin so we never build a redirect from junk. */
function safeOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  try {
    const u = new URL(origin);
    if (u.protocol === "http:" || u.protocol === "https:") return u.origin;
  } catch {
    // not a URL
  }
  return null;
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(input: {
  email: string;
  password: string;
  turnstileToken?: string;
}): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse({
    email: input.email,
    password: input.password,
  });
  if (!parsed.success) {
    return { ok: false, error: "Incorrect email or password." };
  }

  const ip = await getClientIp();
  const ident = emailKey(parsed.data.email);

  // Rate limit per IP and per account (independent of success/failure).
  const ipOk = await checkRateLimit(`login:ip:${ip ?? "unknown"}`, RL.login.ip);
  const emailOk = await checkRateLimit(`login:email:${ident}`, RL.login.email);
  if (!ipOk || !emailOk) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  // CAPTCHA — server-side verification.
  const captcha = await verifyTurnstile(input.turnstileToken, ip);
  if (!captcha.ok) return { ok: false, error: captcha.error };

  // Account lockout after repeated failed logins (temporary, never permanent).
  const lockout = await checkAuthLockout(ident);
  if (lockout.locked) {
    return {
      ok: false,
      error: `Too many failed sign-in attempts. For your security, try again in ${retryAfterText(
        lockout.retryAfterSeconds,
      )}, or reset your password.`,
    };
  }

  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (isEmailNotConfirmed(error)) {
      // Not a credential failure — don't count it toward lockout.
      return {
        ok: false,
        error:
          "Your email isn't confirmed yet. Check your inbox for the verification link.",
        unconfirmedEmail: parsed.data.email,
      };
    }
    // Wrong password / unknown account → count toward the lockout window.
    await recordAuthFailure(ident);
    return { ok: false, error: friendlyAuthError(error) };
  }

  // Success — clear the failed-attempt history for this account.
  await clearAuthFailures(ident);
  return { ok: true };
}

// ── Register ────────────────────────────────────────────────────────────────

export async function registerAction(input: {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  turnstileToken?: string;
  origin?: string;
}): Promise<RegisterActionResult> {
  const parsed = registerSchema.safeParse({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    countryCode: input.countryCode,
    phone: input.phone,
    password: input.password,
    confirmPassword: input.confirmPassword,
    agreeTerms: input.agreeTerms,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const data = parsed.data;

  const ip = await getClientIp();
  const ipOk = await checkRateLimit(
    `register:ip:${ip ?? "unknown"}`,
    RL.register.ip,
  );
  if (!ipOk) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const captcha = await verifyTurnstile(input.turnstileToken, ip);
  if (!captcha.ok) return { ok: false, error: captcha.error };

  const origin = safeOrigin(input.origin);
  const supabase = await createServerAuthClient();
  const fullPhone = `${data.countryCode} ${data.phone.trim()}`;

  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`,
        phone: fullPhone,
      },
      ...(origin
        ? { emailRedirectTo: `${origin}/auth/confirm?next=/` }
        : {}),
    },
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error) };
  }

  // With email confirmation on, Supabase obfuscates an existing account by
  // returning a user with an empty `identities` array and no error.
  if (
    result.user &&
    Array.isArray(result.user.identities) &&
    result.user.identities.length === 0
  ) {
    return {
      ok: false,
      error: "An account with this email already exists. Try signing in instead.",
    };
  }

  return { ok: true, email: data.email };
}

// ── Forgot password ───────────────────────────────────────────────────────────

export async function forgotPasswordAction(input: {
  email: string;
  turnstileToken?: string;
  origin?: string;
}): Promise<ForgotActionResult> {
  // Per-IP rate limit + CAPTCHA up front. Neither leaks account-existence
  // information (they're independent of whether the email exists), so it's safe
  // to surface them.
  const ip = await getClientIp();
  const ipOk = await checkRateLimit(
    `forgot:ip:${ip ?? "unknown"}`,
    RL.forgot.ip,
  );
  if (!ipOk) {
    return {
      ok: false,
      error: "Too many requests. Please wait a few minutes and try again.",
    };
  }

  const captcha = await verifyTurnstile(input.turnstileToken, ip);
  if (!captcha.ok) return { ok: false, error: captcha.error };

  const parsed = forgotPasswordSchema.safeParse({ email: input.email });
  // Always return success regardless of validity/existence so attackers can't
  // probe which emails exist (account-enumeration resistant). Only fire the
  // real email when the address is well-formed.
  if (parsed.success) {
    const origin = safeOrigin(input.origin);
    const supabase = await createServerAuthClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      ...(origin
        ? { redirectTo: `${origin}/auth/confirm?next=/reset-password` }
        : {}),
    });
  }

  return { ok: true };
}
