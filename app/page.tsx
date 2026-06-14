import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getStores } from "@/lib/data/stores";
import HeroSection from "@/components/homepage/HeroSection";
import TrustBadges from "@/components/homepage/TrustBadges";
import CategoryGrid from "@/components/homepage/CategoryGrid";
import NewArrivals from "@/components/homepage/NewArrivals";
import FeatureBanners from "@/components/homepage/FeatureBanners";
import WhatsAppCTA from "@/components/homepage/WhatsAppCTA";
import StoreLocatorPreview from "@/components/homepage/StoreLocatorPreview";
import InstagramSection from "@/components/homepage/InstagramSection";
import NewsletterSection from "@/components/homepage/NewsletterSection";

export const metadata: Metadata = buildMetadata({
  description:
    "Aesthetic, fashionable & affordable — beauty, home, fashion & more. Shop YOYOSO.",
  path: "/",
});

export default async function Home() {
  const stores = await getStores();

  return (
    <div className="flex flex-col">
      {/* Hero — internal pt-6 */}
      <HeroSection />

      {/* Trust badges — white full-bleed with border-y */}
      <TrustBadges />

      {/* Category Grid — on page surface (#FAFBFB) */}
      <div className="py-14 md:py-20">
        <CategoryGrid />
      </div>

      {/* New Arrivals — subtle alternate tint */}
      <div className="py-14 md:py-20" style={{ backgroundColor: "var(--color-section-alt)" }}>
        <NewArrivals />
      </div>

      {/* Feature Banners — back to page surface */}
      <div className="py-14 md:py-20">
        <FeatureBanners />
      </div>

      {/* WhatsApp CTA — teal gradient full-bleed (self-contained) */}
      <WhatsAppCTA />

      {/* Store Locator — alternate tint */}
      <div className="py-14 md:py-20" style={{ backgroundColor: "var(--color-section-alt)" }}>
        <StoreLocatorPreview stores={stores} />
      </div>

      {/* Instagram — page surface; self-contained spacing, hides itself when
          the admin hasn't curated any images yet. */}
      <InstagramSection />

      {/* Newsletter — self-contained bg-surface + py */}
      <NewsletterSection />
    </div>
  );
}
