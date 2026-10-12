import type { NormalizedJersey } from "./data";

export interface LeagueOption {
  value: string;
  label: string;
}

/**
 * Daftar liga diturunkan dari data produk yang benar-benar ada — bukan hardcode.
 * Tambah produk dengan league baru → filter/menu ikut bertambah sendiri.
 */
export function buildLeagueOptions(jerseys: NormalizedJersey[]): LeagueOption[] {
  const seen = new Set<string>();
  const options: LeagueOption[] = [{ value: "", label: "All Kits" }];

  for (const jersey of jerseys) {
    const value = (jersey.league || "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    options.push({ value, label: value });
  }

  return options;
}
