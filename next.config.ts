import type { NextConfig } from "next";

// Only used to enable 'unsafe-eval' in dev (Next.js Turbopack dev overlay).
// ws/wss are always included in connect-src — timing of NODE_ENV evaluation
// in next start is unreliable, and WebSocket access is harmless for this site.
const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy.
 *
 * This site is statically rendered (no per-request nonce), so Next.js needs
 * 'unsafe-inline' for the small hydration/runtime scripts it injects. We still
 * lock down everything else: only same-origin code/styles, no plugins, no
 * framing, no arbitrary base/form targets. The only third-party origin we allow
 * is picsum.photos (placeholder product images — swap for the real image host
 * in Phase 9). Fonts are self-hosted by next/font, so font-src is just 'self'.
 *
 * In development we additionally allow 'unsafe-eval' (React refresh / source
 * maps) and websocket connections (HMR) so the dev server keeps working.
 *
 * Phase 9: move to a strict nonce-based CSP (drop 'unsafe-inline') via proxy.ts
 * once pages are dynamically rendered. See SECURITY-TODO.md.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is required in both dev and production: Next.js 16 / Turbopack
  // uses eval / Function() at runtime for module loading and hydration even in
  // production builds. Removing it breaks interactivity (Place Order, Add to Cart,
  // dropdowns, etc.). Phase 9: revisit once on a nonce-based dynamic CSP.
  // challenges.cloudflare.com: the Cloudflare Turnstile widget loads its script
  // from there (CAPTCHA on the auth forms — Phase 9.8).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  // Allow https: broadly so picsum.photos CDN redirects (fastly.picsum.photos)
  // and any future image host work without needing exact-domain whitelisting.
  "img-src 'self' data: blob: https:",
  // data: covers font face src rules that inline base64 font data.
  "font-src 'self' data:",
  // Supabase Auth + REST/Realtime run on the project's *.supabase.co origin and
  // must be reachable from the browser client (login, signup, OAuth, session
  // refresh). ws:/wss: cover Next HMR in dev. challenges.cloudflare.com is the
  // Turnstile widget's API endpoint.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com ws: wss:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Turnstile renders its challenge inside an iframe hosted on challenges.cloudflare.com.
  "frame-src https://challenges.cloudflare.com",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .concat(";");

/** Security headers applied to every response. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt-and-braces clickjacking protection (CSP frame-ancestors is the modern
  // equivalent, X-Frame-Options covers older browsers).
  { key: "X-Frame-Options", value: "DENY" },
  // Stop the browser MIME-sniffing a response into an unexpected type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which may contain query params) to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful APIs the storefront never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Force HTTPS for 2 years incl. subdomains (ignored over plain HTTP, so safe
  // to always send; takes effect once the site is served over TLS in prod).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Legacy XSS auditor (superseded by CSP, kept for older browsers / scanners).
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  // Don't advertise the framework/version in the response.
  poweredByHeader: false,
  // Allow next/image to optimize images served from our public Supabase Storage
  // bucket (product images + the curated Instagram gallery). Scoped to the
  // public object path so only public bucket files are proxied.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
