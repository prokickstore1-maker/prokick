# 🚀 MILESTONE 4: COOLIFY VPS DEPLOYMENT & PRODUCTION SMOKE TEST

> **Objective**: Validate Next.js 16 standalone production build, deploy to Coolify VPS, configure domain & SSL, and perform an end-to-end live checkout smoke test.

---

## Action Items

### 1. Build Verification & Standalone Assets
- [ ] Ensure `npm run build` succeeds with 0 TypeScript errors and 0 ESLint warnings.
- [ ] Verify standalone asset copying script for Next.js output files.
- [ ] Audit Google Lighthouse Performance (Target ≥ 90 on mobile & desktop).

### 2. Coolify VPS Production Deployment
- [ ] Ensure the Coolify application container links to the PostgreSQL database container via internal Docker network.
- [ ] Configure environment variables in Coolify (`DATABASE_URL`, `S3_*`, `TELEGRAM_*`).
- [ ] Synchronize database schema via Drizzle:
  ```bash
  npx drizzle-kit push
  ```

### 3. Domain, SSL & Live Smoke Test
- [ ] Configure Cloudflare DNS pointing to VPS IP (`103.193.178.112`).
- [ ] Automated Let's Encrypt SSL certificate generation via Coolify Traefik proxy.
- [ ] Live end-to-end smoke test in English:
  - Place a test order for 2 jerseys (verify FREE Shipping RM 0.00 rule).
  - Test DuitNow QR / Bank Transfer invoice view.
  - Upload test receipt slip with Canvas compression.
  - Verify Telegram alert arrives with receipt image in < 3s.
  - Verify admin dashboard can mark order as PAID and attach a courier tracking number.
