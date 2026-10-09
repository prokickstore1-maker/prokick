import type { NormalizedJersey } from "./data";

// Label tampilan untuk nilai league di DB yang bukan sekadar nama liga.
// "World Cup" = konteks Harimau Malaya (lihat DESIGN.md: token harimau khusus konteks ini).
const LEAGUE_LABELS: Record<string, string> = {
  "World Cup": "Harimau Malaya",
  "Retro Classic": "Retro Vault",
};

export interface LeagueOption {
  value: string;
  label: string;
  /** true kalau league ini memakai konteks Harimau/Malaysia (warna & badge khusus) */
  isHarimau: boolean;
}

/**
 * Daftar liga diturunkan dari data produk yang benar-benar ada — bukan hardcode.
 * Tambah produk dengan league baru → filter/menu ikut bertambah sendiri.
 */
export function buildLeagueOptions(jerseys: NormalizedJersey[]): LeagueOption[] {
  const seen = new Set<string>();
  const options: LeagueOption[] = [{ value: "", label: "All Kits", isHarimau: false }];

  for (const jersey of jerseys) {
    const value = (jersey.league || "").trim();
    if (!value || value.toLowerCase() === "world cup") {
      // World Cup perlu tetap muncul walau sudah ada; jangan di-skip
      if (!value) continue;
    }
    if (seen.has(value)) continue;
    seen.add(value);
    options.push({
      value,
      label: LEAGUE_LABELS[value] || value,
      isHarimau: value === "World Cup",
    });
  }

  return options;
}
