// Peta nama country (dari field produk) → kode bendera ISO untuk flagcdn.
// Produk baru dengan country baru → kalau tak ada di sini, tile tetap muncul
// tanpa gambar bendera (fallback inisial), bukan hilang.
export const COUNTRY_FLAGS: Record<string, string> = {
  England: "gb-eng", // flagcdn punya varian khusus Inggris
  Spain: "es",
  Malaysia: "my",
  France: "fr",
  Germany: "de",
  Italy: "it",
  Portugal: "pt",
  Netherlands: "nl",
  Argentina: "ar",
  Brazil: "br",
  Croatia: "hr",
  Belgium: "be",
  Mexico: "mx",
  Norway: "no",
  Canada: "ca",
  Colombia: "co",
  "United States": "us",
  Scotland: "gb-sct",
  "South Korea": "kr",
  Japan: "jp",
  "Saudi Arabia": "sa",
  Thailand: "th",
  Indonesia: "id",
  Singapore: "sg",
};

export function flagCode(country: string): string | null {
  return COUNTRY_FLAGS[country] || null;
}

export function flagUrl(country: string, width = 80): string | null {
  const code = flagCode(country);
  return code ? `https://flagcdn.com/w${width}/${code}.png` : null;
}
