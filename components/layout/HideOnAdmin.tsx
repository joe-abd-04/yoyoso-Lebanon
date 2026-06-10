"use client";

// Renders its children on every route EXCEPT the admin panel (/admin/*).
// The admin panel has its own full-screen branded shell, so the storefront
// chrome (announcement bar, header, footer, floating WhatsApp) is hidden there.
//
// usePathname() runs on the client and is also resolved during SSR for the
// current request, so admin pages (which are dynamically rendered) never emit
// the storefront chrome into their HTML — no flash. It does NOT opt static
// storefront pages out of static generation.

import { usePathname } from "next/navigation";

export default function HideOnAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
