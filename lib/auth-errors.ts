// Maps Supabase Auth errors to short, friendly, user-facing messages.
// We never surface raw error codes/messages to users.

import type { AuthError } from "@supabase/supabase-js";

type MaybeError = AuthError | { message?: string; code?: string } | null;

/** True when the error means the account exists but the email isn't verified. */
export function isEmailNotConfirmed(error: MaybeError): boolean {
  if (!error) return false;
  const code = "code" in error ? error.code : undefined;
  const msg = (error.message ?? "").toLowerCase();
  return code === "email_not_confirmed" || msg.includes("email not confirmed");
}

/** A friendly message for any auth error, falling back to a generic notice. */
export function friendlyAuthError(error: MaybeError): string {
  if (!error) return "Something went wrong. Please try again.";
  const code = "code" in error ? error.code : undefined;
  const msg = (error.message ?? "").toLowerCase();

  switch (code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please confirm your email first — check your inbox for the verification link.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try signing in instead.";
    case "weak_password":
      return "That password is too weak. Use at least 8 characters.";
    case "same_password":
      return "Your new password must be different from your current one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    case "validation_failed":
      return "Please double-check the details you entered.";
  }

  // Fallbacks by message text (older codes / network errors).
  if (msg.includes("invalid login")) return "Incorrect email or password.";
  if (msg.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox.";
  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("password"))
    return "Password doesn't meet the requirements (at least 8 characters).";
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Network error. Please check your connection and try again.";

  return "Something went wrong. Please try again.";
}
