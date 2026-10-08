# MILESTONE 3: SELF-SERVICE CHECKOUT, MALAYSIAN PAYMENTS & ADMIN DASHBOARD

> **Objective**: Implement the self-checkout flow for Malaysia (English UI, RM currency), DuitNow QR & bank transfer payment options, S3 receipt upload with client compression, automated Telegram admin alerts, and an order fulfillment dashboard.

---

## Action Items

### 1. Malaysian Checkout & Dynamic Payment (`/cart` or `/checkout`)
- [ ] English checkout form:
  - Full Name, WhatsApp Number (+60 format), Street Address, City, 5-digit Postcode.
  - Malaysian State selector (Selangor, WP Kuala Lumpur, Johor, Penang, Perak, Kedah, Melaka, Negeri Sembilan, Pahang, Terengganu, Kelantan, Sabah, Sarawak, WP Labuan, WP Putrajaya, Perlis).
  - Shipping zone calculation: Peninsular Malaysia (RM 8.00) vs East Malaysia (RM 15.00), automatically waived (RM 0.00) if cart has ≥ 2 jerseys.
- [ ] Dynamic Malaysian payment selection: **DuitNow QR** or **Instant Bank Transfer** (Maybank, CIMB Bank, Touch 'n Go eWallet).
- [ ] Server Action `createOrder`:
  - Enforce server-side price recalculation (reject client-tampered totals).
  - Perform atomic inventory reservation per size.

### 2. Invoice & Receipt Slip Upload (`/invoice/[orderId]`)
- [ ] Clean English invoice layout with Order Number, itemized breakdown, and exact total amount in RM.
- [ ] Dynamic payment instructions: DuitNow QR barcode with 1-click amount copy, or Bank Account details.
- [ ] Client-side Canvas receipt compression (resizes high-res phone screenshots to max 1920px, WebP/JPEG 0.82 quality).
- [ ] Direct upload to IDCloudHost S3 (`prokick-store/proofs/`).
- [ ] Order status automatically advances to `PROCESSING`.

### 3. Asynchronous Telegram Admin Notification Dispatcher
- [ ] Non-blocking dispatcher triggered upon successful receipt upload.
- [ ] HTML-formatted Telegram message: Order ID, Customer Name, WhatsApp Link, Delivery State, Item & Customization List, Total RM Paid, and direct photo attachment of payment slip.

### 4. Admin Order Verification & Fulfillment (`/admin/orders`)
- [ ] English admin interface with status filter tabs: *All*, *Awaiting Verification (Processing)*, *Shipped*, *Completed*.
- [ ] High-resolution receipt slip preview modal.
- [ ] One-click action buttons: *Confirm Payment (PAID)* and *Input Tracking Number* (Pos Laju, J&T Express MY, Ninja Van MY).
