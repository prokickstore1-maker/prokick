export interface TopClub {
  name: string;
  team: string;
  league: string;
  logo: string;
}

export const TOP_CLUBS: TopClub[] = [
  // 1. Spanyol (La Liga)
  { name: "Real Madrid", team: "Real Madrid", league: "La Liga", logo: "/clubs/real-madrid.webp" },
  { name: "Barcelona", team: "Barcelona", league: "La Liga", logo: "/clubs/barcelona.webp" },
  { name: "Atlético", team: "Atletico Madrid", league: "La Liga", logo: "/clubs/atletico-madrid.png" },
  { name: "Real Betis", team: "Real Betis", league: "La Liga", logo: "/clubs/real-betis.png" },

  // 2. Inggris (Premier League)
  { name: "Man United", team: "Manchester United", league: "Premier League", logo: "/clubs/manchester-united.png" },
  { name: "Arsenal", team: "Arsenal", league: "Premier League", logo: "/clubs/arsenal.png" },
  { name: "Liverpool", team: "Liverpool", league: "Premier League", logo: "/clubs/liverpool.png" },
  { name: "Chelsea", team: "Chelsea", league: "Premier League", logo: "/clubs/chelsea.png" },
  { name: "Man City", team: "Manchester City", league: "Premier League", logo: "/clubs/manchester-city.png" },
  { name: "Newcastle", team: "Newcastle United", league: "Premier League", logo: "/clubs/newcastle-united.png" },
  { name: "Tottenham", team: "Tottenham Hotspur", league: "Premier League", logo: "/clubs/tottenham-hotspur.png" },
  { name: "West Ham", team: "West Ham United", league: "Premier League", logo: "/clubs/west-ham.png" },
  { name: "Everton", team: "Everton", league: "Premier League", logo: "/clubs/everton.png" },
  { name: "Crystal Palace", team: "Crystal Palace", league: "Premier League", logo: "/clubs/crystal-palace.png" },

  // 3. Italia (Serie A)
  { name: "Juventus", team: "Juventus", league: "Serie A", logo: "/clubs/juventus.png" },
  { name: "AC Milan", team: "AC Milan", league: "Serie A", logo: "/clubs/ac-milan.webp" },
  { name: "Inter Milan", team: "Inter Milan", league: "Serie A", logo: "/clubs/inter-milan.webp" },
  { name: "Napoli", team: "Napoli", league: "Serie A", logo: "/clubs/napoli.png" },
  { name: "Lazio", team: "Lazio", league: "Serie A", logo: "/clubs/lazio.png" },

  // 4. Jerman (Bundesliga)
  { name: "Bayern Munich", team: "Bayern Munich", league: "Bundesliga", logo: "/clubs/bayern-munich.webp" },
  { name: "Dortmund", team: "Borussia Dortmund", league: "Bundesliga", logo: "/clubs/borussia-dortmund.webp" },

  // 5. Prancis (Ligue 1)
  { name: "PSG", team: "PSG", league: "Ligue 1", logo: "/clubs/psg.png" },
  { name: "Marseille", team: "Marseille", league: "Ligue 1", logo: "/clubs/marseille.png" },

  // 6. Rest of World / Amerika Latin / Portugal
  { name: "Santos", team: "Santos", league: "Rest of World", logo: "/clubs/santos.png" },
  { name: "Sporting CP", team: "Sporting CP", league: "Rest of World", logo: "/clubs/sporting-cp.png" },
  { name: "Flamengo", team: "Flamengo", league: "Rest of World", logo: "/clubs/flamengo.png" },
  { name: "Corinthians", team: "Corinthians", league: "Rest of World", logo: "/clubs/corinthians.png" },
];
