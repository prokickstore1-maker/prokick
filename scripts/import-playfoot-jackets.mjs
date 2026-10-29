/**
 * Batch Importer Jaket dari Shopify play-foot.fr ke ProKick Store S3 & DB
 * Khusus jaket dengan latar belakang kawat jaring besi (black wire mesh studio).
 * 
 * Penggunaan:
 *   node scripts/import-playfoot-jackets.mjs [--limit 159] [--price 200000]
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

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

const TEAMS_DB = [
  { keywords: ['arsenal', 'ars'], team: 'Arsenal', league: 'Premier League', country: 'England', category: 'Klub' },
  { keywords: ['real madrid', 'madrid', 'rma'], team: 'Real Madrid', league: 'La Liga', country: 'Spain', category: 'Klub' },
  { keywords: ['barcelona', 'barca', 'fcb'], team: 'Barcelona', league: 'La Liga', country: 'Spain', category: 'Klub' },
  { keywords: ['atletico madrid', 'atletico'], team: 'Atletico Madrid', league: 'La Liga', country: 'Spain', category: 'Klub' },
  { keywords: ['manchester united', 'man utd', 'mufc', 'manu'], team: 'Manchester United', league: 'Premier League', country: 'England', category: 'Klub' },
  { keywords: ['manchester city', 'man city', 'mcfc'], team: 'Manchester City', league: 'Premier League', country: 'England', category: 'Klub' },
  { keywords: ['liverpool', 'lfc'], team: 'Liverpool', league: 'Premier League', country: 'England', category: 'Klub' },
  { keywords: ['chelsea', 'cfc'], team: 'Chelsea', league: 'Premier League', country: 'England', category: 'Klub' },
  { keywords: ['tottenham', 'spurs', 'thfc'], team: 'Tottenham', league: 'Premier League', country: 'England', category: 'Klub' },
  { keywords: ['bayern', 'bayern munich', 'munchen'], team: 'Bayern Munich', league: 'Bundesliga', country: 'Germany', category: 'Klub' },
  { keywords: ['dortmund', 'bvb'], team: 'Borussia Dortmund', league: 'Bundesliga', country: 'Germany', category: 'Klub' },
  { keywords: ['juventus', 'juve'], team: 'Juventus', league: 'Serie A', country: 'Italy', category: 'Klub' },
  { keywords: ['ac milan', 'milan', 'acm'], team: 'AC Milan', league: 'Serie A', country: 'Italy', category: 'Klub' },
  { keywords: ['inter miami', 'miami'], team: 'Inter Miami', league: 'MLS', country: 'United States', category: 'Klub' },
  { keywords: ['inter milan', 'inter'], team: 'Inter Milan', league: 'Serie A', country: 'Italy', category: 'Klub' },
  { keywords: ['as roma', 'roma'], team: 'AS Roma', league: 'Serie A', country: 'Italy', category: 'Klub' },
  { keywords: ['napoli', 'naples'], team: 'Napoli', league: 'Serie A', country: 'Italy', category: 'Klub' },
  { keywords: ['psg', 'paris'], team: 'Paris Saint-Germain', league: 'Ligue 1', country: 'France', category: 'Klub' },
  { keywords: ['marseille', 'om'], team: 'Marseille', league: 'Ligue 1', country: 'France', category: 'Klub' },
  { keywords: ['lyon', 'ol'], team: 'Lyon', league: 'Ligue 1', country: 'France', category: 'Klub' },
  { keywords: ['ajax'], team: 'Ajax', league: 'Other Clubs', country: 'Netherlands', category: 'Klub' },
  { keywords: ['flamengo'], team: 'Flamengo', league: 'Brasileirao', country: 'Brazil', category: 'Klub' },
  { keywords: ['corinthians'], team: 'Corinthians', league: 'Brasileirao', country: 'Brazil', category: 'Klub' },
  { keywords: ['palmeiras'], team: 'Palmeiras', league: 'Brasileirao', country: 'Brazil', category: 'Klub' },
  { keywords: ['sao paulo'], team: 'Sao Paulo', league: 'Brasileirao', country: 'Brazil', category: 'Klub' },
  { keywords: ['fluminense', 'fluminese'], team: 'Fluminense', league: 'Brasileirao', country: 'Brazil', category: 'Klub' },
  { keywords: ['cruzeiro'], team: 'Cruzeiro', league: 'Brasileirao', country: 'Brazil', category: 'Klub' },
  { keywords: ['kawasaki'], team: 'Kawasaki Frontale', league: 'Other Clubs', country: 'Japan', category: 'Klub' },
  { keywords: ['boca juniors', 'boca'], team: 'Boca Juniors', league: 'Other Clubs', country: 'Argentina', category: 'Klub' },
  { keywords: ['river plate', 'river'], team: 'River Plate', league: 'Other Clubs', country: 'Argentina', category: 'Klub' },
  { keywords: ['al nassr', 'nassr'], team: 'Al Nassr', league: 'Saudi Pro League', country: 'Saudi Arabia', category: 'Klub' },
  { keywords: ['al hilal', 'hilal'], team: 'Al Hilal', league: 'Saudi Pro League', country: 'Saudi Arabia', category: 'Klub' },
  { keywords: ['indonesia', 'timnas'], team: 'Indonesia', league: 'Nation', country: 'Indonesia', category: 'Tim Nasional' },
  { keywords: ['argentina', 'argentine'], team: 'Argentina', league: 'Nation', country: 'Argentina', category: 'Tim Nasional' },
  { keywords: ['brazil', 'brasil', 'bresil'], team: 'Brazil', league: 'Nation', country: 'Brazil', category: 'Tim Nasional' },
  { keywords: ['japan', 'jepang', 'japon'], team: 'Japan', league: 'Nation', country: 'Japan', category: 'Tim Nasional' },
  { keywords: ['germany', 'jerman', 'allemagne'], team: 'Germany', league: 'Nation', country: 'Germany', category: 'Tim Nasional' },
  { keywords: ['portugal'], team: 'Portugal', league: 'Nation', country: 'Portugal', category: 'Tim Nasional' },
  { keywords: ['england', 'inggris', 'angleterre'], team: 'England', league: 'Nation', country: 'England', category: 'Tim Nasional' },
  { keywords: ['france', 'prancis'], team: 'France', league: 'Nation', country: 'France', category: 'Tim Nasional' },
  { keywords: ['spain', 'spanyol', 'espagne'], team: 'Spain', league: 'Nation', country: 'Spain', category: 'Tim Nasional' },
  { keywords: ['italy', 'italia', 'italie'], team: 'Italy', league: 'Nation', country: 'Italy', category: 'Tim Nasional' },
  { keywords: ['netherlands', 'belanda', 'holland', 'pays-bas'], team: 'Netherlands', league: 'Nation', country: 'Netherlands', category: 'Tim Nasional' },
  { keywords: ['mexico', 'meksiko', 'mexique'], team: 'Mexico', league: 'Nation', country: 'Mexico', category: 'Tim Nasional' },
  { keywords: ['morocco', 'maroko', 'maroc'], team: 'Morocco', league: 'Nation', country: 'Morocco', category: 'Tim Nasional' },
  { keywords: ['algeria', 'aljazair', 'algerie'], team: 'Algeria', league: 'Nation', country: 'Algeria', category: 'Tim Nasional' },
  { keywords: ['cameroon', 'kamerun', 'cameroun'], team: 'Cameroon', league: 'Nation', country: 'Cameroon', category: 'Tim Nasional' },
  { keywords: ['croatia', 'kroasia', 'croatie'], team: 'Croatia', league: 'Nation', country: 'Croatia', category: 'Tim Nasional' },
  { keywords: ['belgium', 'belgique', 'belgia'], team: 'Belgium', league: 'Nation', country: 'Belgium', category: 'Tim Nasional' },
  { keywords: ['ivory coast', 'cote d\'ivoire', 'cote d ivoire'], team: 'Ivory Coast', league: 'Nation', country: 'Ivory Coast', category: 'Tim Nasional' },
  { keywords: ['jamaica', 'jamaique'], team: 'Jamaica', league: 'Nation', country: 'Jamaica', category: 'Tim Nasional' },
  { keywords: ['senegal'], team: 'Senegal', league: 'Nation', country: 'Senegal', category: 'Tim Nasional' },
  { keywords: ['nigeria'], team: 'Nigeria', league: 'Nation', country: 'Nigeria', category: 'Tim Nasional' },
  { keywords: ['colombia', 'colombie'], team: 'Colombia', league: 'Nation', country: 'Colombia', category: 'Tim Nasional' },
  { keywords: ['uruguay'], team: 'Uruguay', league: 'Nation', country: 'Uruguay', category: 'Tim Nasional' },
  { keywords: ['jordan'], team: 'Jordan Sportswear', league: 'Special Edition', country: 'Global', category: 'Klub' },
  { keywords: ['nike'], team: 'Nike Sportswear', league: 'Special Edition', country: 'Global', category: 'Klub' },
  { keywords: ['adidas'], team: 'Adidas Originals', league: 'Special Edition', country: 'Global', category: 'Klub' },
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function detectMetadata(title, handle) {
  const combined = `${title} ${handle}`.toLowerCase();

  // 1. Subjenis Jaket (kitType)
  let kitType = 'Jaket';
  if (combined.includes('tracksuit') || combined.includes('track-suit') || combined.includes('survetement')) {
    kitType = 'Tracksuit';
  } else if (combined.includes('windbreaker') || combined.includes('coupe-vent') || combined.includes('coupe vent')) {
    kitType = 'Windbreaker';
  } else {
    kitType = 'Jaket';
  }

  // 2. Musim
  let season = '2024/2025';
  const seasonMatch = combined.match(/(19\d{2}|20\d{2})[\/\-_]?(19\d{2}|20\d{2}|\d{2})/);
  if (seasonMatch) {
    const startYear = seasonMatch[1];
    let endYear = seasonMatch[2];
    if (endYear.length === 2) {
      endYear = startYear.slice(0, 2) + endYear;
    }
    season = `${startYear}/${endYear}`;
  }

  // 3. Tim, Liga, Negara, Kategori
  let team = 'Football Club';
  let league = 'Other Clubs';
  let country = 'Global';
  let category = 'Klub';

  for (const t of TEAMS_DB) {
    const match = t.keywords.some(kw => {
      if (kw.length <= 4) {
        const reg = new RegExp(`\\b${kw}\\b`, 'i');
        return reg.test(combined);
      }
      return combined.includes(kw);
    });
    if (match) {
      team = t.team;
      league = t.league;
      country = t.country;
      category = t.category;
      break;
    }
  }

  // 4. Deteksi warna/detail khusus
  const colorMap = {
    noir: 'Black', black: 'Black',
    blanc: 'White', white: 'White',
    bleu: 'Blue', blue: 'Blue',
    vert: 'Green', green: 'Green',
    rouge: 'Red', red: 'Red',
    jaune: 'Yellow', yellow: 'Yellow',
    marine: 'Navy', navy: 'Navy',
    violet: 'Purple', purple: 'Purple', mauve: 'Purple',
    rose: 'Pink', pink: 'Pink',
    gris: 'Grey', grey: 'Grey', gray: 'Grey',
    beige: 'Beige', cream: 'Cream', creme: 'Cream',
    kaki: 'Khaki', khaki: 'Khaki',
    orange: 'Orange',
    dore: 'Gold', gold: 'Gold',
    reversible: 'Reversible'
  };

  const colors = [];
  for (const [kw, en] of Object.entries(colorMap)) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(combined) && !colors.includes(en)) {
      colors.push(en);
    }
  }

  const colorDetail = colors.slice(0, 2).join(' ');

  return {
    team,
    league,
    country,
    category,
    kitType,
    season,
    colorDetail
  };
}

async function uploadProductToS3AndDB(product, uniqueName, options, s3, sql) {
  const { endpoint, bucket, price } = options;
  const meta = detectMetadata(product.title, product.handle);
  const slug = `${slugify(uniqueName)}-${product.id}`;

  console.log(`\n======================================================`);
  console.log(`📦 Memproses Jaket: ${uniqueName}`);
  console.log(`   Tim: ${meta.team} | Kategori: ${meta.category} | Jenis: ${meta.kitType}`);
  console.log(`   Harga: Rp ${Number(price).toLocaleString('id-ID')}`);

  // Filter out non-product images (e.g. IMG_1779 size chart banner)
  const validImages = product.images.filter(img => !img.src.includes('IMG_1779'));
  const imagesToUpload = validImages.slice(0, 6);
  console.log(`   Foto Supplier: ${imagesToUpload.length} sudut (dari ${product.images.length} foto)`);

  const finalS3Urls = [];

  for (let i = 0; i < imagesToUpload.length; i++) {
    const imgObj = imagesToUpload[i];
    const rawUrl = imgObj.src.split('?')[0];
    try {
      const resp = await fetch(rawUrl);
      if (!resp.ok) continue;
      const buf = Buffer.from(await resp.arrayBuffer());
      const s3Key = `products/jaket-${slug}-angle-${i + 1}.jpg`;

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
      process.stdout.write(`✓ [Angle ${i + 1}] `);
    } catch (e) {
      console.warn(`\n  ⚠️ Gagal upload foto ${i + 1}: ${e.message}`);
    }
  }

  if (finalS3Urls.length === 0) {
    console.error(`\n❌ Gagal memproses ${uniqueName}: tidak ada foto yang berhasil diupload.`);
    return false;
  }

  const stockData = { S: 10, M: 15, L: 20, XL: 15, XXL: 10 };
  const totalStock = Object.values(stockData).reduce((a, b) => a + b, 0);
  const primaryImage = finalS3Urls[0];
  const description = `${meta.kitType} ${meta.team} musim ${meta.season}. Material luar premium yang tahan angin dan nyaman dipakai untuk aktivitas harian maupun olahraga, lengkap dengan detail crest bordir presisi.`;
  const productTag = `Jaket, PlayFoot, shopify_${product.id}`;

  // Upsert ke PostgreSQL berdasarkan shopify_${product.id} atau nama
  const existing = await sql`
    SELECT id FROM jerseys 
    WHERE product_line = 'Jaket' AND (
      tags LIKE ${'%shopify_' + product.id + '%'} OR name ILIKE ${uniqueName}
    )
    LIMIT 1
  `;

  let jacketId;
  if (existing.length > 0) {
    jacketId = existing[0].id;
    await sql`
      UPDATE jerseys
      SET name = ${uniqueName},
          team = ${meta.team},
          league = ${meta.league},
          season = ${meta.season},
          type = 'Jaket',
          category = ${meta.category},
          country = ${meta.country},
          edition = 'Current',
          kit_type = ${meta.kitType},
          price = ${price},
          description = ${description},
          image = ${primaryImage},
          sizes = ${JSON.stringify(Object.keys(stockData))},
          stock_data = ${JSON.stringify(stockData)},
          stock = ${totalStock},
          tags = ${productTag},
          updated_at = NOW()
      WHERE id = ${jacketId}
    `;
    console.log(`\n🔄 Update database berhasil (ID: ${jacketId})`);
  } else {
    const inserted = await sql`
      INSERT INTO jerseys (
        product_line, name, team, league, season, type, category, country, edition, kit_type,
        price, description, image, sizes, stock_data, stock, tags
      ) VALUES (
        'Jaket', ${uniqueName}, ${meta.team}, ${meta.league}, ${meta.season}, 'Jaket', ${meta.category}, ${meta.country}, 'Current', ${meta.kitType},
        ${price}, ${description}, ${primaryImage},
        ${JSON.stringify(Object.keys(stockData))}, ${JSON.stringify(stockData)}, ${totalStock}, ${productTag}
      ) RETURNING id
    `;
    jacketId = inserted[0].id;
    console.log(`\n✨ Insert jaket baru ke database berhasil (ID: ${jacketId})`);
  }

  // Multi-angle gallery images
  await sql`DELETE FROM jersey_images WHERE jersey_id = ${jacketId}`;
  for (let i = 0; i < finalS3Urls.length; i++) {
    await sql`
      INSERT INTO jersey_images (jersey_id, url, display_order)
      VALUES (${jacketId}, ${finalS3Urls[i]}, ${i})
    `;
  }

  return true;
}

async function main() {
  const args = parseArgs();
  const limit = args.limit ? parseInt(args.limit, 10) : 999;
  const price = args.price ? String(args.price) : '200000.00';

  console.log('======================================================');
  console.log('🚀 PROKICK STORE AUTOMATED PLAY-FOOT JACKET IMPORTER');
  console.log('STANDARD: Background Kawat Jaring Besi Studio (Wire Mesh)');
  console.log(`Harga Tetap  : Rp ${Number(price).toLocaleString('id-ID')}`);
  console.log('======================================================\n');

  // Load curated mesh product IDs
  if (!fs.existsSync('scratch/mesh_products.json')) {
    console.error('File scratch/mesh_products.json tidak ditemukan. Jalankan scanner terlebih dahulu.');
    process.exit(1);
  }
  const meshData = JSON.parse(fs.readFileSync('scratch/mesh_products.json', 'utf8'));
  const meshIdsSet = new Set(meshData.meshProductIds.map(p => String(p.id)));
  console.log(`Loaded ${meshIdsSet.size} produk tervalidasi berlatar kawat jaring besi.`);

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

  const sql = postgres(process.env.DATABASE_URL);

  try {
    // Ambil produk halaman 1 dan 2 dari Play-Foot
    console.log('Mengambil katalog lengkap dari Play-Foot...');
    const res1 = await fetch('https://play-foot.fr/en/collections/vestes-jackets/products.json?limit=250&page=1');
    const d1 = await res1.json();
    const res2 = await fetch('https://play-foot.fr/en/collections/vestes-jackets/products.json?limit=250&page=2');
    const d2 = await res2.json();
    const all = [...(d1.products || []), ...(d2.products || [])];

    // Filter produk yang ada di daftar background kawat jaring besi
    const curatedProducts = all.filter(p => meshIdsSet.has(String(p.id))).slice(0, limit);
    console.log(`Total produk siap diunggah: ${curatedProducts.length} jaket.\n`);

    // Pre-calculate unique names to avoid collisions
    const counts = {};
    const productNames = [];
    for (const p of curatedProducts) {
      const meta = detectMetadata(p.title, p.handle);
      const baseName = meta.colorDetail 
        ? `${meta.team} ${meta.kitType} ${meta.colorDetail} ${meta.season}`
        : `${meta.team} ${meta.kitType} ${meta.season}`;
      
      counts[baseName] = (counts[baseName] || 0) + 1;
      const uniqueName = counts[baseName] > 1 ? `${baseName} (Ver. ${counts[baseName]})` : baseName;
      productNames.push(uniqueName);
    }

    let successCount = 0;
    for (let idx = 0; idx < curatedProducts.length; idx++) {
      const prod = curatedProducts[idx];
      const name = productNames[idx];
      console.log(`\n[${idx + 1}/${curatedProducts.length}] (${Math.round(((idx + 1) / curatedProducts.length) * 100)}%)`);
      const ok = await uploadProductToS3AndDB(prod, name, { endpoint, bucket, price }, s3, sql);
      if (ok) successCount++;
    }

    console.log(`\n======================================================`);
    console.log(`🎉 SELESAI PENUH! ${successCount} dari ${curatedProducts.length} jaket background jaring berhasil diunggah.`);
    console.log(`======================================================`);
  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    await sql.end();
  }
}

main();
