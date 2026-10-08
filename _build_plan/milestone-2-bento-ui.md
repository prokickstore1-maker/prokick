# MILESTONE 2: MATCHDAY TERRACE UI & FOOTBALL CUSTOMER EXPERIENCE (ENGLISH UI)

> **Objective**: Build dark matchday-terrace storefront, English UI, RM pricing, league navigation, kit customizer, and promo cart drawer. Visual rules: [`DESIGN.md`](../DESIGN.md); this plan records historical implementation, not current design authority.

---

## Action Items

### 1. Design System (match tokens to `DESIGN.md`)
- [x] Design tokens live in `app/globals.css`.
- [x] Configure typography with Google Fonts `Outfit` (display) and `Inter` (body); `Geist Mono` only for structured data.
- [x] Reusable card primitive at `components/ui/bento-card.tsx` (name kept; styling follows `DESIGN.md`).

### 2. Storefront Homepage (English Copy)
- [x] **Hero**: high-impact football visuals and CTA ("Explore Kits", "New 2026/27 Drops").
- [x] **League navigation**: fast links (Premier League, La Liga, Serie A, Champions League, World Cup, Classic Retro).
- [x] **Trending / Best Seller Grid**: jersey cards with hover zoom, edition tags ("Player Issue", "Fan Edition"), and live size availability badges.
- [x] **Bundle Promo Info**: tiered discounts ("Buy 2 Free Shipping", "Buy 5 Get 1 Free").

### 3. Jersey Detail Page & Interactive Customizer (`/product/[id]`)
- [x] Multi-angle gallery with responsive thumbnails (Front, Back, Crest closeup, Fabric detail).
- [x] Dynamic size selector with live inventory status per size (S, M, L, XL, XXL).
- [x] **Custom Nameset & Sleeve Patch Customizer**:
  - Custom Player Name (uppercase input) & Squad Number (0-99).
  - Sleeve competition patch selector (e.g. "UCL Starball + Foundation", "Premier League Golden Badge").
  - Instant price calculation in RM (`+RM 20.00` Nameset, `+RM 10.00` Patch).

### 4. Cart Drawer & Smart Promo Engine
- [x] Slide-over cart drawer using Zustand state management.
- [x] Real-time dynamic promo progress bar: *"Add 1 more jersey to unlock FREE Shipping nationwide!"*.
- [x] Item breakdown with customization summary, bundle discount calculation, and prominent checkout button (minimum 44x44px touch target).
