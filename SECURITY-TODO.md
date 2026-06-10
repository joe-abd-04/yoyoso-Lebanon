# Security TODO — Phase 9 (backend / launch)

The frontend hardening (input validation, sanitisation, client-side bot
protection, security headers/CSP, safe external links, robots.txt) is done.
**Client-side checks are NOT a security boundary** — they raise the cost of
abuse but can be bypassed by anyone who talks to the API directly. Everything
below requires the backend and MUST be completed before / at launch.

> **Phase 9.8 update (server-side hardening):** auth (login/register/forgot)
> moved to server actions with Cloudflare Turnstile verified server-side;
> server-side rate limiting + temporary account lockout added (Supabase migration
> 006); the contact form now saves to the DB (was localStorage). Items below are
> ticked accordingly.

## Authentication & accounts
- [x] **Server-side validation** of every request body — the same `zod` schemas
      run server-side in every mutating action (auth, placeOrder, products,
      settings, contact). Never trust the client.
- [x] **Hashed + salted passwords** — handled by Supabase Auth (bcrypt); we never
      store or see plaintext.
- [x] **Secure session management** — Supabase `@supabase/ssr` httpOnly cookies,
      refreshed in `proxy.ts`.
- [x] **Account lockout / backoff** after repeated failed logins (Phase 9.8B —
      per account, temporary, never permanent). Per-IP rate limiting also added.
- [ ] **2FA for the admin panel** (TOTP or WebAuthn). *(still outstanding)*
- [~] **Account-enumeration resistance** — forgot-password returns a generic
      confirmation server-side ✓. Register still reveals "account already exists"
      (deliberate UX tradeoff; Supabase otherwise obfuscates). Revisit if needed.
- [x] Password reset via signed, expiring, single-use tokens — Supabase recovery
      links (`/auth/confirm`).

## Bot / abuse protection (server-side)
- [x] **Real CAPTCHA** (Cloudflare Turnstile) with **server-side token
      verification** on register, login, forgot-password (Phase 9.8A). Checkout
      uses rate limiting instead (owner decision). Newsletter: still honeypot-only.
- [x] **Server-side rate limiting** on login, register, password-reset, order,
      and contact endpoints (Phase 9.8B — Supabase-backed, migration 006).
      Newsletter endpoint still to do.
- [ ] **Cloudflare (or equivalent) in front of the domain** for DDoS + bot
      mitigation, WAF rules, and bot-fight mode. (Owners were hit by bots on the
      previous site — this is the highest-impact item.) *(launch infra)*

## Data & transport
- [ ] **HTTPS/SSL enforced in production** + HSTS preload submission. The HSTS
      header is already sent (see `next.config.ts`); confirm TLS terminates
      correctly before submitting to the preload list.
- [ ] **Parameterised queries / ORM** for all DB access (no string-built SQL) to
      prevent SQL injection.
- [ ] **Database security**: least-privilege DB user, encrypted at rest,
      backups, no public network exposure.
- [x] **Secrets management**: secrets live in server-only env vars (audited —
      `SUPABASE_SECRET_KEY` is never `NEXT_PUBLIC_*` and is never imported into a
      client module). `.env.example` added (committed via a `.gitignore`
      exception; contains no values).
- [ ] **Payment data**: never store card/PAN data — delegate to the PCI-compliant
      gateway (Stripe / Areeba / Whish). COD only today.
- [x] **PII handling**: the contact form now saves to the `contact_messages`
      table via a server action (Phase 9.8B) — no more PII in `localStorage`.

## CSP / headers hardening
- [ ] Move to a **strict, nonce-based CSP** (drop `'unsafe-inline'` from
      `script-src`) using `proxy.ts` (Next.js 16's renamed middleware) once pages
      that need it are dynamically rendered — see
      `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.
      Alternatively enable experimental SRI to keep static rendering.
- [ ] Tighten `img-src` to the real product-image CDN and drop `picsum.photos`.
- [ ] Add a CSP report endpoint (`report-to` / `report-uri`) to monitor
      violations.

## Operations
- [ ] **Regular dependency audits** — run `npm audit` in CI; track the current
      moderate `postcss` advisory pulled in transitively by Next.js (do NOT run
      `npm audit fix --force`, which tries to downgrade Next.js to v9 — wait for
      an upstream Next.js patch).
- [ ] Security logging / monitoring + alerting on auth anomalies.
- [ ] Penetration test before launch.
