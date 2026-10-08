# 🧱 MILESTONE 1: FOUNDATION, FOOTBALL SCHEMA & LOCAL DATABASE SETUP

> **Objective**: Clean redundant non-jersey code, establish the single pure-football schema with Malaysian localization (MYR pricing & shipping zones), and ensure the local dev database is operational.

---

## Action Items

### 1. Purge Non-Jersey Modules (Shoes, Windbreakers, Accessories)
- [ ] Remove non-jersey tables from `db/schema.ts` (`shoes`, `windbreakers`, `accessories`, `shoe_images`, `windbreaker_images`, `accessory_images`).
- [ ] Delete unused server actions (`app/actions/shoes.ts`, `app/actions/windbreakers.ts`, `app/actions/accessories.ts`).
- [ ] Remove obsolete admin views (`app/admin/shoes/`, `app/admin/windbreakers/`, `app/admin/accessories/`).
- [ ] Remove deprecated catalog routes (`app/sepatu/`, `app/windbreaker/`, `app/lainnya/`).

### 2. Standardize Single Football Schema & Malaysian Localization
- [ ] Apply the unified schema from `_build_plan/blueprints/schema-proposal.ts`.
- [ ] Configure Malaysian payment methods (DuitNow QR, Maybank, CIMB, Touch 'n Go eWallet).
- [ ] Configure Malaysian shipping zones: `Peninsular Malaysia` (Semenanjung) & `East Malaysia` (Sabah & Sarawak).
- [ ] Generate fresh Drizzle migrations:
  ```bash
  npx drizzle-kit generate
  ```

### 3. Local Database Fallback & Malaysian Market Seed Data
- [ ] Configure database connection in `lib/db.ts` with graceful fallback for offline dev/build execution.
- [ ] Build seed script (`scripts/seed.ts`) populating high-demand kits in Malaysia (priced in MYR):
  - Premier League: Manchester United, Arsenal, Liverpool, Manchester City, Chelsea.
  - La Liga: Real Madrid, Barcelona.
  - National Teams: Harimau Malaya (Malaysia Special Edition), World Cup & Euro Champions.
  - Classic Retro: 1998/1999 Treble, 2004 Arsenal Invincibles, 1998 France/Brazil.

### 4. Milestone 1 Acceptance Criteria
- `npx tsc --noEmit` passes with 0 errors.
- `npm run dev` boots successfully and queries local jersey seed data without database connection crash.
