"use client";

// Branded (teal YOYOSO) admin chrome: a fixed sidebar on desktop and a
// slide-in drawer on mobile, plus a top bar. Purely presentational — the
// server-side gate lives in app/admin/layout.tsx (requireAdmin). The shell is
// only ever rendered for verified admins.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  Store,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useSignOut } from "@/components/shared/AuthProvider";
import { useUIStore } from "@/store/uiStore";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export default function AdminShell({
  adminEmail,
  pendingOrders = 0,
  children,
}: {
  adminEmail: string;
  pendingOrders?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const signOut = useSignOut();
  const showToast = useUIStore((s) => s.showToast);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    showToast("Signed out.", "info");
    router.push("/login");
    router.refresh();
  };

  const navList = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        const showBadge = href === "/admin/orders" && pendingOrders > 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setDrawerOpen(false)}
            className={`flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-white/15 text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {showBadge && (
              <span
                className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
                aria-label={`${pendingOrders} pending orders`}
              >
                {pendingOrders > 99 ? "99+" : pendingOrders}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col gap-6 p-5">
      {/* Brand */}
      <Link
        href="/admin"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-2"
      >
        <span className="font-heading text-xl font-extrabold tracking-tight text-white">
          YOYOSO
        </span>
        <span className="rounded-badge bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Admin
        </span>
      </Link>

      {navList}

      {/* Footer of sidebar */}
      <div className="mt-auto flex flex-col gap-1 border-t border-white/15 pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Store size={18} />
          View store
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          <LogOut size={18} />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
        <p className="truncate px-3 pt-2 text-xs text-white/55" title={adminEmail}>
          {adminEmail}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-primary-dark lg:block">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-primary-dark shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 text-white/80 hover:text-white"
            >
              <X size={22} />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-button p-2 text-text-primary hover:bg-surface lg:hidden"
          >
            <Menu size={20} />
          </button>
          <span className="font-heading text-sm font-bold text-text-primary">
            Admin Panel
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
