import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/config";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";
import HideOnAdmin from "@/components/layout/HideOnAdmin";
import Toast from "@/components/shared/Toast";
import RouteProgressBar from "@/components/shared/RouteProgressBar";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { CategoriesProvider } from "@/components/shared/CategoriesProvider";
import { ProductsProvider } from "@/components/shared/ProductsProvider";
import { SettingsProvider } from "@/components/shared/SettingsProvider";
import { getCategories } from "@/lib/data/categories";
import { getProducts } from "@/lib/data/products";
import {
  getDeliveryFee,
  getActivePromo,
  getContactInfo,
} from "@/lib/data/settings";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, products, deliveryFee, promo, contact] = await Promise.all([
    getCategories(),
    getProducts(),
    getDeliveryFee(),
    getActivePromo(),
    getContactInfo(),
  ]);

  return (
    <html lang="en">
      <body
        className={`${jakarta.variable} ${dmSans.variable} bg-surface text-text-primary antialiased`}
      >
        <AuthProvider>
          <CategoriesProvider categories={categories}>
            <ProductsProvider products={products}>
              <SettingsProvider settings={{ deliveryFee, promo, contact }}>
                {/* Storefront chrome — hidden on the /admin panel (own shell). */}
                <HideOnAdmin>
                  <AnnouncementBar />
                  <Header />
                </HideOnAdmin>
                {/* relative z-0 establishes a stacking context below the sticky header (z-40)
                    so animated motion.divs can never bleed above the category dropdown */}
                <main className="relative z-0">{children}</main>
                <HideOnAdmin>
                  <Footer />
                  <FloatingWhatsApp />
                </HideOnAdmin>
                <Toast />
                <RouteProgressBar />
                {/* GA4 — inert until NEXT_PUBLIC_GA_ID is set (see component). */}
                <GoogleAnalytics />
              </SettingsProvider>
            </ProductsProvider>
          </CategoriesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
