"use client";

/**
 * Client-side bot protection that works WITHOUT a backend.
 *
 * Three independent, silent signals — none of which affect a real user:
 *   1. Honeypot      — a hidden field bots tend to auto-fill. If filled → bot.
 *   2. Min-fill-time — humans take >2s to complete a form. Instant submit → bot.
 *   3. Throttle      — per-form cooldown + max submissions per rolling window,
 *                      tracked in localStorage so it survives reloads.
 *
 * NOTE: This raises the cost of casual/scripted abuse only. It is NOT a
 * substitute for server-side rate limiting + a real CAPTCHA, which are
 * tracked in SECURITY-TODO.md for Phase 9.
 */

import { useCallback, useEffect, useRef } from "react";

// Default honeypot field name. IMPORTANT: it must NOT resemble any real
// autofill category (name/email/phone/company/url/address…) or Chrome's autofill
// and password managers will fill it when the user autofills the visible fields,
// silently blocking a legitimate submission. "x_field_hp" maps to nothing.
const DEFAULT_HONEYPOT = "x_field_hp";

export type BotGuardReason = "honeypot" | "too-fast" | "rate-limited" | "cooldown";
export interface BotGuardResult {
  ok: boolean;
  reason?: BotGuardReason;
}

interface BotGuardOptions {
  /** Unique id used to namespace throttle storage per form. */
  formId: string;
  /** Reject submits faster than this after mount (ms). */
  minSubmitMs?: number;
  /** Minimum gap between two submits (ms). */
  cooldownMs?: number;
  /** Max submits allowed inside `windowMs`. */
  maxPerWindow?: number;
  /** Rolling window length (ms). */
  windowMs?: number;
}

export function useBotGuard({
  formId,
  minSubmitMs = 2000,
  cooldownMs = 4000,
  maxPerWindow = 5,
  windowMs = 60_000,
}: BotGuardOptions) {
  // Mount time, used for the min-fill-time check. Set in an effect (not during
  // render) so the component stays pure; runs once on mount before any submit.
  const loadedAt = useRef(0);
  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const storageKey = `yys-bg-${formId}`;

  const readStamps = useCallback((): number[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      return Array.isArray(raw) ? raw.filter((t) => typeof t === "number") : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  /** Run all checks. Returns `{ ok: false, reason }` for suspected bots. */
  const check = useCallback((): BotGuardResult => {
    // 1. Honeypot filled → bot.
    if (honeypotRef.current && honeypotRef.current.value.trim() !== "") {
      return { ok: false, reason: "honeypot" };
    }
    // 2. Submitted impossibly fast → bot.
    if (Date.now() - loadedAt.current < minSubmitMs) {
      return { ok: false, reason: "too-fast" };
    }
    // 3. Throttle / rate limit.
    const now = Date.now();
    const recent = readStamps().filter((t) => now - t < windowMs);
    if (recent.length >= maxPerWindow) {
      return { ok: false, reason: "rate-limited" };
    }
    if (recent.length > 0 && now - recent[recent.length - 1] < cooldownMs) {
      return { ok: false, reason: "cooldown" };
    }
    return { ok: true };
  }, [readStamps, minSubmitMs, cooldownMs, maxPerWindow, windowMs]);

  /** Record a genuine submission so throttling can account for it. */
  const recordSubmit = useCallback(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const recent = readStamps().filter((t) => now - t < windowMs);
    recent.push(now);
    try {
      localStorage.setItem(storageKey, JSON.stringify(recent));
    } catch {
      // storage full / disabled — ignore
    }
  }, [readStamps, storageKey, windowMs]);

  return { honeypotRef, check, recordSubmit };
}

/**
 * Visually-hidden, off-screen honeypot input. Real users never see or fill it;
 * bots that blindly fill every field do. Hardened against browser autofill /
 * password managers (which would otherwise fill it and silently block a real
 * submission): non-semantic name, autoComplete="off", and the
 * ignore hints honoured by 1Password / LastPass / Bitwarden / Chrome.
 */
export function Honeypot({
  inputRef,
  name = DEFAULT_HONEYPOT,
}: {
  inputRef: React.Ref<HTMLInputElement>;
  name?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
    >
      <label aria-hidden="true">
        Leave this field empty
        <input
          ref={inputRef}
          type="text"
          name={name}
          tabIndex={-1}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
          defaultValue=""
        />
      </label>
    </div>
  );
}
