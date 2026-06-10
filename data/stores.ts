/**
 * Physical store locations for YOYOSO.
 */

import { siteConfig } from "./config";

export interface Store {
  slug: string;
  name: string;
  region: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: string;
  mapsUrl: string;
  lat: number | null;
  lng: number | null;
}

export const stores: Store[] = [
  {
    slug: "koura",
    name: "YOYOSO — Koura",
    region: "Koura, North Lebanon",
    address: "TODO: add Koura branch address",
    phone: "06 955011",
    whatsapp: siteConfig.contact.whatsappNumber,
    hours: "Mon–Sun: 10:00 AM – 8:00 PM",
    mapsUrl: "https://maps.app.goo.gl/67hEYrGbwg4yeDLf8",
    lat: null,
    lng: null,
  },
  {
    slug: "le-mall-dbayeh",
    name: "YOYOSO — Le Mall Dbayeh",
    region: "Dbayeh, Mount Lebanon",
    address: "TODO: add Le Mall Dbayeh address",
    phone: "04 417010",
    whatsapp: siteConfig.contact.whatsappNumber,
    hours: "Mon–Sun: 10:00 AM – 10:00 PM",
    mapsUrl: "https://maps.app.goo.gl/rRc8ua2ZL6UkvvGE8",
    lat: null,
    lng: null,
  },
  {
    slug: "city-center-hazmieh",
    name: "YOYOSO — City Center Hazmieh",
    region: "Hazmieh, Mount Lebanon",
    address: "TODO: add City Center Hazmieh address",
    phone: "01 282275",
    whatsapp: siteConfig.contact.whatsappNumber,
    hours: "Mon–Sun: 10:00 AM – 10:00 PM",
    mapsUrl: "https://maps.app.goo.gl/kqFRDCcVtH4u7Fz88",
    lat: null,
    lng: null,
  },
  {
    slug: "city-mall",
    name: "YOYOSO — City Mall",
    region: "Dora, Beirut",
    address: "TODO: add City Mall address",
    phone: "01 890196",
    whatsapp: siteConfig.contact.whatsappNumber,
    hours: "Mon–Sun: 10:00 AM – 10:00 PM",
    mapsUrl: "https://maps.app.goo.gl/gykQZ4mbyck47ov48",
    lat: null,
    lng: null,
  },
  {
    slug: "tripoli",
    name: "YOYOSO — Tripoli",
    region: "Tripoli, North Lebanon",
    address: "TODO: add Tripoli branch address",
    phone: "", // TODO: add Tripoli phone when available
    whatsapp: siteConfig.contact.whatsappNumber,
    hours: "Mon–Sun: 10:00 AM – 10:00 PM",
    mapsUrl: "https://maps.app.goo.gl/4wG4zmzPv9jJ9Tny7",
    lat: null,
    lng: null,
  },
];

export const getStoreBySlug = (slug: string): Store | undefined =>
  stores.find((s) => s.slug === slug);

export default stores;
