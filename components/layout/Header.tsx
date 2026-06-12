"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import SearchDropdown from "@/components/search/SearchDropdown";
import {
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  LogOut,
  Package,
  ShieldCheck,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useUIStore } from "@/store/uiStore";
import { useCategories } from "@/components/shared/CategoriesProvider";
import { siteConfig } from "@/data/config";
import { buildSupportWhatsAppUrl } from "@/lib/whatsapp";
import { useContactInfo } from "@/components/shared/SettingsProvider";
import { useIsLoggedIn, useIsAdmin, useSignOut } from "@/components/shared/AuthProvider";
import { CATEGORY_ICONS } from "@/components/shared/categoryIcons";

// ── Sub-components ────────────────────────────────────────────────────────────

function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="YOYOSO home"
      className={`inline-flex items-center ${className ?? ""}`}
    >
      {/* Transparent teal wordmark on the white header. h-6 mobile → h-7 desktop;
          w-auto keeps the 600×106 aspect ratio crisp on retina. */}
      <Image
        src="/yoyoso-logo.png"
        alt="YOYOSO"
        width={600}
        height={106}
        priority
        className="h-6 w-auto sm:h-7"
      />
    </Link>
  );
}

function IconBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-badge bg-primary text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function AccountMenu() {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const signOutUser = useSignOut();
  const showToast = useUIStore((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await signOutUser();
    showToast("Signed out. See you soon!", "info");
  };

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="hidden p-2 text-text-primary transition-colors hover:text-primary lg:flex"
        aria-label="My account"
      >
        <User size={22} />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 p-2 text-text-primary transition-colors hover:text-primary"
      >
        <User size={22} />
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-card border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 border-b border-border bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <ShieldCheck size={16} />
              Admin Panel
            </Link>
          )}
          <Link
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-primary transition-colors hover:bg-surface"
          >
            <Package size={16} className="text-text-secondary" />
            My Orders
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-primary transition-colors hover:bg-surface"
          >
            <Heart size={16} className="text-text-secondary" />
            My Wishlist
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 border-t border-border px-4 py-3 text-sm text-primary transition-colors hover:bg-surface"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Header() {
  const pathname = usePathname();
  const categories = useCategories();
  const isAdmin = useIsAdmin();
  const supportWhatsAppUrl = buildSupportWhatsAppUrl(useContactInfo().whatsapp);

  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const [scrolled, setScrolled] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const openDropdown = (slug: string) => {
    clearTimeout(closeTimer.current);
    setHoveredCat(slug);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setHoveredCat(null), 80);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setExpandedCat(null);
  };

  const activeCategorySlug = pathname.startsWith("/category/")
    ? pathname.split("/")[2]
    : null;

  const dropdownCategory =
    hoveredCat
      ? categories.find((c) => c.slug === hoveredCat && c.subcategories.length > 0) ?? null
      : null;

  return (
    <>
      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-300 ${
          scrolled ? "shadow-[0_2px_20px_rgba(0,0,0,0.07)]" : ""
        }`}
      >
        {/* ROW 1 — Main header */}
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          {/* Mobile: hamburger */}
          <button
            className="-ml-1 p-2 text-text-primary transition-colors hover:text-primary lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Logo className="shrink-0" />

          {/* Desktop search */}
          <div className="mx-4 hidden flex-1 items-center lg:flex">
            <SearchDropdown className="w-full max-w-xl" />
          </div>

          {/* Right-side actions */}
          <div className="ml-auto flex items-center gap-0.5">
            <AccountMenu />

            <Link
              href="/wishlist"
              className="relative p-2 text-text-primary transition-colors hover:text-primary"
              aria-label={`Wishlist — ${wishlistCount} item${wishlistCount !== 1 ? "s" : ""}`}
            >
              <Heart size={22} />
              <IconBadge count={wishlistCount} />
            </Link>

            <Link
              href="/cart"
              className="relative p-2 text-text-primary transition-colors hover:text-primary"
              aria-label={`Cart — ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
            >
              <ShoppingCart size={22} />
              <IconBadge count={cartCount} />
            </Link>

            <a
              href={supportWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 hidden items-center gap-1.5 rounded-button bg-whatsapp px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 lg:flex"
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* ROW 2 — Category nav (desktop only) */}
        <nav
          className="hidden border-t border-border lg:block"
          aria-label="Product categories"
        >
          <div className="relative">
            <div className="scrollbar-hide overflow-x-auto">
              <ul
                className="mx-auto flex max-w-7xl items-center px-4"
                onMouseLeave={scheduleClose}
              >
                {categories.map((cat) => {
                  const isActive = activeCategorySlug === cat.slug;
                  const hasSubs = cat.subcategories.length > 0;
                  const catIconDef = CATEGORY_ICONS[cat.slug];
                  const CatIcon = catIconDef?.Icon;
                  return (
                    <li
                      key={cat.slug}
                      className="shrink-0"
                      onMouseEnter={() =>
                        hasSubs ? openDropdown(cat.slug) : scheduleClose()
                      }
                    >
                      <Link
                        href={`/category/${cat.slug}`}
                        className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors ${
                          isActive
                            ? "border-primary font-bold text-primary"
                            : "border-transparent font-medium text-text-secondary hover:text-primary"
                        }`}
                      >
                        {CatIcon && (
                          <CatIcon
                            size={13}
                            strokeWidth={2}
                            style={{
                              color: isActive
                                ? "#2BC4B6"
                                : catIconDef?.accentColor ?? "#6B7878",
                              opacity: isActive ? 1 : 0.75,
                            }}
                          />
                        )}
                        <span>{cat.name}</span>
                        {hasSubs && (
                          <ChevronDown
                            size={11}
                            className={`ml-0.5 opacity-50 transition-transform duration-150 ${
                              hoveredCat === cat.slug ? "rotate-180 opacity-100" : ""
                            }`}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Subcategory dropdown */}
            <AnimatePresence>
              {dropdownCategory && (
                <motion.div
                  key={dropdownCategory.slug}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  onMouseEnter={() => openDropdown(dropdownCategory.slug)}
                  onMouseLeave={scheduleClose}
                  className="absolute left-0 right-0 top-full z-[200] border-b border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                  role="menu"
                  aria-label={`${dropdownCategory.name} subcategories`}
                >
                  <div className="mx-auto max-w-7xl px-4 py-3">
                    <ul className="flex flex-wrap gap-2">
                      {dropdownCategory.subcategories.map((sub) => (
                        <li key={sub.slug}>
                          <Link
                            href={`/category/${dropdownCategory.slug}?sub=${sub.slug}`}
                            role="menuitem"
                            className="rounded-badge border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-primary hover:bg-surface hover:text-primary"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>

      {/* ── MOBILE MENU ───────────────────────────────────────────────────── */}

      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileMenu}
      />

      {/* Slide-in drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed left-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer top bar */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Logo />
          <button
            onClick={closeMobileMenu}
            className="p-2 text-text-secondary transition-colors hover:text-primary"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Mobile search */}
        <div className="border-b border-border px-4 py-3">
          <SearchDropdown onNavigate={closeMobileMenu} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Categories */}
          <ul className="py-2" aria-label="Product categories">
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              const hasSubs = cat.subcategories.length > 0;
              const isExpanded = expandedCat === cat.slug;
              const catIconDef = CATEGORY_ICONS[cat.slug];
              const CatIcon = catIconDef?.Icon;

              const iconEl = CatIcon ? (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: catIconDef.bgTint }}
                >
                  <CatIcon
                    size={15}
                    strokeWidth={1.75}
                    style={{ color: catIconDef.accentColor }}
                  />
                </div>
              ) : (
                <div className="h-8 w-8 shrink-0" />
              );

              return (
                <li key={cat.slug}>
                  {hasSubs ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCat(isExpanded ? null : cat.slug)
                        }
                        className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors ${
                          isActive
                            ? "bg-primary/5 font-bold text-primary"
                            : "text-text-primary hover:bg-surface"
                        }`}
                      >
                        {iconEl}
                        <span className="flex-1 text-left text-sm">
                          {cat.name}
                        </span>
                        <ChevronRight
                          size={16}
                          className={`text-text-secondary transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.ul
                            key={cat.slug}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                            style={{ backgroundColor: "rgba(43,196,182,0.04)" }}
                          >
                            {cat.subcategories.map((sub) => (
                              <li key={sub.slug}>
                                <Link
                                  href={`/category/${cat.slug}?sub=${sub.slug}`}
                                  onClick={closeMobileMenu}
                                  className="flex items-center py-2.5 pl-[60px] pr-4 text-sm text-text-secondary transition-colors hover:text-primary"
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                        isActive
                          ? "bg-primary/5 font-bold text-primary"
                          : "text-text-primary hover:bg-surface"
                      }`}
                    >
                      {iconEl}
                      <span className="text-sm">{cat.name}</span>
                      {isActive && (
                        <ChevronRight size={16} className="ml-auto" />
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Utility links */}
          <div className="border-t border-border py-2">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 font-semibold text-primary transition-colors hover:bg-surface"
              >
                <ShieldCheck size={20} />
                <span className="text-sm">Admin Panel</span>
              </Link>
            )}
            <Link
              href="/login"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-4 py-3 text-text-primary transition-colors hover:bg-surface"
            >
              <User size={20} className="text-text-secondary" />
              <span className="text-sm font-medium">Account / Login</span>
            </Link>
            <Link
              href="/wishlist"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-4 py-3 text-text-primary transition-colors hover:bg-surface"
            >
              <Heart size={20} className="text-text-secondary" />
              <span className="text-sm font-medium">
                Wishlist
                {wishlistCount > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-badge bg-primary px-1.5 py-0.5 text-xs font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </span>
            </Link>
          </div>

          {/* WhatsApp CTA */}
          <div className="border-t border-border px-4 py-4">
            <a
              href={supportWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-button bg-whatsapp py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle size={18} />
              Chat with us
            </a>
          </div>

          {/* Social links */}
          <div className="border-t border-border px-4 py-4">
            <div className="flex gap-3">
              <a
                href={siteConfig.contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-button border border-border py-2 text-center text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                Instagram
              </a>
              <a
                href={siteConfig.contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-button border border-border py-2 text-center text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
