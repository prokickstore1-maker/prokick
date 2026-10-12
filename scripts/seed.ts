import "dotenv/config";

import bcrypt from "bcryptjs";
import { db, client } from "../lib/db";
import { users, paymentMethods, jerseys, banners, settings } from "../db/schema";

async function seed() {
  console.log("Starting ProKick Store Indonesia seed script...");

  try {
    // 1. Seed Admin User
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!adminPassword || adminPassword.length < 8) {
      throw new Error("ADMIN_SEED_PASSWORD must be set and contain at least 8 characters.");
    }
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    console.log("Seeding admin user...");
    await db.insert(users).values({
      email: "admin@prokick.my",
      password: passwordHash,
      name: "ProKick ID Administrator",
      role: "ADMIN",
    }).onConflictDoNothing();

    // 2. Seed Payment Methods (Indonesian Standards — placeholder, admin isi via Settings)
    console.log("Seeding Indonesian payment methods...");
    await db.insert(paymentMethods).values([
      {
        type: "qr_pay",
        label: "QRIS",
        accountName: "ProKick Indonesia",
        accountNumber: "",
        qrImageUrl: null,
        isActive: true,
      },
      {
        type: "bank_transfer",
        label: "BCA",
        accountName: "ProKick Indonesia",
        accountNumber: "0000000000",
        isActive: true,
      },
      {
        type: "bank_transfer",
        label: "Mandiri",
        accountName: "ProKick Indonesia",
        accountNumber: "0000000000",
        isActive: true,
      },
      {
        type: "bank_transfer",
        label: "BRI",
        accountName: "ProKick Indonesia",
        accountNumber: "0000000000",
        isActive: true,
      },
      {
        type: "ewallet",
        label: "GoPay / OVO / DANA",
        accountName: "ProKick Indonesia",
        accountNumber: "081234567890",
        isActive: true,
      },
    ]);

    // 3. Seed Pure Football Jerseys (IDR Currency)
    console.log("Seeding football jerseys with IDR pricing...");
    await db.insert(jerseys).values([
      {
        name: "Real Madrid Home 2026/27 Player Issue",
        team: "Real Madrid",
        league: "La Liga",
        season: "2026/2027",
        type: "Player Issue",
        category: "Klub",
        price: "451500",
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
        price: "451500",
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
        price: "311500",
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
        price: "311500",
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
        price: "451500",
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
        price: "311500",
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
        name: "Timnas Indonesia Special Stadium Edition 2026",
        team: "Indonesia",
        league: "World Cup",
        season: "2026",
        type: "Fans Version",
        category: "Tim Nasional",
        price: "276500",
        description: "Official national team stadium jersey with red & white accents and embroidered PSSI crest.",
        image: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800&auto=format&fit=crop&q=80",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stockData: JSON.stringify({ S: 25, M: 35, L: 30, XL: 15, XXL: 10 }),
        stock: 115,
        tags: "indonesia, timnas, national team, stadium",
        isBestSeller: true,
        isFeatured: true,
      country: "Indonesia",
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
        price: "381500",
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
        price: "381500",
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
        subtitle: "Official Player Issue & Fan Edition Kits Now in Indonesia",
        link: "/jersey",
        active: true,
        displayOrder: 1,
      },
    ]);

    // 5. Seed Settings
    console.log("Seeding store settings...");
    await db.insert(settings).values([
      { key: "storeName", value: "ProKick Store Indonesia" },
      { key: "currency", value: "IDR" },
      { key: "whatsappNumber", value: "6281234567890" },
      { key: "telegramUsername", value: "" },
      { key: "javaShippingCost", value: "15000" },
      { key: "outsideJavaShippingCost", value: "30000" },
      { key: "freeShippingMinItems", value: "2" },
      { key: "namesetFee", value: "70000" },
      { key: "patchFee", value: "35000" },
      { key: "freePatchMinItems", value: "3" },
      { key: "freeNamesetMinItems", value: "5" },
      { key: "sulawesiBlocked", value: "0" },
      { key: "invoiceChatButtons", value: "both" },
      { key: "runningBannerText", value: "NEW SEASON 2026/27 DROPS | GRATIS ONGKIR MIN. 2 Kaos | QRIS & E-WALLET" },
    ]).onConflictDoNothing();

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await client.end();
  }
}

seed();
