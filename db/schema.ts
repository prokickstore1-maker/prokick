import { relations } from "drizzle-orm";
import { text, integer, pgTable, numeric, boolean, timestamp, uuid, index } from "drizzle-orm/pg-core";

// 1. Admin Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").default("ADMIN").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// 2. Dynamic Payment Methods (Malaysian Bank Transfer & Instant QR Pay)
export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // 'qr_pay' or 'bank_transfer'
  label: text("label").notNull(), // "Instant QR Pay", "Maybank", "CIMB Bank", "Touch 'n Go eWallet"
  accountName: text("account_name"),
  accountNumber: text("account_number"),
  qrImageUrl: text("qr_image_url"), // S3 image URL for QR barcode
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// 3. Pure Football Jerseys
export const jerseys = pgTable("jerseys", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g. "Real Madrid Home 2026/27 Player Issue", "Harimau Malaya Special Edition"
  team: text("team").notNull(), // e.g. "Real Madrid", "Arsenal", "Malaysia"
  league: text("league").notNull(), // "Premier League", "La Liga", "Serie A", "World Cup", "Retro Classic"
  season: text("season").notNull(), // "2026/2027", "1998/1999"
  type: text("type").notNull(), // "Player Issue", "Fans Version", "Retro", "Kids"
  category: text("category").default("Klub").notNull(), // "Klub" | "Tim Nasional"
  country: text("country").default("England").notNull(),
  edition: text("edition").default("Current").notNull(), // "Current" | "Vintage"
  kitType: text("kit_type").default("Home").notNull(), // "Home" | "Away" | "Third" | "Training"
  price: numeric("price", { precision: 12, scale: 2 }).notNull(), // Base price in MYR
  description: text("description"),
  image: text("image"), // Primary Image URL
  sizes: text("sizes").notNull(), // JSON string array: ["S", "M", "L", "XL", "XXL"]
  stockData: text("stock_data").default("{}").notNull(), // JSON string: {"S": 5, "M": 10, "L": 8}
  stock: integer("stock").default(0).notNull(),
  tags: text("tags").default("").notNull(), // e.g. "home, jersey, vintage, ucl, epl"
  isBestSeller: boolean("is_best_seller").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isNew: boolean("is_new").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  index("jerseys_league_idx").on(table.league),
  index("jerseys_team_idx").on(table.team),
  index("jerseys_type_idx").on(table.type),
]);

// 4. Multi-angle Jersey Images
export const jerseyImages = pgTable("jersey_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  jerseyId: uuid("jersey_id").references(() => jerseys.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Customer Orders
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(), // e.g. "PK-20260922-8491"
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(), // Malaysian WhatsApp contact (+60...)
  customerAddress: text("customer_address").notNull(), // Street, City, State, Postcode
  shippingZone: text("shipping_zone").notNull(), // "Peninsular Malaysia" or "East Malaysia"
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).default("0.00").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(), // Grand total in MYR
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id, { onDelete: "set null" }),
  paymentProofUrl: text("payment_proof_url"), // S3 object key, served via /api/orders/[orderId]/receipt
  idempotencyKey: text("idempotency_key").unique(), // prevents duplicate checkout from double-submit
  paymentStatus: text("payment_status").default("PENDING").notNull(), // "PENDING", "PAID", "FAILED"
  orderStatus: text("order_status").default("PENDING_PAYMENT").notNull(), // "PENDING_PAYMENT", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"
  trackingNumber: text("tracking_number"), // Pos Laju, J&T Express MY, Ninja Van MY tracking code
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// 6. Order Items (Pure Jersey with Customization)
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  jerseyId: uuid("jersey_id").references(() => jerseys.id, { onDelete: "set null" }),
  size: text("size").notNull(), // "S", "M", "L", "XL", "XXL"
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(), // Price in MYR
  namesetName: text("nameset_name"), // Custom player name on back
  namesetNumber: text("nameset_number"), // Custom squad number
  namesetPrice: numeric("nameset_price", { precision: 12, scale: 2 }).default("0.00").notNull(),
  patch: text("patch"), // Sleeve competition patch (e.g. "UCL Starball + Foundation")
  patchPrice: numeric("patch_price", { precision: 12, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. Store Settings (Key-Value)
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// 8. Homepage Bento Banners
export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  image: text("image").notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  link: text("link"),
  active: boolean("active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 9. Customer Testimonials
export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  rating: integer("rating").default(5).notNull(),
  comment: text("comment").notNull(),
  club: text("club"),
  proofImage: text("proof_image"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const jerseysRelations = relations(jerseys, ({ many }) => ({
  images: many(jerseyImages),
  orderItems: many(orderItems),
}));

export const jerseyImagesRelations = relations(jerseyImages, ({ one }) => ({
  jersey: one(jerseys, {
    fields: [jerseyImages.jerseyId],
    references: [jerseys.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  jersey: one(jerseys, {
    fields: [orderItems.jerseyId],
    references: [jerseys.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  orders: many(orders),
}));

// Export Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Jersey = typeof jerseys.$inferSelect;
export type NewJersey = typeof jerseys.$inferInsert;
export type JerseyImage = typeof jerseyImages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
