# Store Operations Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete store operations in phases: product administration, checkout inventory integrity, authentication and order tracking, legal pages, and verification.

**Architecture:** Extend existing App Router server actions and Drizzle schema patterns. Keep admin mutations behind `isAdmin()`, keep customer access behind signed order capability cookies, and validate all prices, stock, uploads, and transitions server-side. Deliver each phase independently.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM, PostgreSQL, Zustand, existing S3 and Telegram integrations.

## Global Constraints

- Preserve existing palette, Rubik/Nunito Sans typography, and mobile-first layout.
- No decorative emoji in UI, copy, docs, or operational logs.
- No hardcoded secrets; use environment variables and reject weak defaults.
- All server mutations require authorization and input validation.
- Write a failing test before each non-trivial production change.
- Run `npm run build` after each phase; PostgreSQL warning is acceptable only when build otherwise passes.

---

## Task 1: Product Administration

**Files:**
- Create: `app/admin/products/page.tsx`
- Create: `components/admin/product-manager.tsx`
- Create: `app/actions/products.ts`
- Modify: `app/admin/layout.tsx`
- Modify: `lib/data.ts`
- Test: `tests/products.test.ts`

**Interfaces:**
- Produces `createProductAction(input)`, `updateProductAction(id, input)`, `deleteProductAction(id)`.
- Product input includes `name`, `team`, `league`, `season`, `type`, `category`, `price`, `description`, `image`, `sizes`, and flags.

- [ ] Write failing tests for admin-only create, update, delete, and invalid price/size rejection.
- [ ] Run `npm test -- tests/products.test.ts`; confirm authorization/validation failures.
- [ ] Implement server actions with `isAdmin()`, numeric price validation, non-empty taxonomy fields, parsed size arrays, and safe image URL validation.
- [ ] Implement admin product list with search, create/edit form, delete confirmation, and empty/error states.
- [ ] Add Products navigation link at `/admin/products`.
- [ ] Run tests and `npm run build`.

## Task 2: Taxonomy and Media Controls

**Files:**
- Modify: `components/admin/product-manager.tsx`
- Modify: `app/actions/products.ts`
- Modify: `app/admin/settings/page.tsx`
- Test: `tests/taxonomy.test.ts`

**Interfaces:**
- Produces taxonomy controls for category, league, season, and type using values already present in product data.

- [ ] Write failing tests for taxonomy normalization and rejection of unknown values.
- [ ] Implement controlled selects and server-side allowlists derived from current catalog values.
- [ ] Add product image URL field with HTTPS and trusted-host validation.
- [ ] Add banner add/delete/order controls while preserving existing banner update flow.
- [ ] Add payment active toggle and persist it through settings action.
- [ ] Run tests and `npm run build`.

## Task 3: Checkout Stock Integrity

**Files:**
- Modify: `app/actions/order.ts`
- Modify: `lib/orders-store.ts`
- Modify: `lib/data.ts`
- Test: `tests/checkout-stock.test.ts`

**Interfaces:**
- Produces `validateAndReserveStock(items)` and releases no stock after failed order creation.

- [ ] Write failing tests for insufficient size stock, invalid size, quantity over stock, and duplicate submission key.
- [ ] Implement server-side stock checks against DB rows and mock fallback.
- [ ] Use a transaction for stock decrement plus order insert when PostgreSQL is online.
- [ ] Reject duplicate checkout requests with an idempotency key stored with the order flow.
- [ ] Keep optimistic UI only after server success, not before stock confirmation.
- [ ] Run tests and `npm run build`.

## Task 4: Admin Authentication and Logout

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/actions/admin-auth.ts`
- Modify: `lib/admin-auth.ts`
- Modify: `app/admin/layout.tsx`
- Test: `tests/admin-auth.test.ts`

**Interfaces:**
- Produces `loginAdminAction(email, password)` and `logoutAdminAction()`.

- [ ] Write failing tests for valid login, invalid password, expired/invalid token, and logout.
- [ ] Replace static admin token with a signed expiring session containing admin identity.
- [ ] Add login page with validation and visible error state.
- [ ] Add logout control to admin navigation.
- [ ] Preserve server-side route and action authorization checks.
- [ ] Run tests and `npm run build`.

## Task 5: Customer Order Tracking

**Files:**
- Create: `app/track-order/page.tsx`
- Create: `components/order/order-tracker.tsx`
- Create: `app/actions/tracking.ts`
- Modify: `components/footer.tsx`
- Test: `tests/order-tracking.test.ts`

**Interfaces:**
- Produces `trackOrderAction(orderNumber, phone)` returning only non-sensitive status data after exact phone verification.

- [ ] Write failing tests for valid order/phone, wrong phone, nonexistent order, and status mapping.
- [ ] Implement exact normalized phone comparison server-side.
- [ ] Return status, tracking number, created date, and next customer action, excluding address/payment data.
- [ ] Build mobile form with loading, error, empty, and success states.
- [ ] Point footer Track Order to `/track-order`.
- [ ] Run tests and `npm run build`.

## Task 6: Legal and Checkout Trust Pages

**Files:**
- Create: `app/terms/page.tsx`
- Create: `app/privacy/page.tsx`
- Modify: `components/footer.tsx`
- Modify: `app/cart/page.tsx`
- Test: `tests/legal-links.test.ts`

- [ ] Write failing tests that verify footer links resolve to `/terms` and `/privacy`.
- [ ] Implement concise product-specific Terms of Sale and Privacy Policy without fabricated certifications or claims.
- [ ] Replace footer placeholder links.
- [ ] Add checkout links and plain-language receipt/privacy notice.
- [ ] Run tests and `npm run build`.

## Task 7: Verification and Mobile QA

**Files:**
- Modify: affected files only after findings.
- Test: `tests/e2e/critical-flows.test.ts`

- [ ] Add E2E coverage for admin login, product edit, stock validation, checkout validation, invoice access, receipt upload authorization, and order tracking.
- [ ] Run the app at 390px and desktop width; verify no horizontal overflow.
- [ ] Click every new admin/customer control and record destination or state change.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Run security scan and fix high/medium findings before delivery.
