"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.1 });

function NavigationComplete() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);
  return null;
}

export default function RouteProgressBar() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || anchor.target === "_blank") return;
      if (href.startsWith("/") || href.startsWith(window.location.origin)) {
        NProgress.start();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <Suspense fallback={null}>
      <NavigationComplete />
    </Suspense>
  );
}
