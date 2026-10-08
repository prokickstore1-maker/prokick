import { ShippingZone } from "./promo";

export interface MalaysianState {
  code: string;
  name: string;
  zone: ShippingZone;
}

export const MALAYSIAN_STATES: MalaysianState[] = [
  // Peninsular Malaysia (West Malaysia)
  { code: "SGR", name: "Selangor", zone: "Peninsular Malaysia" },
  { code: "KUL", name: "WP Kuala Lumpur", zone: "Peninsular Malaysia" },
  { code: "PJY", name: "WP Putrajaya", zone: "Peninsular Malaysia" },
  { code: "JHR", name: "Johor", zone: "Peninsular Malaysia" },
  { code: "PNG", name: "Penang (Pulau Pinang)", zone: "Peninsular Malaysia" },
  { code: "PRK", name: "Perak", zone: "Peninsular Malaysia" },
  { code: "KDH", name: "Kedah", zone: "Peninsular Malaysia" },
  { code: "MLK", name: "Melaka", zone: "Peninsular Malaysia" },
  { code: "NSN", name: "Negeri Sembilan", zone: "Peninsular Malaysia" },
  { code: "PHG", name: "Pahang", zone: "Peninsular Malaysia" },
  { code: "TRG", name: "Terengganu", zone: "Peninsular Malaysia" },
  { code: "KTN", name: "Kelantan", zone: "Peninsular Malaysia" },
  { code: "PLS", name: "Perlis", zone: "Peninsular Malaysia" },

  // East Malaysia (Borneo)
  { code: "SBH", name: "Sabah", zone: "East Malaysia" },
  { code: "SWK", name: "Sarawak", zone: "East Malaysia" },
  { code: "LBN", name: "WP Labuan", zone: "East Malaysia" },
];

export function getShippingZoneByState(stateName: string): ShippingZone {
  const match = MALAYSIAN_STATES.find(
    (s) => s.name.toLowerCase() === stateName.toLowerCase() || s.code.toLowerCase() === stateName.toLowerCase()
  );
  return match?.zone ?? "Peninsular Malaysia";
}

export const MALAYSIAN_COURIERS = [
  { name: "Pos Laju", trackingUrl: "https://www.pos.com.my/tracking" },
  { name: "J&T Express Malaysia", trackingUrl: "https://www.jtexpress.my/tracking" },
  { name: "Ninja Van Malaysia", trackingUrl: "https://www.ninjavan.co/en-my/tracking" },
  { name: "DHL eCommerce Malaysia", trackingUrl: "https://ecommerceportal.dhl.com/track/" },
];
