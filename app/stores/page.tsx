import type { Metadata } from "next";
import StoreLocatorView from "@/components/stores/StoreLocatorView";
import { getStores } from "@/lib/data/stores";

export const metadata: Metadata = {
  title: "Our Stores | YOYOSO",
  description: "Find YOYOSO stores across Lebanon",
};

export default async function StoresPage() {
  const stores = await getStores();
  return <StoreLocatorView stores={stores} />;
}
