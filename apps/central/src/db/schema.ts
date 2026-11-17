import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb, pgEnum, text } from "drizzle-orm/pg-core";

// ENUMY
export const companyStatusEnum = pgEnum("company_status", ["pending", "active", "blocked", "rejected"]);
export const paymentTermEnum = pgEnum("payment_term", ["prepayment", "d7", "d14", "d21", "d30", "d45", "d60"]);
export const changeRequestStatusEnum = pgEnum("change_request_status", ["pending", "approved", "rejected"]);
export const deliveryTypeEnum = pgEnum("delivery_type", ["courier", "parcel_locker", "personal_pickup"]);
export const orderSourceEnum = pgEnum("order_source", ["b2b", "shop"]);
export const fulfillmentStatusEnum = pgEnum("fulfillment_status", ["new", "in_progress", "partially_completed", "completed", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "partially_paid", "paid", "refunded"]);
export const noteAuthorEnum = pgEnum("note_author", ["customer", "system", "staff"]);
export const priceSourceEnum = pgEnum("price_source", ["individual", "net_net", "retail_discounted", "retail"]);

// BAZOWY TIMESTAMP
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
};

// TABELE
export const brands = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  prefix: varchar("prefix", { length: 3 }).notNull().unique(),
  domain: varchar("domain", { length: 255 }),
  theme: jsonb("theme"),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  contentVersion: integer("content_version").default(1).notNull(),
  ...timestamps,
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "cascade" }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull().unique(),
  ean: varchar("ean", { length: 13 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  retailPriceNet: integer("retail_price_net").notNull(),
  vatRate: integer("vat_rate").notNull(),
  netNetPrice: integer("net_net_price"),
  isAvailable: boolean("is_available").default(true).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  ...timestamps,
});

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 255 }),
  displayOrder: integer("display_order").default(0).notNull(),
  isMain: boolean("is_main").default(false).notNull(),
  ...timestamps,
});

export const productFiles = pgTable("product_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // manual, tech_sheet, other
  visibleName: varchar("visible_name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  ...timestamps,
});

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: companyStatusEnum("status").default("pending").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nip: varchar("nip", { length: 20 }).notNull().unique(),
  street: varchar("street", { length: 255 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }).notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  paymentTerm: paymentTermEnum("payment_term").default("prepayment").notNull(),
  limitNet: integer("limit_net"),
  rejectionReason: text("rejection_reason"),
  approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
  ...timestamps,
});

export const companyUsers = pgTable("company_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  ...timestamps,
});

export const companyBrandDiscounts = pgTable("company_brand_discounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "cascade" }).notNull(),
  discountPb: integer("discount_pb").default(0).notNull(),
  ...timestamps,
});

export const companyProductPrices = pgTable("company_product_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  priceNet: integer("price_net").notNull(),
  ...timestamps,
});

export const companyChangeRequests = pgTable("company_change_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  proposedData: jsonb("proposed_data").notNull(),
  status: changeRequestStatusEnum("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by"), // reference to staff_users ideally
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
  ...timestamps,
});

export const deliveryMethods = pgTable("delivery_methods", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "cascade" }).notNull(),
  type: deliveryTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  priceGross: integer("price_gross").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  source: orderSourceEnum("source").notNull(),
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  customerData: jsonb("customer_data").notNull(),
  fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").default("new").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  paymentTerm: paymentTermEnum("payment_term").default("prepayment").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" }),
  sumNet: integer("sum_net").notNull(),
  sumVat: integer("sum_vat").notNull(),
  sumGross: integer("sum_gross").notNull(),
  customerNote: text("customer_note"),
  ...timestamps,
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceNet: integer("unit_price_net").notNull(),
  vatRate: integer("vat_rate").notNull(),
  discountPb: integer("discount_pb").default(0).notNull(),
  priceSource: priceSourceEnum("price_source").notNull(),
  sumNet: integer("sum_net").notNull(),
  sumVat: integer("sum_vat").notNull(),
  sumGross: integer("sum_gross").notNull(),
  ...timestamps,
});

export const orderNotes = pgTable("order_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  author: noteAuthorEnum("author").notNull(),
  content: text("content").notNull(),
  isVisibleToCustomer: boolean("is_visible_to_customer").default(false).notNull(),
  ...timestamps,
});

export const orderSequences = pgTable("order_sequences", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceCode: varchar("source_code", { length: 10 }).notNull(), // e.g. HUR, FUL
  year: integer("year").notNull(),
  lastNumber: integer("last_number").default(0).notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  link: varchar("link", { length: 255 }),
  relatedId: uuid("related_id"),
  readBy: uuid("read_by"),
  readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
  ...timestamps,
});

export const staffUsers = pgTable("staff_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  ...timestamps,
});

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerData: jsonb("seller_data").notNull(),
  ...timestamps,
});
// --- LOGI E-MAIL ---
export const mailLog = pgTable("mail_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  status: text("status").notNull(), // 'sent', 'simulated', 'error'
  errorMsg: text("error_msg"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
