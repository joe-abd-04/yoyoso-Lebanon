// SERVER-ONLY data access for stores.
// Uses the service-role server client, so only import this from Server
// Components / Route Handlers — never from a 'use client' file.
//
// Returns the existing UI `Store` shape (from data/stores.ts) so presentational
// components don't need to change. Fields the DB doesn't store (slug, whatsapp,
// lat/lng) are derived: slug = row id (used only as a React key), whatsapp from
// siteConfig, lat/lng = null.

import { createServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/data/config";
import type { Store } from "@/data/stores";

export async function getStores(): Promise<Store[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) {
      console.error("[getStores] Supabase error:", error?.message);
      return [];
    }

    return data.map((row) => ({
      slug: row.id,
      name: row.name,
      region: row.region,
      address: row.address,
      phone: row.phone ?? "",
      whatsapp: siteConfig.contact.whatsappNumber,
      hours: row.hours,
      mapsUrl: row.maps_url,
      lat: null,
      lng: null,
    }));
  } catch (err) {
    console.error("[getStores] Unexpected error:", err);
    return [];
  }
}
