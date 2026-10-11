import { ShippingZone } from "./promo";

export interface IndonesianProvince {
  code: string;
  name: string;
  zone: ShippingZone;
}

// Zona pengiriman dua tingkat (pola sama dengan model lama):
// Jawa = ongkir dasar; Luar Jawa = ongkir lebih tinggi.
export const INDONESIAN_PROVINCES: IndonesianProvince[] = [
  { code: "JK", name: "DKI Jakarta", zone: "Jawa" },
  { code: "BT", name: "Banten", zone: "Jawa" },
  { code: "JB", name: "Jawa Barat", zone: "Jawa" },
  { code: "JT", name: "Jawa Tengah", zone: "Jawa" },
  { code: "JI", name: "Jawa Timur", zone: "Jawa" },
  { code: "YO", name: "DI Yogyakarta", zone: "Jawa" },
  { code: "AC", name: "Aceh", zone: "Luar Jawa" },
  { code: "SU", name: "Sumatera Utara", zone: "Luar Jawa" },
  { code: "SB", name: "Sumatera Barat", zone: "Luar Jawa" },
  { code: "RI", name: "Riau", zone: "Luar Jawa" },
  { code: "KR", name: "Kepulauan Riau", zone: "Luar Jawa" },
  { code: "JB2", name: "Jambi", zone: "Luar Jawa" },
  { code: "BE", name: "Bengkulu", zone: "Luar Jawa" },
  { code: "SS", name: "Sumatera Selatan", zone: "Luar Jawa" },
  { code: "BB", name: "Kepulauan Bangka Belitung", zone: "Luar Jawa" },
  { code: "LA", name: "Lampung", zone: "Luar Jawa" },
  { code: "BA", name: "Bali", zone: "Luar Jawa" },
  { code: "NB", name: "Nusa Tenggara Barat", zone: "Luar Jawa" },
  { code: "NT", name: "Nusa Tenggara Timur", zone: "Luar Jawa" },
  { code: "KB", name: "Kalimantan Barat", zone: "Luar Jawa" },
  { code: "KT", name: "Kalimantan Tengah", zone: "Luar Jawa" },
  { code: "KI", name: "Kalimantan Timur", zone: "Luar Jawa" },
  { code: "KU", name: "Kalimantan Utara", zone: "Luar Jawa" },
  { code: "KS", name: "Kalimantan Selatan", zone: "Luar Jawa" },
  { code: "SA", name: "Sulawesi Utara", zone: "Luar Jawa" },
  { code: "SR", name: "Sulawesi Barat", zone: "Luar Jawa" },
  { code: "SN", name: "Sulawesi Tengah", zone: "Luar Jawa" },
  { code: "SG", name: "Sulawesi Tenggara", zone: "Luar Jawa" },
  { code: "SW", name: "Sulawesi Selatan", zone: "Luar Jawa" },
  { code: "GO", name: "Gorontalo", zone: "Luar Jawa" },
  { code: "MA", name: "Maluku", zone: "Luar Jawa" },
  { code: "MU", name: "Maluku Utara", zone: "Luar Jawa" },
  { code: "PA", name: "Papua", zone: "Luar Jawa" },
  { code: "PB", name: "Papua Barat", zone: "Luar Jawa" },
  { code: "PP", name: "Papua Pegunungan", zone: "Luar Jawa" },
  { code: "PS", name: "Papua Selatan", zone: "Luar Jawa" },
  { code: "PT", name: "Papua Tengah", zone: "Luar Jawa" },
  { code: "PD", name: "Papua Barat Daya", zone: "Luar Jawa" },
];

export function getShippingZoneByProvince(provinceName: string): ShippingZone {
  const match = INDONESIAN_PROVINCES.find(
    (s) => s.name.toLowerCase() === provinceName.toLowerCase() || s.code.toLowerCase() === provinceName.toLowerCase()
  );
  return match?.zone ?? "Jawa";
}

export const JNT_COURIER = {
  name: "J&T Express",
  trackingUrl: "https://www.jtexpress.id/tracking",
};
