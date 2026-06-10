"use client";

// Cloudflare Turnstile widget (Phase 9.8).
//
// Renders the invisible/managed challenge and hands the resulting one-time token
// back to the parent via onToken. The token is then verified SERVER-SIDE in the
// auth server actions — this widget is only the client half.
//
// If NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (e.g. local dev without keys), the
// widget renders nothing and immediately reports a "configured: false" state so
// forms degrade gracefully. The server still fails closed in production.
//
// The widget is configured in the Cloudflare dashboard for both localhost and
// the production hostname, so the same site key works in dev and prod.

import { useCallback, useEffect, useId, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Minimal typing for the slice of the Turnstile JS API we use.
interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      action?: string;
    },
  ) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileLoading?: Promise<void>;
  }
}

/** Load the Turnstile script once, shared across all widget instances. */
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileLoading) return window.__turnstileLoading;

  window.__turnstileLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://challenges.cloudflare.com/turnstile"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      if (window.turnstile) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
  return window.__turnstileLoading;
}

export interface TurnstileProps {
  /** Called with the token on success, or null when it expires / errors. */
  onToken: (token: string | null) => void;
  /** Logical name of the action (helps analytics in the CF dashboard). */
  action?: string;
}

/**
 * Whether Turnstile is configured on the client. Forms use this to decide
 * whether to require a token before enabling submit.
 */
export const turnstileConfigured = Boolean(SITE_KEY);

export default function Turnstile({ onToken, action }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const reactId = useId();
  const [failed, setFailed] = useState(false);

  const reset = useCallback(() => {
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current(null);
    }
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return; // not configured — degrade gracefully
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        // Guard against double-render in React strict/dev remounts.
        if (widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          theme: "auto",
          callback: (token) => {
            setFailed(false);
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(null),
          "timeout-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            setFailed(true);
            onTokenRef.current(null);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // widget already gone
        }
        widgetIdRef.current = null;
      }
    };
    // reactId is intentionally part of the deps to tie the widget to this mount.
  }, [action, reactId]);

  if (!SITE_KEY) return null;

  return (
    <div>
      <div ref={containerRef} />
      {failed && (
        <p className="mt-1 text-xs font-medium text-primary">
          Couldn&apos;t load the verification challenge.{" "}
          <button
            type="button"
            onClick={reset}
            className="font-semibold underline hover:text-primary-dark"
          >
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
