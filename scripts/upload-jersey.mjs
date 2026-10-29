#!/usr/bin/env node
/**
 * scripts/upload-jersey.mjs
 * UNIVERSAL ProKick Jersey Scraper & Uploader
 * 
 * Works for ANY club, national team, retro, home, away, third, player issue, or fans jersey.
 * Automatically parses metadata, extracts all high-res gallery angles, uploads to IDCloudHost S3,
 * and saves into PostgreSQL database (`jerseys` and `jersey_images`).
 * 
 * Usage:
 *   node scripts/upload-jersey.mjs --url "https://www.zoabcd.com/products/..." [--price 120000] [--name "..."] [--team "..."]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Common team mappings to leagues and countries
const TEAMS_DB = [
  { keywords: ['arsenal', 'ars'], team: 'Arsenal', league: 'Premier League', country: 'England' },
  { keywords: ['real madrid', 'madrid', 'rma'], team: 'Real Madrid', league: 'La Liga', country: 'Spain' },
  { keywords: ['barcelona', 'barca', 'fcb'], team: 'Barcelona', league: 'La Liga', country: 'Spain' },
  { keywords: ['manchester united', 'man utd', 'mufc', 'manu'], team: 'Manchester United', league: 'Premier League', country: 'England' },
  { keywords: ['manchester city', 'man city', 'mcfc'], team: 'Manchester City', league: 'Premier League', country: 'England' },
  { keywords: ['liverpool', 'lfc'], team: 'Liverpool', league: 'Premier League', country: 'England' },
  { keywords: ['chelsea', 'cfc'], team: 'Chelsea', league: 'Premier League', country: 'England' },
  { keywords: ['tottenham', 'spurs', 'thfc'], team: 'Tottenham', league: 'Premier League', country: 'England' },
  { keywords: ['bayern', 'bayern munich', 'munchen'], team: 'Bayern Munich', league: 'Bundesliga', country: 'Germany' },
  { keywords: ['dortmund', 'bvb'], team: 'Borussia Dortmund', league: 'Bundesliga', country: 'Germany' },
  { keywords: ['juventus', 'juve'], team: 'Juventus', league: 'Serie A', country: 'Italy' },
  { keywords: ['ac milan', 'milan', 'acm'], team: 'AC Milan', league: 'Serie A', country: 'Italy' },
  { keywords: ['inter milan', 'inter'], team: 'Inter Milan', league: 'Serie A', country: 'Italy' },
  { keywords: ['as roma', 'roma'], team: 'AS Roma', league: 'Serie A', country: 'Italy' },
  { keywords: ['psg', 'paris'], team: 'Paris Saint-Germain', league: 'Ligue 1', country: 'France' },
  { keywords: ['indonesia', 'timnas'], team: 'Indonesia', league: 'World Cup', country: 'Indonesia', category: 'Tim Nasional' },
  { keywords: ['argentina'], team: 'Argentina', league: 'World Cup', country: 'Argentina', category: 'Tim Nasional' },
  { keywords: ['brazil', 'brasil'], team: 'Brazil', league: 'World Cup', country: 'Brazil', category: 'Tim Nasional' },
  { keywords: ['japan', 'jepang'], team: 'Japan', league: 'World Cup', country: 'Japan', category: 'Tim Nasional' },
  { keywords: ['germany', 'jerman'], team: 'Germany', league: 'World Cup', country: 'Germany', category: 'Tim Nasional' },
  { keywords: ['portugal'], team: 'Portugal', league: 'World Cup', country: 'Portugal', category: 'Tim Nasional' },
  { keywords: ['england', 'inggris'], team: 'England', league: 'World Cup', country: 'England', category: 'Tim Nasional' },
  { keywords: ['france', 'prancis'], team: 'France', league: 'World Cup', country: 'France', category: 'Tim Nasional' },
  { keywords: ['spain', 'spanyol'], team: 'Spain', league: 'World Cup', country: 'Spain', category: 'Tim Nasional' },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsed[key] = val;
      if (val !== true) i++;
    }
  }
  return parsed;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function detectJerseyMetadata(rawTitle, rawDesc, url) {
  const combined = `${rawTitle} ${rawDesc} ${url}`.toLowerCase();

  // 1. Detect Season
  let season = '2026/2027';
  const seasonMatch = combined.match(/(19\d{2}|20\d{2})[\/\-_]?(19\d{2}|20\d{2}|\d{2})/);
  if (seasonMatch) {
    const startYear = seasonMatch[1];
    let endYear = seasonMatch[2];
    if (endYear.length === 2) {
      endYear = startYear.slice(0, 2) + endYear;
    }
    season = `${startYear}/${endYear}`;
  }

  // 2. Detect Product Line (Jersey vs Jaket) & Subtype
  let productLine = 'Jersey';
  let kitType = 'Home';
  let type = 'Player Issue';

  if (combined.includes('tracksuit') || combined.includes('track-suit') || combined.includes('training suit')) {
    productLine = 'Jaket';
    kitType = 'Tracksuit';
    type = 'Jaket';
  } else if (combined.includes('windbreaker') || combined.includes('wind-breaker')) {
    productLine = 'Jaket';
    kitType = 'Windbreaker';
    type = 'Jaket';
  } else if (combined.includes('jacket') || combined.includes('jaket') || combined.includes('anthem')) {
    productLine = 'Jaket';
    kitType = 'Jaket';
    type = 'Jaket';
  } else {
    if (combined.includes('away') || /\b-a-\b/.test(combined)) {
      kitType = 'Away';
    } else if (combined.includes('third') || combined.includes('3rd') || /\b-th-\b/.test(combined) || /\b-3rd-\b/.test(combined)) {
      kitType = 'Third';
    } else if (combined.includes('fourth') || combined.includes('4th')) {
      kitType = 'Fourth';
    }

    if (combined.includes('retro') || combined.includes('vintage') || combined.includes('classic')) {
      type = 'Retro';
    } else if (combined.includes('player') || combined.includes('pv') || combined.includes('authentic')) {
      type = 'Player Issue';
    } else if (combined.includes('fan') || combined.includes('fans') || combined.includes('stadium')) {
      type = 'Fans Version';
    }
  }

  // 4. Detect Team, League, Country
  let team = 'Football Club';
  let league = 'Premier League';
  let country = 'England';
  let category = 'Klub';

  for (const t of TEAMS_DB) {
    if (t.keywords.some((kw) => combined.includes(kw))) {
      team = t.team;
      league = t.league;
      country = t.country;
      category = t.category || (league === 'World Cup' ? 'Tim Nasional' : 'Klub');
      break;
    }
  }

  const edition = productLine === 'Jaket' ? 'Current' : (type === 'Retro' ? 'Vintage' : 'Current');
  const cleanName = productLine === 'Jaket'
    ? `${team} ${kitType} ${season}`
    : `${team} ${kitType} ${season} ${type}`;
  const defaultDesc = productLine === 'Jaket'
    ? `${kitType} ${team} musim ${season}. Material luar berkualitas tinggi yang nyaman untuk aktivitas harian maupun olahraga, dilengkapi detail crest bordir presisi.`
    : `Jersey ${team} ${kitType} musim ${season} ${type}. Menggunakan material performa tinggi berpori mikro yang sejuk dan ringan dengan detail emblem presisi dan jahitan autentik.`;

  return { productLine, name: cleanName, team, league, season, type, kitType, category, country, edition, description: defaultDesc };
}

async function scrapeProduct(url) {
  console.log(`\n🔍 Scraping URL: ${url}...`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch ${url}`);
  const html = await res.text();

  // 1. Extract Images
  let imageUrls = [];

  // Try extracting from embedded product JSON
  const imagesJsonMatch = html.match(/"images"\s*:\s*(\[[\s\S]*?\])/);
  if (imagesJsonMatch) {
    try {
      const parsed = JSON.parse(imagesJsonMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        imageUrls = parsed
          .map((item) => {
            const raw = typeof item === 'string' ? item : item.src || item.url || item.path;
            if (!raw) return null;
            let full = raw.startsWith('//') ? 'https:' + raw : raw;
            if (!full.startsWith('http')) full = 'https://img.staticdj.com/' + full;
            return full.replace(/_[0-9]+x[0-9]*\.(jpg|png|webp)/i, '.jpg');
          })
          .filter(Boolean);
      }
    } catch {
      // fallback to regex
    }
  }

  // Fallback: extract staticdj or general image URLs
  if (imageUrls.length === 0) {
    const rawMatches = html.match(/(?:https?:)?\/\/img\.staticdj\.com\/[a-f0-9]+(?:\.[a-z]+)?/gi) || [];
    const unique = new Set();
    for (let u of rawMatches) {
      if (!u.startsWith('http')) u = 'https:' + u;
      unique.add(u.replace(/_[0-9]+x[0-9]*\.(jpg|png|webp)/i, '.jpg'));
    }
    imageUrls = [...unique];
  }

  // 2. Extract Title & Description
  const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const rawTitle = ogTitleMatch?.[1] || h1Match?.[1]?.replace(/<[^>]+>/g, '').trim() || titleMatch?.[1] || '';

  const ogDescMatch = html.match(/property="og:description"\s+content="([^"]+)"/i);
  const rawDesc = ogDescMatch?.[1] || '';

  return { imageUrls, rawTitle, rawDesc };
}

async function run() {
  const args = parseArgs();
  const url = args.url;
  if (!url) {
    console.error('❌ Missing required flag: --url <supplier-url>');
    process.exit(1);
  }

  // 1. Scrape product data
  const { imageUrls, rawTitle, rawDesc } = await scrapeProduct(url);
  if (imageUrls.length === 0) {
    throw new Error('No product images could be found from the provided URL.');
  }

  console.log(`📸 Found ${imageUrls.length} high-resolution gallery images!`);

  // 2. Auto-detect or override metadata
  const detected = detectJerseyMetadata(rawTitle, rawDesc, url);
  const name = args.name || detected.name;
  const team = args.team || detected.team;
  const league = args.league || detected.league;
  const season = args.season || detected.season;
  // Auto-detect atau override via --productLine Jaket --kitType Tracksuit|Jaket|Windbreaker
  const productLine = args.productLine ? (args.productLine === 'Jaket' ? 'Jaket' : 'Jersey') : detected.productLine;
  const kitType = args.kitType || (productLine === 'Jaket' && !['Tracksuit', 'Jaket', 'Windbreaker'].includes(detected.kitType) ? 'Jaket' : detected.kitType);
  if (productLine === 'Jaket' && !['Tracksuit', 'Jaket', 'Windbreaker'].includes(kitType)) {
    throw new Error('Jaket wajib --kitType Tracksuit | Jaket | Windbreaker');
  }
  const type = productLine === 'Jaket' ? 'Jaket' : (args.type || detected.type);
  const category = args.category || detected.category;
  const country = args.country || detected.country;
  const edition = productLine === 'Jaket' ? 'Current' : detected.edition;
  const description = args.description || detected.description;
  const price = args.price ? String(args.price) : '120000.00';
  const slug = slugify(name);

  const stockData = { S: 10, M: 15, L: 20, XL: 15, XXL: 10 };
  const totalStock = Object.values(stockData).reduce((a, b) => a + b, 0);

  console.log(`\n======================================================`);
  console.log(`🚀 PROKICK STORE UNIVERSAL JERSEY UPLOADER`);
  console.log(`Jersey Name : ${name}`);
  console.log(`Team        : ${team} (${league} - ${country})`);
  console.log(`Line        : ${productLine}`);
  console.log(`Season/Type : ${season} | ${type} | ${kitType}`);
  console.log(`Retail Price: Rp ${Number(price).toLocaleString('id-ID')}`);
  console.log(`Total Angles: ${imageUrls.length} Photos`);
  console.log(`Slug        : ${slug}`);
  console.log(`======================================================\n`);

  // 3. Setup S3
  const endpoint = process.env.S3_ENDPOINT || 'https://is3.cloudhost.id';
  const region = process.env.S3_REGION || 'id-jkt-1';
  const bucket = process.env.S3_BUCKET || 'prokick';
  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  const localDir = path.join(rootDir, 'public', 'images', 'jerseys');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

  const finalS3Urls = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const imgUrl = imageUrls[i];
    console.log(`⬇️  [${i + 1}/${imageUrls.length}] Downloading: ${imgUrl}`);
    const resp = await fetch(imgUrl);
    if (!resp.ok) {
      console.warn(`  ⚠️ Skipping failed image: ${imgUrl}`);
      continue;
    }
    const buf = Buffer.from(await resp.arrayBuffer());

    // Local save
    const filename = `${slug}-angle-${i + 1}.jpg`;
    fs.writeFileSync(path.join(localDir, filename), buf);

    // S3 upload with public-read ACL
    const s3Key = `products/${slug}-angle-${i + 1}.jpg`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buf,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      })
    );

    const publicUrl = `${endpoint.replace(/\/$/, '')}/${bucket}/${s3Key}`;
    finalS3Urls.push(publicUrl);
    console.log(`  ☁️  Angle ${i + 1} live -> ${publicUrl}`);
  }

  if (finalS3Urls.length === 0) {
    throw new Error('All image downloads/uploads failed.');
  }

  // 4. PostgreSQL Database Upsert
  console.log(`\n🗄️  Syncing to PostgreSQL database...`);
  const sql = postgres(process.env.DATABASE_URL);

  try {
    const existing = await sql`
      SELECT id FROM jerseys 
      WHERE product_line = ${productLine}
        AND (name ILIKE ${name}
         OR (team = ${team} AND season = ${season} AND kit_type = ${kitType} AND type = ${type}))
      LIMIT 1
    `;

    let jerseyId;
    const primaryImage = finalS3Urls[0];

    if (existing.length > 0) {
      jerseyId = existing[0].id;
      console.log(`🔄 Updating existing jersey in database (ID: ${jerseyId})...`);
      await sql`
        UPDATE jerseys
        SET product_line = ${productLine},
            name = ${name},
            team = ${team},
            league = ${league},
            season = ${season},
            type = ${type},
            category = ${category},
            country = ${country},
            edition = ${edition},
            kit_type = ${kitType},
            price = ${price},
            description = ${description},
            image = ${primaryImage},
            sizes = ${JSON.stringify(Object.keys(stockData))},
            stock_data = ${JSON.stringify(stockData)},
            stock = ${totalStock},
            updated_at = NOW()
        WHERE id = ${jerseyId}
      `;
    } else {
      console.log(`✨ Inserting new jersey into database...`);
      const inserted = await sql`
        INSERT INTO jerseys (
          product_line, name, team, league, season, type, category, country, edition, kit_type,
          price, description, image, sizes, stock_data, stock
        ) VALUES (
          ${productLine}, ${name}, ${team}, ${league}, ${season}, ${type}, ${category}, ${country}, ${edition}, ${kitType},
          ${price}, ${description}, ${primaryImage},
          ${JSON.stringify(Object.keys(stockData))}, ${JSON.stringify(stockData)}, ${totalStock}
        ) RETURNING id
      `;
      jerseyId = inserted[0].id;
    }

    // Refresh multi-angle images in jersey_images
    await sql`DELETE FROM jersey_images WHERE jersey_id = ${jerseyId}`;

    for (let i = 0; i < finalS3Urls.length; i++) {
      await sql`
        INSERT INTO jersey_images (jersey_id, url, display_order)
        VALUES (${jerseyId}, ${finalS3Urls[i]}, ${i})
      `;
    }

    console.log(`\n======================================================`);
    console.log(`🎉 SUCCESS! JERSEY IS OFFICIALLY LIVE`);
    console.log(`Product Name : ${name}`);
    console.log(`Price        : Rp ${Number(price).toLocaleString('id-ID')}`);
    console.log(`Gallery      : ${finalS3Urls.length} Angles Synced`);
    console.log(`Product Page : https://prokickstore1.com/product/${jerseyId}`);
    console.log(`======================================================\n`);
  } finally {
    await sql.end();
  }
}

run().catch((err) => {
  console.error('\n❌ Fatal Error:', err);
  process.exit(1);
});
