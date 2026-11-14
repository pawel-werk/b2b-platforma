import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }), // dla własnych domen
  theme: text("theme"), // przetrzymuje np. JSON z kolorami {"color": "#ef4444"}
  isActive: boolean("is_active").default(true).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").references(() => brands.id).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull().unique(),
  ean: varchar("ean", { length: 13 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  retailPriceNet: integer("retail_price_net").notNull(), // w groszach
  wholesalePriceNet: integer("wholesale_price_net"), // w groszach
  vatRate: integer("vat_rate").default(23).notNull(),
  availability: varchar("availability", { length: 50 }).default("in_stock").notNull(),
  imageUrl: varchar("image_url", { length: 1024 }), // Nowe pole na zdjęcie
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").references(() => brands.id).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  totalGross: integer("total_gross").notNull(), // suma całego zamówienia w groszach
  status: varchar("status", { length: 50 }).default("new").notNull(), // np. new, paid, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  priceGross: integer("price_gross").notNull(), // zapamiętana cena brutto za 1 szt. w momencie zakupu (w groszach)
});
export const staffUsers = pgTable("staff_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const b2bCustomers = pgTable("b2b_customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  nip: varchar("nip", { length: 20 }).notNull(),
  discountPb: integer("discount_pb").default(0).notNull(), // Rabat w punktach bazowych (np. 1000 = 10%)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});