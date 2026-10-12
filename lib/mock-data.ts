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
    price: "451500",
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
    price: "451500",
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
    price: "311500",
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
    id: "indonesia-home-2026",
    name: "Indonesia 2026 Home",
    team: "Indonesia",
    league: "World Cup",
    season: "2026",
    type: "Fans Version",
    category: "Tim Nasional",
    price: "276500",
    description: "National team shirt with red and white accents and embroidered crest.",
    image: "/images/jerseys/malaysia-home.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    stockData: { S: 25, M: 35, L: 30, XL: 15, XXL: 10 },
    stock: 115,
    tags: "indonesia, timnas, national team, stadium",
    isBestSeller: true,
    isFeatured: true,
  country: "Indonesia",
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
    price: "311500",
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
    price: "451500",
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
    price: "381500",
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
    label: "QRIS",
    accountName: "ProKick Indonesia",
    accountNumber: "",
    qrImageUrl: null,
    isActive: true,
  },
  {
    id: "bca",
    type: "bank_transfer",
    label: "BCA",
    accountName: "ProKick Indonesia",
    accountNumber: "0000000000",
    isActive: true,
  },
  {
    id: "mandiri",
    type: "bank_transfer",
    label: "Mandiri",
    accountName: "ProKick Indonesia",
    accountNumber: "0000000000",
    isActive: true,
  },
  {
    id: "ewallet",
    type: "bank_transfer",
    label: "GoPay / OVO / DANA",
    accountName: "ProKick Indonesia",
    accountNumber: "081234567890",
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
    id: "banner-indonesia-2026",
    image: "/images/hero/malaysia-hero-2026.jpg",
    badge: "National Pride",
    title: "Timnas Indonesia 2026",
    subtitle: "Official stadium edition kit for the upcoming qualifiers.",
    link: "/jersey?league=World+Cup",
    cta: "Shop Timnas",
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
