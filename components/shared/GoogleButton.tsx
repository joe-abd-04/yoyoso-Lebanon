"use client";

// "Continue with Google" button wired to Supabase OAuth.
//
// The Google provider is NOT yet configured in Supabase. signInWithOAuth()
// returns an error (instead of redirecting) when the provider is disabled, so
// we catch it and show a friendly "coming soon" message — nothing crashes. Once
// you enable Google in the Supabase dashboard, this button starts working with
// no code change.
// TODO: configure Google OAuth provider in Supabase + Google Cloud Console.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/store/uiStore";

// Inline Google "G" — lucide-react v1 dropped brand icons, so we can't import it.
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function GoogleButton({
  label = "Continue with Google",
  next = "/",
}: {
  label?: string;
  next?: string;
}) {
  const showToast = useUIStore((s) => s.showToast);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        // Provider not enabled yet (or misconfigured) — degrade gracefully.
        showToast("Google sign-in is coming soon — please use email for now.", "info");
        setLoading(false);
      }
      // On success the browser is redirected to Google; nothing else to do.
    } catch {
      showToast("Google sign-in is coming soon — please use email for now.", "info");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-button border border-border bg-white text-sm font-semibold text-text-primary transition-colors hover:bg-surface disabled:opacity-70"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}
