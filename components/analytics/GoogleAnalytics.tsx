// Google Analytics (GA4) — PREP ONLY, inert until launch.
//
// This renders the GA4 gtag.js snippet ONLY when NEXT_PUBLIC_GA_ID is set. While
// the env var is empty (the current state — no live domain / real traffic yet)
// this component renders nothing, so GA stays completely off with zero runtime
// cost. To turn it on at launch:
//
//   1. Create a GA4 property and copy its Measurement ID (looks like "G-XXXXXXXXXX").
//   2. Set NEXT_PUBLIC_GA_ID in the production environment.
//      // TODO: add GA4 measurement ID at launch for visitor analytics
//   3. Whitelist Google in next.config.ts CSP, otherwise the scripts are blocked:
//        script-src  … https://www.googletagmanager.com
//        connect-src … https://www.google-analytics.com https://*.google-analytics.com
//        img-src already allows https: (GA's collection pixel is covered).
//
// Isolated here so wiring it up later is a one-line env change + a CSP tweak.

import Script from "next/script";

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // No measurement ID configured → render nothing (fully inert / no-op).
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
