# 📋 PROKICK STORE MALAYSIA — MASTER TASK LIST (`task.md`)

> **Project**: ProKick Store (Malaysia Edition)  
> **Interface Language**: English (100% UI & Copy)  
> **Currency**: Malaysian Ringgit (`RM` / `MYR`)  
> **Design Theme**: Matchday terrace (dark stadium, volt accent; see `DESIGN.md`)  
> **Target Market**: Football Fans & Jersey Collectors in Malaysia  
> **Last Updated**: 2026-10-07  
>
> **Audit terbaru**: `bug-audit/AUDIT.md` — SATU file audit (#1-45: #1-20 FIXED, #21-45 OPEN) · UI audit: `anti-slop/fix-report-001-2026-10-07.md`

---

## 📊 Quick Progress Overview

- [x] **Milestone 1**: Foundation, Pure Football Schema & Local DB (5/5) ✅
- [x] **Milestone 2**: Matchday Terrace UI & English Storefront (5/5) ✅
- [x] **Milestone 3**: Malaysian Self-Checkout, DuitNow QR & Admin (5/5) ✅
- [x] **Anti-Slop Audit 001**: 9 temuan diproses (8 fixed, 1 skip opsional) ✅
- [x] **Bug Audit 001**: 20 temuan (7 HIGH, 10 MEDIUM, 3 LOW) semua FIXED ✅
- [ ] **Bug Audit 002**: 25 temuan baru (#21-45, 5 HIGH) — semua OPEN
- [ ] **Milestone 4**: Production Build & Coolify VPS Deployment (0/4)


---

## 🧱 Milestone 1: Foundation, Purge & Malaysian Football Schema

### Task 1.1: Purge Redundant Non-Jersey Code & Artifacts
- [x] Fresh Next.js 16 setup with zero non-jersey legacy bloat (shoes, windbreakers, accessories purged).
- [x] Clean architecture baseline initialized directly for pure football jerseys.

### Task 1.2: Implement Malaysian Football Schema (`db/schema.ts`)
- [x] Applied unified football schema from `_build_plan/blueprints/schema-proposal.ts`:
  - `users`: Admin credentials with bcrypt password hash.
  - `jerseys`: Team, league, season, type (Player Issue/Fan/Retro/Kids), price in MYR, JSON sizes & stock data.
  - `jersey_images`: Multi-angle jersey photo gallery URLs.
  - `orders`: Malaysian shipping zones (`Peninsular Malaysia`, `East Malaysia`), Malaysian phone (+60), courier tracking (`Pos Laju`, `J&T Express MY`, `Ninja Van MY`).
  - `order_items`: Jersey FK, size, quantity, unit price in MYR, custom nameset options, sleeve patch options.
  - `payment_methods`: Types (`duitnow_qr`, `bank_transfer`), labels (`DuitNow QR`, `Maybank`, `CIMB Bank`, `Touch 'n Go eWallet`), account number/DuitNow ID, QR code image URL.
  - `banners`: Storefront hero promotion banners.
  - `testimonials`: Verified buyer reviews and photo proofs.
  - `settings`: Store configuration key-values.
  - Relations & full TypeScript type definitions exported.

### Task 1.3: Drizzle Migrations Setup
- [x] Configured `drizzle.config.ts` targeting `db/schema.ts`.
- [x] Generated fresh migration files:
  ```bash
  npx drizzle-kit generate
  ```
- [x] Verified clean SQL output (`drizzle/0000_glamorous_loa.sql`) with 9 tables, indexes, and foreign keys.

### Task 1.4: Database Connection & Offline Fallback (`lib/db.ts`)
- [x] Implemented resilient PostgreSQL client connection in `lib/db.ts` with connection pooling.
- [x] Added `checkDbConnection()` health check helper.
- [x] Added fallback mock data in `lib/mock-data.ts` to ensure UI prototyping remains functional offline.

### Task 1.5: Malaysian Market Seed Data Script (`scripts/seed.ts`)
- [x] Created `scripts/seed.ts` with popular football jerseys in Malaysia:
  - **Premier League**: Arsenal, Liverpool, Manchester United, Manchester City.
  - **La Liga**: Real Madrid, FC Barcelona.
  - **National Teams**: Harimau Malaya (Malaysia Stadium Edition 2026).
  - **Classic Retro**: Man Utd 1999 Treble, Arsenal 2004 Invincibles.
- [x] Set realistic base prices in MYR (`RM 79.00` – `RM 129.00`).
- [x] Seeded Malaysian payment methods: DuitNow QR, Maybank, CIMB Bank, Touch 'n Go eWallet.
- [x] Verified `npx tsc --noEmit` returns 0 errors.
- [x] Verified `npm run lint` returns 0 errors/warnings.
- [x] Verified `npm run build` succeeds 100%.

---

## Milestone 2: Matchday Terrace UI & English Storefront

> Implemented UI history retained below; current visual source of truth: `DESIGN.md`.

### Task 2.1: Design Tokens & Global Styles (historical implementation)
- [x] Initial dark tokens and card styles added; align any future UI work with `DESIGN.md`.
- [x] Configured Google Fonts in `app/layout.tsx`: `Outfit` (headings/sports display), `Inter` (body/UI), `Geist Mono` (numbers).
- [x] Reusable card primitive retained; visual treatment follows `DESIGN.md`.

### Task 2.2: English Storefront Homepage (`/`)
- [x] Homepage hero with English action copy ("Explore All Kits", "Harimau Malaya Special").
- [x] Bundle promo information ("Buy 2 Free Shipping", "Buy 3 Free Patch", "Buy 5 Get 1 Free").
- [x] League navigation for Premier League, La Liga, Harimau Malaya, Champions League, World Cup, and Classic Retro.
- [x] Trending kits grid with edition badges, size availability, and RM pricing.
- [x] Classic retro section with historic jerseys (Treble 1999, Invincibles 2004).

### Task 2.3: Jersey Detail Page & Interactive Customizer (`/product/[id]`)
- [x] Multi-angle responsive gallery (Front, Back, Badge, Fabric closeup).
- [x] Live size selector (S, M, L, XL, XXL) with per-size stock counter.
- [x] **Custom Nameset & Sleeve Patch Customizer**:
  - Custom Player Name (uppercase input) & Squad Number (0-99).
  - Sleeve competition patch selector (UCL Starball, EPL Golden Badge, La Liga).
  - Real-time price breakdown (+RM 20.00 Nameset, +RM 10.00 Patch).
- [x] Dynamic "Add to Cart" CTA with micro-animation and instant cart drawer open.
- [x] "Complete Your Matchday Collection" related kits recommendations.

### Task 2.4: Cart Drawer & Dynamic Promo Engine
- [x] Persistent slide-over cart drawer using Zustand (`stores/cart.ts`).
- [x] Pure promo engine calculation module (`lib/promo.ts`):
  - Deterministic tiered calculation based on item count.
  - Live animated progress bar: *"Add 1 more jersey to unlock FREE Shipping nationwide!"*.
  - Malaysian shipping zone switcher (Peninsular RM 8 vs East Malaysia RM 15).
  - Breakdown: Subtotal, Customization, Shipping fee, Bundle discounts, and Grand Total in RM.

### Task 2.5: Storefront Navigation & Header / Footer
- [x] Nike-standard clean white navbar (`components/navbar.tsx`) with search pill, shopping bag counter, and mobile-responsive drawer.
- [x] Streamlined announcement ticker with Malaysian logistics and DuitNow QR acceptance.
- [x] Obsidian luxury footer (`components/footer.tsx`) with Malaysian courier links and WhatsApp helpline.

### Task 2.6: World-Class Nike Mobile Overhaul & Studio Kits
- [x] **Mobile Hero Billboard**: Height expanded to 500px on mobile to prevent text clipping; headline `MATCHDAY AUTHENTIC` and capsule buttons fit without awkward wrapping.
- [x] **Nike 2-Column Mobile Product Grid**: Transformed single-column mobile view into compact athletic 2-column grid (`grid-cols-2 gap-3 sm:gap-6`).
- [x] **Clean Studio Kit Assets**: Replaced broken Unsplash stock photos with high-resolution isolated studio kit photography (Real Madrid, Arsenal, Liverpool, Harimau Malaya, Barcelona, Man City, Man Utd 1999 Treble) saved in `public/images/`.
- [x] **Responsive Touch Carousels**: Swipeable Featured Collections carousel for mobile touch screens.
- [x] Build and type-checking verified 100% passing (`npx tsc --noEmit` & `npm run build` = 0 errors).

---

## Milestone 3: Malaysian Self-Checkout, DuitNow QR & Admin

### Task 3.1: Malaysian Checkout Flow (`/cart`)
- [x] English checkout form (`app/cart/page.tsx`):
  - Recipient Name, Active WhatsApp Mobile (+60 format), Street Address, City, 5-digit Postcode.
  - Malaysian State selector (13 States + 3 Federal Territories: Selangor, KL, Johor, Penang, Sabah, Sarawak, etc.).
  - Automatic shipping zone calculation (Peninsular RM 8.00 vs East Malaysia RM 15.00; automatically waived to RM 0.00 if cart has ≥ 2 jerseys).
- [x] Dynamic Malaysian payment options: DuitNow QR, Maybank Instant Transfer, CIMB Bank Instant Transfer.
- [x] Server Action `createOrderAction` (`app/actions/order.ts`):
  - Server-side authoritative price verification using database records (reject client tampering).
  - Generates unique order number (e.g. `PK-20260923-8491`).
  - Redirects customer to `/invoice/[orderId]`.

### Task 3.2: Malaysian Invoice Page & S3 Slip Upload (`/invoice/[orderId]`)
- [x] English invoice interface (`app/invoice/[orderId]/page.tsx` & `components/order/invoice-view.tsx`):
  - Order Number & status badge (`Awaiting Payment` / `Processing` / `Shipped` / `Completed`).
  - Itemized order breakdown with nameset and sleeve patch details.
  - Total payment amount in RM with 1-click "Copy Amount" button.
- [x] Dynamic payment instructions:
  - DuitNow QR: Displays high-res QR barcode with scanning instructions.
  - Online Banking: Maybank and CIMB account number with 1-click copy.
- [x] Client-side receipt compression using HTML5 Canvas API (max 1920px, WebP/JPEG 0.82 quality) before upload.
- [x] Direct upload to S3 (`lib/s3.ts`) and automatic status transition to `PROCESSING`.

### Task 3.3: Telegram Admin Notification Dispatcher
- [x] Non-blocking asynchronous dispatcher (`lib/telegram.ts`):
  - Triggers automatically upon payment slip upload.
  - Clean HTML message sent to Admin Telegram Bot: Order Number, Customer Name, WhatsApp direct link, State & Address, Items & Customization breakdown, Total RM Paid, and receipt photo attachment.

### Task 3.4: Admin Dashboard & Order Fulfillment (`/admin/orders`)
- [x] English admin interface (`app/admin/orders/page.tsx` & `components/admin/orders-table.tsx`):
  - Filter tabs: *All Orders*, *Processing (Receipt Uploaded)*, *Shipped (Tracking Added)*, *Completed*.
  - Zoomable payment receipt modal viewer.
  - Action buttons: "Confirm Paid" and "Add Tracking".
  - Modal courier tracking assignment supporting *Pos Laju*, *J&T Express Malaysia*, *Ninja Van Malaysia*, *DHL eCommerce*.
  - Automated status progression to `SHIPPED`.

### Task 3.5: Admin Jersey Inventory & Stock Manager (`/admin/jerseys`)
- [x] Admin inventory interface (`app/admin/jerseys/page.tsx` & `components/admin/jersey-stock-table.tsx`):
  - Thumbnail, name, league, team, type, and price in RM.
  - Per-size stock breakdown (`S`, `M`, `L`, `XL`, `XXL`).
  - Quick inline stock increment / decrement buttons (`+1` / `-1`) via `updateJerseyStockAction`.
  - Filter search bar across teams and competitions.

---

## 🚀 Milestone 4: Production Build & Coolify VPS Deployment

### Task 4.1: Codebase Build Audit & Type Checking
- [ ] Run `npx tsc --noEmit` and confirm 0 errors.
- [ ] Run `npm run build` and verify Next.js 16 standalone bundle is successfully generated.
- [ ] Verify static assets are copied to standalone directory.

### Task 4.2: Coolify VPS Environment Setup
- [ ] Verify Docker container configuration on Coolify VPS (`103.193.178.112`).
- [ ] Ensure internal network link between application container and PostgreSQL database container.
- [ ] Configure environment variables in Coolify Dashboard:
  - `DATABASE_URL`
  - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
  - `NEXTAUTH_SECRET` / Admin session secrets

### Task 4.3: Database Push on Coolify
- [ ] Synchronize clean football schema to Coolify PostgreSQL:
  ```bash
  npx drizzle-kit push
  ```
- [ ] Run seed script on production database to initialize default payment methods, admin user, and launch jersey catalog.

### Task 4.4: Live End-to-End Smoke Test
- [ ] Verify domain DNS and SSL certificate via Traefik proxy.
- [ ] Complete live test order in English UI:
  1. Add 2 jerseys to cart -> Verify **FREE Shipping** (RM 0.00) rule triggers.
  2. Complete checkout with Malaysian test address (e.g. Kuala Lumpur, 50450).
  3. View Invoice page with DuitNow QR code and RM total.
  4. Upload test payment slip with Canvas compression.
  5. Check instant Telegram bot alert received with slip image.
  6. Login to `/admin`, inspect slip, confirm payment, and attach test Pos Laju tracking code.
