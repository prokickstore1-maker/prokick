// Patch opsional per konteks produk: klub (liga domestik + kontinental)
// vs tim nasional (turnamen antarnegara). Dipakai jersey-customizer.

export interface PatchOption {
  id: string;
  label: string;
  category: "domestic" | "continental" | "international";
}

// Patch kompetisi kontinental & dunia untuk klub
export const CLUB_CONTINENTAL_PATCHES: PatchOption[] = [
  { id: "ucl", label: "UEFA Champions League Starball + Foundation", category: "continental" },
  { id: "uel", label: "UEFA Europa League", category: "continental" },
  { id: "uecl", label: "UEFA Conference League", category: "continental" },
  { id: "cwc", label: "FIFA Club World Cup Champions", category: "continental" },
];

// Patch liga domestik per liga
export const LEAGUE_DOMESTIC_PATCHES: Record<string, PatchOption[]> = {
  "Premier League": [
    { id: "epl-gold", label: "Premier League Champions (Gold Badge)", category: "domestic" },
    { id: "epl-regular", label: "Premier League Official Sleeve Badge", category: "domestic" },
    { id: "fa-cup", label: "Emirates FA Cup Badge", category: "domestic" },
  ],
  "La Liga": [
    { id: "laliga-champ", label: "La Liga Campeón Badge", category: "domestic" },
    { id: "laliga-regular", label: "La Liga Official Sleeve Badge", category: "domestic" },
  ],
  "Serie A": [
    { id: "seriea-scudetto", label: "Serie A Scudetto + Official Badge", category: "domestic" },
    { id: "seriea-regular", label: "Serie A Official Sleeve Badge", category: "domestic" },
  ],
  "Bundesliga": [
    { id: "bundesliga-meister", label: "Bundesliga Meister Badge", category: "domestic" },
    { id: "bundesliga-regular", label: "Bundesliga Official Sleeve Badge", category: "domestic" },
  ],
  "Retro Classic": [
    { id: "retro-ucl", label: "Retro Champions League Starball Badge", category: "continental" },
    { id: "retro-domestic", label: "Classic League Sleeve Badge", category: "domestic" },
  ],
};

// Patch turnamen internasional untuk tim nasional (tanpa UCL/EPL)
export const NATIONAL_TEAM_PATCHES: PatchOption[] = [
  { id: "wc", label: "FIFA World Cup Tournament Badge", category: "international" },
  { id: "wc-champ", label: "FIFA World Cup Champions Gold Badge", category: "international" },
  { id: "wc-qual", label: "FIFA World Cup Qualifiers Badge", category: "international" },
  { id: "euro", label: "UEFA Euro Tournament Badge", category: "international" },
  { id: "copa", label: "CONMEBOL Copa America Badge", category: "international" },
  { id: "asian-cup", label: "AFC Asian Cup Tournament Badge", category: "international" },
  { id: "aff", label: "AFF Mitsubishi Electric Cup Badge", category: "international" },
  { id: "afcon", label: "CAF Africa Cup of Nations Badge", category: "international" },
];

// Daftar patch valid berdasarkan data jersey
export function getAvailablePatches(jersey: {
  category?: string;
  league?: string;
  team?: string;
}): PatchOption[] {
  const cat = jersey.category?.toLowerCase() || "";
  const isNational =
    cat === "tim nasional" || cat === "national team" || cat === "national" ||
    jersey.league?.toLowerCase() === "world cup" ||
    jersey.league?.toLowerCase() === "nation" ||
    jersey.team?.toLowerCase() === "indonesia";

  if (isNational) return NATIONAL_TEAM_PATCHES;

  const league = jersey.league || "";
  const domesticPatches = LEAGUE_DOMESTIC_PATCHES[league] || [
    { id: "domestic-generic", label: `${league || "League"} Official Sleeve Badge`, category: "domestic" as const },
  ];

  return [...domesticPatches, ...CLUB_CONTINENTAL_PATCHES];
}
