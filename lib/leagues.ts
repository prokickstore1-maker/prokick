import type { NormalizedJersey } from "./data";

export interface TeamNavItem {
  name: string;
  href: string;
}

export interface LeagueOption {
  value: string;
  label: string;
  teams: TeamNavItem[];
  isNation?: boolean;
}

const PREFERRED_LEAGUE_ORDER = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Nation",
];

/**
 * Daftar liga & klub diturunkan dari data produk yang benar-benar ada — bukan hardcode.
 * Tambah produk dengan league/team baru → filter & dropdown navbar ikut bertambah sendiri.
 */
export function buildLeagueOptions(jerseys: NormalizedJersey[]): LeagueOption[] {
  const leagueMap = new Map<string, Set<string>>();

  for (const jersey of jerseys) {
    const league = (jersey.league || "").trim();
    if (!league) continue;

    if (!leagueMap.has(league)) {
      leagueMap.set(league, new Set());
    }

    const team = (jersey.team || "").trim();
    if (team) {
      leagueMap.get(league)!.add(team);
    }
  }

  // Urutkan liga sesuai urutan standar, liga baru lainnya mengikuti di belakang
  const sortedLeagues = [...leagueMap.keys()].sort((a, b) => {
    const ia = PREFERRED_LEAGUE_ORDER.indexOf(a);
    const ib = PREFERRED_LEAGUE_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const options: LeagueOption[] = [{ value: "", label: "All Kits", teams: [] }];

  for (const league of sortedLeagues) {
    const isNation = league.toLowerCase() === "nation" || league.toLowerCase() === "world cup";
    const teamsSet = leagueMap.get(league)!;
    const teams = [...teamsSet].sort().map((teamName) => ({
      name: teamName,
      href: isNation
        ? `/jersey?league=Nation&country=${encodeURIComponent(teamName)}`
        : `/jersey?league=${encodeURIComponent(league)}&team=${encodeURIComponent(teamName)}`,
    }));

    options.push({
      value: isNation ? "Nation" : league,
      label: isNation ? "Nation" : league,
      isNation,
      teams,
    });
  }

  return options;
}

