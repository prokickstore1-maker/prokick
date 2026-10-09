import * as dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { db, client } from "../lib/db";
import { users, paymentMethods, jerseys, banners, settings } from "../db/schema";

async function seed() {
  console.log("Starting ProKick Store Malaysia seed script...");

  try {
    // 1. Seed Admin User
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!adminPassword || adminPassword.length < 12) {
      throw new Error("ADMIN_SEED_PASSWORD must be set and contain at least 12 characters.");
    }
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    console.log("Seeding admin user...");
    await db.insert(users).values({
      email: "admin@prokick.my",
      password: passwordHash,
      name: "ProKick MY Administrator",
      role: "ADMIN",
    }).onConflictDoNothing();

    // 2. Seed Payment Methods (Malaysian Standards)
    console.log("Seeding Malaysian payment methods...");
    await db.insert(paymentMethods).values([
      {
        type: "qr_pay",
        label: "Instant QR Pay",
        accountName: "PROKICK MALAYSIA ENTERPRISE",
        accountNumber: "012-3456789",
        qrImageUrl: null,
        isActive: true,
      },
      {
        type: "bank_transfer",
        label: "Maybank",
        accountName: "PROKICK MALAYSIA ENTERPRISE",
        accountNumber: "5140 1234 5678",
        isActive: true,
      },
      {
        type: "bank_transfer",
        label: "CIMB Bank",
        accountName: "PROKICK MALAYSIA ENTERPRISE",
        accountNumber: "8001 2345 6789",
        isActive: true,
      },
      {
        type: "duitnow_qr",
        label: "Touch 'n Go eWallet",
        accountName: "PROKICK MALAYSIA",
        accountNumber: "012-3456789",
        isActive: true,
      },
    ]);

    // 3. Seed Pure Football Jerseys (MYR Currency)
    console.log("👕 Seeding football jerseys with Malaysian Ringgit pricing...");
    await db.insert(jerseys).values([
      {
        name: "Real Madrid Home 2026/27 Player Issue",
        team: "Real Madrid",
        league: "La Liga",
        season: "2026/2027",
        type: "Player Issue",
        category: "Klub",
        price: "129.00",
        description: "Official Player Issue edition featuring HEAT.RDY technology, ultra-lightweight breathable jacquard fabric, and heat-applied silicone crest.",
        image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stockData: JSON.stringify({ S: 10, M: 15, L: 12, XL: 8, XXL: 4 }),
        stock: 49,
        tags: "home, real madrid, player issue, ucl, la liga",
        isBestSeller: true,
        isFeatured: true,
      country: "Spain",
edition: "Current",
kitType: "Home",
      },

      {
        name: "Arsenal Home 2026/27 Authentic Kit",
        team: "Arsenal",
        league: "Premier League",
        season: "2026/2027",
        type: "Player Issue",
        category: "Klub",
        price: "129.00",
        description: "Arsenal authentic home kit engineered with aerodynamic ventilation panels and golden cannon emblem.",
        image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stockData: JSON.stringify({ S: 8, M: 14, L: 10, XL: 5, XXL: 3 }),
        stock: 40,
        tags: "home, arsenal, epl, authentic, cannon",
        isBestSeller: true,
        isFeatured: true,
      country: "England",
edition: "Current",
kitType: "Home",
      },

      {
        name: "Liverpool Home 2026/27 Fans Version",
        team: "Liverpool",
        league: "Premier League",
        season: "2026/2027",
        type: "Fans Version",
        category: "Klub",
        price: "89.00",
        description: "Stadium edition in deep red with embroidered crest and moisture-wicking fabric.",
        image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stockData: JSON.stringify({ S: 15, M: 20, L: 18, XL: 10, XXL: 5 }),
        stock: 68,
        tags: "home, liverpool, anfield, epl, fans",
        isBestSeller: true,
        isFeatured: true,
      country: "England",
edition: "Current",
kitType: "Home",
      },

      {
        name: "Manchester United Home 2026/27 Fans Version",
        team: "Manchester United",
        league: "Premier League",
        season: "2026/2027",
        type: "Fans Version",
        category: "Klub",
        price: "89.00",
        description: "Classic red devil stadium jersey with crisp white accents and ribbed collar detailing.",
        image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stockData: JSON.stringify({ S: 12, M: 22, L: 15, XL: 9, XXL: 4 }),
        stock: 62,
        tags: "home, manchester united, red devils, epl",
        isBestSeller: true,
        isFeatured: true,
      country: "England",
edition: "Current",
kitType: "Home",
      },

      {
        name: "Manchester City Away 2026/27 Player Issue",
        team: "Manchester City",
        league: "Premier League",
        season: "2026/2027",
        type: "Player Issue",
        category: "Klub",
        price: "129.00",
        description: "Pro-fit away kit with dynamic electric pinstripes and metallic badge finish.",
        image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stockData: JSON.stringify({ S: 6, M: 10, L: 8, XL: 4, XXL: 2 }),
        stock: 30,
        tags: "away, man city, epl, champions",
        isBestSeller: false,
        isFeatured: true,
      country: "England",
edition: "Current",
kitType: "Away",
      },

      {
        name: "FC Barcelona Home 2026/27 Senyera Edition",
        team: "FC Barcelona",
        league: "La Liga",
        season: "2026/2027",
        type: "Fans Version",
        category: "Klub",
        price: "89.00",
        description: "Split-stripe home shirt with inner neckline detail and embroidered crest.",
        image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stockData: JSON.stringify({ S: 10, M: 18, L: 12, XL: 7, XXL: 3 }),
        stock: 50,
        tags: "home, barcelona, culers, la liga",
        isBestSeller: true,
        isFeatured: true,
      country: "Spain",
edition: "Current",
kitType: "Home",
      },

      {
        name: "Harimau Malaya Special Stadium Edition 2026",
        team: "Malaysia",
        league: "World Cup",
        season: "2026",
        type: "Fans Version",
        category: "Tim Nasional",
        price: "79.00",
        description: "Official national team tribute jersey featuring vibrant yellow & black tiger stripes with embroidered FAM crest.",
        image: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stockData: JSON.stringify({ S: 25, M: 35, L: 30, XL: 15, XXL: 10 }),
        stock: 115,
        tags: "malaysia, harimau malaya, national team, stadium",
        isBestSeller: true,
        isFeatured: true,
      country: "Malaysia",
edition: "Current",
kitType: "Home",
      },

      {
        name: "Manchester United 1998/1999 Treble Final Retro",
        team: "Manchester United",
        league: "Retro Classic",
        season: "1998/1999",
        type: "Retro",
        category: "Klub",
        price: "109.00",
        description: "1999 Champions League final shirt with SHARP sponsor and starry crest.",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["M", "L", "XL"]),
        stockData: JSON.stringify({ M: 12, L: 10, XL: 6 }),
        stock: 28,
        tags: "retro, vintage, treble, camp nou, classic",
        isBestSeller: true,
        isFeatured: true,
      country: "England",
edition: "Vintage",
kitType: "Home",
      },

      {
        name: "Arsenal 2003/2004 Invincibles Gold Retro",
        team: "Arsenal",
        league: "Retro Classic",
        season: "2003/2004",
        type: "Retro",
        category: "Klub",
        price: "109.00",
        description: "Commemorative shirt with O2 sponsor and Highbury gold trim.",
        image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        stockData: JSON.stringify({ S: 5, M: 10, L: 8, XL: 4 }),
        stock: 27,
        tags: "retro, invincibles, highbury, henry, vintage",
        isBestSeller: true,
        isFeatured: true,
      },
    ]);

    // 4. Seed Banners
    console.log("Seeding hero banners...");
    await db.insert(banners).values([
      {
        image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80",
        title: "NEW SEASON 2026/27 DROPS",
        subtitle: "Official Player Issue & Fan Edition Kits Now in Malaysia",
        link: "/jersey",
        active: true,
        displayOrder: 1,
      },
    ]);

    // 5. Seed Settings
    console.log("Seeding store settings...");
    await db.insert(settings).values([
      { key: "storeName", value: "ProKick Store Malaysia" },
      { key: "currency", value: "RM" },
      { key: "whatsappNumber", value: "60123456789" },
      { key: "peninsularShippingCost", value: "8.00" },
      { key: "eastShippingCost", value: "15.00" },
      { key: "freeShippingMinItems", value: "2" },
      { key: "runningBannerText", value: "NEW SEASON 2026/27 DROPS | FREE DELIVERY ON 2+ SHIRTS | INSTANT PAYMENT ACCEPTED" },
    ]).onConflictDoNothing();

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await client.end();
  }
}

seed();
