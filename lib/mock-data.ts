export interface MockJersey {
  id: string;
  name: string;
  team: string;
  league: string;
  season: string;
  type: string;
  category: string;
  country: string;
  edition: string;
  kitType: string;
  price: string;
  description: string;
  image: string;
  images?: Array<{ url: string }>;
  sizes: string[];
  stockData: Record<string, number>;
  stock: number;
  tags: string;
  isBestSeller: boolean;
  isFeatured: boolean;
  isNew?: boolean;
}

export const MOCK_JERSEYS: MockJersey[] = [
  {
    id: "madrid-home-2026",
    name: "Real Madrid 2026/27 Player Issue",
    team: "Real Madrid",
    league: "La Liga",
    season: "2026/2027",
    type: "Player Issue",
    category: "Jersey",
    price: "129.00",
    description: "Player Issue shirt with breathable jacquard fabric and heat-applied crest.",
    image: "/images/jerseys/madrid-home.jpg",
    images: [
      { url: "/images/jerseys/madrid-home-front.jpg" },
      { url: "/images/jerseys/madrid-home-back.jpg" },
      { url: "/images/jerseys/madrid-home-crest.jpg" },
      { url: "/images/jerseys/madrid-home-sleeve.jpg" },
      { url: "/images/jerseys/madrid-home-detail.jpg" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    stockData: { S: 10, M: 15, L: 12, XL: 8, XXL: 4 },
    stock: 49,
    tags: "home, real madrid, player issue, ucl, la liga",
    isBestSeller: true,
    isFeatured: true,
  country: "Spain",
edition: "Current",
kitType: "Home",
  },

  {
    id: "arsenal-home-2026",
    name: "Arsenal 2026/27 Authentic Home",
    team: "Arsenal",
    league: "Premier League",
    season: "2026/2027",
    type: "Player Issue",
    category: "Jersey",
    price: "129.00",
    description: "Arsenal home shirt with ventilation panels and embroidered crest.",
    image: "/images/jerseys/arsenal-home.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    stockData: { S: 8, M: 14, L: 10, XL: 5, XXL: 3 },
    stock: 40,
    tags: "home, arsenal, epl, authentic, cannon",
    isBestSeller: true,
    isFeatured: true,
  country: "England",
edition: "Current",
kitType: "Home",
  },

  {
    id: "liverpool-home-2026",
    name: "Liverpool 2026/27 Fans Version",
    team: "Liverpool",
    league: "Premier League",
    season: "2026/2027",
    type: "Fans Version",
    category: "Jersey",
    price: "89.00",
    description: "Stadium edition in deep red with embroidered crest and moisture-wicking fabric.",
    image: "/images/jerseys/liverpool-home.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    stockData: { S: 15, M: 20, L: 18, XL: 10, XXL: 5 },
    stock: 68,
    tags: "home, liverpool, anfield, epl, fans",
    isBestSeller: true,
    isFeatured: true,
  country: "England",
edition: "Current",
kitType: "Home",
  },

  {
    id: "malaysia-stadium-2026",
    name: "Harimau Malaya 2026 Stadium Edition",
    team: "Malaysia",
    league: "World Cup",
    season: "2026",
    type: "Fans Version",
    category: "Tim Nasional",
    price: "79.00",
    description: "National team shirt with yellow and black stripes and embroidered crest.",
    image: "/images/jerseys/malaysia-home.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    stockData: { S: 25, M: 35, L: 30, XL: 15, XXL: 10 },
    stock: 115,
    tags: "malaysia, harimau malaya, national team, stadium",
    isBestSeller: true,
    isFeatured: true,
  country: "Malaysia",
edition: "Current",
kitType: "Home",
  },

  {
    id: "barca-senyera-2026",
    name: "FC Barcelona 2026/27 Home Kit",
    team: "FC Barcelona",
    league: "La Liga",
    season: "2026/2027",
    type: "Fans Version",
    category: "Jersey",
    price: "89.00",
    description: "Split-stripe home shirt with inner neckline detail and embroidered crest.",
    image: "/images/jerseys/barca-home.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    stockData: { S: 10, M: 18, L: 12, XL: 7, XXL: 3 },
    stock: 50,
    tags: "home, barcelona, culers, la liga",
    isBestSeller: true,
    isFeatured: true,
  country: "Spain",
edition: "Current",
kitType: "Home",
  },

  {
    id: "mancity-away-2026",
    name: "Manchester City 2026/27 Away Kit",
    team: "Manchester City",
    league: "Premier League",
    season: "2026/2027",
    type: "Player Issue",
    category: "Jersey",
    price: "129.00",
    description: "Away shirt with pinstripes and metallic badge.",
    image: "/images/jerseys/mancity-away.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    stockData: { S: 6, M: 10, L: 8, XL: 4, XXL: 2 },
    stock: 30,
    tags: "away, man city, epl, champions",
    isBestSeller: false,
    isFeatured: true,
  country: "England",
edition: "Current",
kitType: "Away",
  },

  {
    id: "manutd-treble-1999",
    name: "Manchester United 1999 Treble Retro",
    team: "Manchester United",
    league: "Retro Classic",
    season: "1998/1999",
    type: "Retro",
    category: "Jersey",
    price: "109.00",
    description: "1999 Champions League final shirt with SHARP sponsor and starry crest.",
    image: "/images/jerseys/manutd-retro.jpg",
    sizes: ["M", "L", "XL"],
    stockData: { M: 12, L: 10, XL: 6 },
    stock: 28,
    tags: "retro, vintage, treble, camp nou, classic",
    isBestSeller: true,
    isFeatured: true,
  country: "England",
edition: "Vintage",
kitType: "Home",
  },

];

export const MOCK_PAYMENT_METHODS = [
  {
    id: "qr-pay",
    type: "qr_pay",
    label: "Instant QR Pay",
    accountName: "PROKICK MALAYSIA ENTERPRISE",
    accountNumber: "012-3456789",
    qrImageUrl: null,
    isActive: true,
  },
  {
    id: "maybank",
    type: "bank_transfer",
    label: "Maybank",
    accountName: "PROKICK MALAYSIA ENTERPRISE",
    accountNumber: "5140 1234 5678",
    isActive: true,
  },
  {
    id: "cimb",
    type: "bank_transfer",
    label: "CIMB Bank",
    accountName: "PROKICK MALAYSIA ENTERPRISE",
    accountNumber: "8001 2345 6789",
    isActive: true,
  },
];

export interface MockBanner {
  id: string;
  image: string;
  title: string;
  badge?: string;
  subtitle?: string;
  link: string;
  cta: string;
}

export const MOCK_BANNERS: MockBanner[] = [
  {
    id: "banner-madrid-2026",
    image: "/images/hero/madrid-hero-2026.jpg",
    badge: "Official 2026/27 Kit",
    title: "Real Madrid Authentic",
    subtitle: "Player Issue matchday kit with embossed jacquard & Champions League details.",
    link: "/product/madrid-home-2026",
    cta: "Shop Kit",
  },
  {
    id: "banner-malaysia-2026",
    image: "/images/hero/malaysia-hero-2026.jpg",
    badge: "National Pride",
    title: "Harimau Malaya 2026",
    subtitle: "Official Stadium Edition yellow & black tigers kit for the upcoming qualifiers.",
    link: "/jersey?league=World+Cup",
    cta: "Support Malaysia",
  },
  {
    id: "banner-authentic-2026",
    image: "/images/hero/nike-hero.jpg",
    badge: "European Clubs",
    title: "European Club Kits",
    subtitle: "Official European club kits with custom player namesets & competition patches.",
    link: "/jersey",
    cta: "View All Kits",
  },
  {
    id: "banner-retro-2026",
    image: "/images/hero/retro-hero.jpg",
    badge: "Retro Vault 1999",
    title: "Treble Winners '99",
    subtitle: "Manchester United 1999 Treble classic with embroidered SHARP sponsor detail.",
    link: "/jersey?league=Retro+Classic",
    cta: "Shop Retro Kits",
  },
];
