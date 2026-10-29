// Lini produk: Jersey (default) dan Jaket. Subjenis jaket disimpan di kolom kitType.
export const PRODUCT_LINE_JERSEY = "Jersey";
export const PRODUCT_LINE_JACKET = "Jaket";
export const PRODUCT_LINES = [PRODUCT_LINE_JERSEY, PRODUCT_LINE_JACKET] as const;

export const JACKET_KINDS = ["Tracksuit", "Jaket", "Windbreaker"] as const;
export const JERSEY_KIT_TYPES = ["Home", "Away", "Third", "Training"] as const;

export function isJacket(item: { productLine?: string | null }): boolean {
  return item.productLine === PRODUCT_LINE_JACKET;
}

// Tabel ukuran resmi Jaket / Tracksuit / Windbreaker
export const JACKET_SIZES = [
  { label: "S", length: "69cm", bust: "50cm", height: "165-170cm", weight: "50-55kg" },
  { label: "M", length: "75cm", bust: "53cm", height: "170-175cm", weight: "55-65kg" },
  { label: "L", length: "78cm", bust: "55cm", height: "175-180cm", weight: "65-75kg" },
  { label: "XL", length: "82cm", bust: "57cm", height: "180-185cm", weight: "75-85kg" },
  { label: "XXL", length: "84cm", bust: "60cm", height: "185-190cm", weight: "85-100kg" },
] as const;
