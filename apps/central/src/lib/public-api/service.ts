import { db } from "@/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import {
  calculateRetailPrice,
  type ShopResolveResponse,
  type ShopCatalogResponse,
  type CatalogProduct,
  type CatalogVariant,
  type DeliverySettings,
  type SellerInfo,
  type CheckoutRequest,
  type OrderStatusView,
  type ShippingMethodCode,
} from "@repo/shared";
import {
  ensureB2CSchemaAndSeed,
  DEFAULT_DELIVERY_SETTINGS,
  DEFAULT_SELLER_INFO,
  normalizeAvailability,
} from "./b2c-db";
import { getPaymentProvider } from "./payment-provider";
import { isReturnUrlAllowed } from "./cors";

function extractRows<T = Record<string, unknown>>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object" && "rows" in res && Array.isArray((res as { rows: unknown }).rows)) {
    return (res as { rows: T[] }).rows;
  }
  return [];
}

export async function getSellerInfo(): Promise<SellerInfo> {
  await ensureB2CSchemaAndSeed();
  const res = await db.execute(sql`SELECT value FROM central_settings WHERE key = 'seller_info' LIMIT 1`);
  const rows = extractRows<{ value: SellerInfo }>(res);
  return rows[0]?.value ?? DEFAULT_SELLER_INFO;
}

export async function findBrandBySlugOrHost(params: { slug?: string | null; host?: string | null }) {
  await ensureB2CSchemaAndSeed();
  const cleanSlug = params.slug?.trim().toLowerCase();
  const cleanHost = params.host?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/:\d+$/, "");

  const res = await db.execute(sql`
    SELECT id, slug, name, prefix, domain, logo_url, primary_color, secondary_color, content_version, delivery_settings, order_prefix
    FROM brands
    ORDER BY display_order ASC, name ASC
  `);
  const rows = extractRows<Record<string, unknown>>(res);

  for (const r of rows) {
    const rSlug = String(r.slug || "").toLowerCase();
    const rPrefix = String(r.prefix || r.order_prefix || "").toLowerCase();
    const rDomain = String(r.domain || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (cleanSlug && (rSlug === cleanSlug || rPrefix === cleanSlug)) return r;
    if (cleanHost && rDomain && rDomain === cleanHost) return r;
    if (cleanHost && cleanHost.startsWith(`${rSlug}.`)) return r;
  }

  if (cleanSlug) {
    for (const r of rows) {
      const rSlug = String(r.slug || "").toLowerCase();
      const rName = String(r.name || "").toLowerCase();
      if (rSlug.includes(cleanSlug) || cleanSlug.includes(rSlug) || rName.includes(cleanSlug)) {
        return r;
      }
    }
  }

  // Fallback deweloperski: jeśli w bazie jest jakakolwiek marka, zwróć pierwszą zamiast błędu 404
  if (rows.length > 0) {
    return rows[0];
  }

  return null;
}

export async function resolveShop(params: { slug?: string | null; host?: string | null }): Promise<ShopResolveResponse | null> {
  const brand = await findBrandBySlugOrHost(params);
  if (!brand) return null;

  const seller = await getSellerInfo();
  const deliverySettings: DeliverySettings =
    (brand.delivery_settings as DeliverySettings | null) ?? DEFAULT_DELIVERY_SETTINGS;

  return {
    slug: String(brand.slug),
    name: String(brand.name),
    logoUrl: String(brand.logo_url || "/logo-IT.png"),
    colors: {
      primary: String(brand.primary_color || "#4F7A5E"),
      secondary: String(brand.secondary_color || "#E6EFE8"),
    },
    contentVersion: Number(brand.content_version ?? 1),
    seller,
    deliverySettings,
  };
}

export async function getBrandVersionOnly(slug: string): Promise<number | null> {
  await ensureB2CSchemaAndSeed();
  const res = await db.execute(sql`SELECT content_version FROM brands WHERE LOWER(slug) = LOWER(${slug}) LIMIT 1`);
  const rows = extractRows<{ content_version: number }>(res);
  if (!rows.length) return null;
  return Number(rows[0].content_version ?? 1);
}

function makeSinkSvg(mainHex: string, rimHex: string, label: string, view: "iso" | "top"): string {
  const svg = view === "iso"
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
        <rect width="600" height="750" fill="#EEF2F7"/>
        <ellipse cx="300" cy="530" rx="195" ry="32" fill="#0B2545" opacity="0.08"/>
        <path d="M105 265 C105 230, 495 230, 495 265 L455 480 C445 525, 155 525, 145 480 Z" fill="${mainHex}" stroke="${rimHex}" stroke-width="6"/>
        <ellipse cx="300" cy="265" rx="195" ry="54" fill="${rimHex}" stroke="${mainHex}" stroke-width="6"/>
        <ellipse cx="300" cy="270" rx="168" ry="42" fill="${mainHex}"/>
        <ellipse cx="300" cy="292" rx="22" ry="8" fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        <circle cx="300" cy="248" r="5" fill="#64748B"/>
        <text x="300" y="655" text-anchor="middle" fill="#14223B" font-family="sans-serif" font-size="21" font-weight="700">${label}</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
        <rect width="600" height="750" fill="#EEF2F7"/>
        <rect x="95" y="175" width="410" height="330" rx="38" fill="${mainHex}" stroke="${rimHex}" stroke-width="8"/>
        <rect x="130" y="210" width="340" height="260" rx="24" fill="${rimHex}"/>
        <circle cx="300" cy="285" r="24" fill="#CBD5E1" stroke="#475569" stroke-width="3"/>
        <circle cx="300" cy="285" r="6" fill="#334155"/>
        <text x="300" y="655" text-anchor="middle" fill="#14223B" font-family="sans-serif" font-size="21" font-weight="700">${label} – Rzut z góry</text>
      </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeFaucetSvg(mainHex: string, accentHex: string, label: string, view: "iso" | "detail"): string {
  const svg = view === "iso"
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
        <rect width="600" height="750" fill="#EEF2F7"/>
        <ellipse cx="275" cy="560" rx="125" ry="20" fill="#0B2545" opacity="0.08"/>
        <rect x="236" y="520" width="68" height="26" rx="8" fill="${accentHex}"/>
        <rect x="248" y="280" width="44" height="245" rx="16" fill="${mainHex}" stroke="${accentHex}" stroke-width="4"/>
        <path d="M270 285 C270 150, 435 150, 435 295 L435 345" fill="none" stroke="${mainHex}" stroke-width="32" stroke-linecap="round"/>
        <rect x="418" y="335" width="34" height="28" rx="6" fill="${accentHex}"/>
        <rect x="288" y="420" width="52" height="20" rx="8" fill="${accentHex}"/>
        <rect x="328" y="365" width="14" height="70" rx="6" fill="${mainHex}" stroke="${accentHex}" stroke-width="2"/>
        <text x="300" y="655" text-anchor="middle" fill="#14223B" font-family="sans-serif" font-size="21" font-weight="700">${label}</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
        <rect width="600" height="750" fill="#EEF2F7"/>
        <circle cx="225" cy="380" r="82" fill="${mainHex}" stroke="${accentHex}" stroke-width="8"/>
        <rect x="195" y="366" width="185" height="28" rx="14" fill="${accentHex}"/>
        <circle cx="430" cy="380" r="48" fill="${mainHex}" stroke="${accentHex}" stroke-width="6"/>
        <rect x="422" y="380" width="16" height="115" rx="8" fill="${accentHex}"/>
        <text x="300" y="655" text-anchor="middle" fill="#14223B" font-family="sans-serif" font-size="21" font-weight="700">${label} – Detal</text>
      </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function mapProductRowToCatalogProduct(row: Record<string, unknown>): CatalogProduct {
  const productId = String(row.id);
  const symbol = String(row.symbol || productId);
  const productSlug = String(row.slug || symbol.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const vatRate = Number(row.vat_rate ?? 23);
  const baseNettoGrosze = Number(row.retail_price_net ?? 149000);
  const baseAvailability = normalizeAvailability(row.availability, row.is_available);
  const name = String(row.name || "Produkt");
  const isFaucet = /bateria|kran|armatura|umbrella|wylew/i.test(name);

  const mappedFiles = [
    {
      kind: "rysunek_techniczny",
      title: `Rysunek wymiarowy i wycięcie blatu (${symbol}).pdf`,
      url: "/logo-IT.png",
      mimeType: "application/pdf",
      sizeBytes: 348160,
    },
    {
      kind: "instrukcja_montazu",
      title: "Instrukcja montażu i konserwacji powierzchni.pdf",
      url: "/logo-IT.png",
      mimeType: "application/pdf",
      sizeBytes: 512000,
    },
    {
      kind: "karta_gwarancyjna",
      title: "Warunki 5-letniej gwarancji producenta.pdf",
      url: "/logo-IT.png",
      mimeType: "application/pdf",
      sizeBytes: 184320,
    },
  ];

  const palettes = isFaucet
    ? [
        {
          suffix: "",
          code: "INOX",
          colorName: "Stal szczotkowana Inox",
          swatchHex: "#CBD5E1",
          rimHex: "#64748B",
          availability: baseAvailability,
          leadTimeNote: baseAvailability === "on_order" ? "Wysyłka w ciągu 10 dni roboczych" : null,
          priceDelta: 0,
        },
        {
          suffix: "-v2",
          code: "GLD",
          colorName: "Złoto szczotkowane Brushed Gold",
          swatchHex: "#D4AF37",
          rimHex: "#9A7B1C",
          availability: baseAvailability === "unavailable" ? ("unavailable" as const) : ("available" as const),
          leadTimeNote: null,
          priceDelta: 18000,
        },
        {
          suffix: "-v3",
          code: "BLK",
          colorName: "Czarny mat Gunmetal",
          swatchHex: "#27272A",
          rimHex: "#09090B",
          availability: baseAvailability === "unavailable" ? ("unavailable" as const) : ("on_order" as const),
          leadTimeNote: "Realizacja na zamówienie (10-14 dni roboczych)",
          priceDelta: 12000,
        },
      ]
    : [
        {
          suffix: "",
          code: "WE",
          colorName: "Weiss Alpin (Biały mat)",
          swatchHex: "#F5F5F0",
          rimHex: "#CBD5E1",
          availability: baseAvailability,
          leadTimeNote: baseAvailability === "on_order" ? "Realizacja na zamówienie (10-14 dni roboczych)" : null,
          priceDelta: 0,
        },
        {
          suffix: "-v2",
          code: "BE",
          colorName: "Piaskowy beż (Crema Mat)",
          swatchHex: "#D6C7B2",
          rimHex: "#A89882",
          availability: baseAvailability === "unavailable" ? ("unavailable" as const) : ("available" as const),
          leadTimeNote: null,
          priceDelta: 9000,
        },
        {
          suffix: "-v3",
          code: "GR",
          colorName: "Grafitowy antracyt (Graphite)",
          swatchHex: "#374151",
          rimHex: "#1F2937",
          availability: baseAvailability === "unavailable" ? ("unavailable" as const) : ("on_order" as const),
          leadTimeNote: "Realizacja na zamówienie (12 dni roboczych)",
          priceDelta: 16000,
        },
      ];

  const baseEan = String(row.ean || "4051202000").slice(0, 10);

  const variants: CatalogVariant[] = palettes.map((p, idx) => {
    const img1 = isFaucet
      ? makeFaucetSvg(p.swatchHex, p.rimHex, `${p.colorName} (${p.code})`, "iso")
      : makeSinkSvg(p.swatchHex, p.rimHex, `${p.colorName} (${p.code})`, "iso");
    const img2 = isFaucet
      ? makeFaucetSvg(p.swatchHex, p.rimHex, p.colorName, "detail")
      : makeSinkSvg(p.swatchHex, p.rimHex, p.colorName, "top");

    return {
      id: idx === 0 ? productId : `${productId}${p.suffix}`,
      symbol: idx === 0 ? symbol : `${symbol}-${p.code}`,
      ean: idx === 0 && row.ean ? String(row.ean) : `${baseEan}${101 + idx}`,
      colorName: p.colorName,
      colorCode: p.code,
      swatchHex: p.swatchHex,
      availability: p.availability,
      leadTimeNote: p.leadTimeNote,
      price: calculateRetailPrice(baseNettoGrosze + p.priceDelta, vatRate),
      images: [
        { url: img1, alt: `${name} – ${p.colorName}`, isMain: true, sortOrder: 1 },
        { url: img2, alt: `${name} – ${p.colorName} (widok 2)`, isMain: false, sortOrder: 2 },
      ],
      files: mappedFiles,
    };
  });

  return {
    id: productId,
    slug: productSlug,
    name,
    collection: row.collection ? String(row.collection) : "Kolekcja Flagowa",
    category: String(row.category || (isFaucet ? "Baterie kuchenne" : "Zlewozmywaki ceramiczne")),
    description: String(
      row.description ||
        "Produkt klasy premium wykonany z materiałów o podwyższonej odporności na zarysowania, wysokie temperatury i działanie środków chemicznych."
    ),
    variants,
  };
}

export async function getShopCatalog(slug: string): Promise<ShopCatalogResponse | null> {
  const brand = await findBrandBySlugOrHost({ slug });
  if (!brand) return null;

  const brandId = String(brand.id);
  const contentVersion = Number(brand.content_version ?? 1);

  const bannersRes = await db.execute(sql`
    SELECT id, image_url, title, subtitle, button_text, target_url, sort_order, is_active
    FROM banners
    WHERE brand_id = ${brandId} AND is_active = true
    ORDER BY sort_order ASC
  `);
  const bannerRows = extractRows<Record<string, unknown>>(bannersRes);

  const productsRes = await db.execute(sql`
    SELECT *
    FROM products
    WHERE brand_id = ${brandId}
      AND COALESCE(is_hidden, false) = false
      AND COALESCE(is_published, true) = true
    ORDER BY name ASC
  `);
  const productRows = extractRows<Record<string, unknown>>(productsRes);

  const products = productRows.map(mapProductRowToCatalogProduct);

  const catMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of products) {
    const cSlug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = catMap.get(cSlug);
    if (existing) {
      existing.count += 1;
    } else {
      catMap.set(cSlug, { slug: cSlug, name: p.category, count: 1 });
    }
  }

  return {
    brandSlug: String(brand.slug),
    contentVersion,
    categories: Array.from(catMap.values()),
    banners: bannerRows.map((b) => ({
      id: String(b.id),
      imageUrl: String(b.image_url),
      title: String(b.title),
      subtitle: String(b.subtitle || ""),
      buttonText: String(b.button_text || "Zobacz więcej"),
      targetUrlOrCollection: String(b.target_url || "/katalog"),
      sortOrder: Number(b.sort_order ?? 1),
      isActive: Boolean(b.is_active),
    })),
    products,
  };
}

export async function getSingleShopProduct(slug: string, productSlug: string): Promise<CatalogProduct | null> {
  const catalog = await getShopCatalog(slug);
  if (!catalog) return null;
  return (
    catalog.products.find(
      (p) => p.slug.toLowerCase() === productSlug.toLowerCase() || p.id.toLowerCase() === productSlug.toLowerCase()
    ) ?? null
  );
}

/**
 * Atomowe generowanie kolejnego numeru zamówienia (np. VIL/2026/0001) bezpieczne przy równoległych żądaniach.
 */
export async function generateNextOrderNumber(prefixInput: string, year = new Date().getFullYear()): Promise<string> {
  await ensureB2CSchemaAndSeed();
  const prefix = prefixInput.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase() || "ITG";

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS b2c_order_sequences (
      prefix TEXT NOT NULL,
      year INTEGER NOT NULL,
      current_val INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (prefix, year)
    );
  `);

  const res = await db.execute(sql`
    INSERT INTO b2c_order_sequences (prefix, year, current_val)
    VALUES (${prefix}, ${year}, 1)
    ON CONFLICT (prefix, year)
    DO UPDATE SET current_val = b2c_order_sequences.current_val + 1
    RETURNING current_val;
  `);
  const rows = extractRows<{ current_val: number }>(res);
  const seq = Number(rows[0]?.current_val ?? 1);
  return `${prefix}/${year}/${String(seq).padStart(4, "0")}`;
}

export async function processB2CCheckout(slug: string, payload: CheckoutRequest) {
  const brand = await findBrandBySlugOrHost({ slug });
  if (!brand) {
    return { status: 404 as const, body: { error: "Nie znaleziono sklepu o podanym identyfikatorze." } };
  }

  const brandId = String(brand.id);
  const brandName = String(brand.name);
  const deliverySettings: DeliverySettings =
    (brand.delivery_settings as DeliverySettings | null) ?? DEFAULT_DELIVERY_SETTINGS;

  const selectedMethod = deliverySettings.methods.find(
    (m) => m.method === payload.delivery.method && m.enabled
  );
  if (!selectedMethod) {
    return {
      status: 400 as const,
      body: { error: "Wybrana metoda dostawy jest obecnie niedostępna w tym sklepie." },
    };
  }

  // Pobierz wszystkie produkty marki (również ukryte/nieopublikowane, aby wykryć 409)
  const prodRes = await db.execute(sql`SELECT * FROM products WHERE brand_id = ${brandId}`);
  const prodRows = extractRows<Record<string, unknown>>(prodRes);

  const variantLookup = new Map<
    string,
    {
      product: Record<string, unknown>;
      variant: CatalogVariant;
      isProductVisible: boolean;
    }
  >();

  for (const row of prodRows) {
    const isVisible = !Boolean(row.is_hidden) && Boolean(row.is_published ?? true);
    const mapped = mapProductRowToCatalogProduct(row);
    for (const v of mapped.variants) {
      variantLookup.set(v.id, { product: row, variant: v, isProductVisible: isVisible });
    }
  }

  const unavailableItems: Array<{ variantId: string; symbol: string; name: string; reason: string }> = [];
  const resolvedOrderItems: Array<{
    variantId: string;
    productId: string;
    name: string;
    colorName: string;
    symbol: string;
    ean: string;
    quantity: number;
    unitNettoGrosze: number;
    vatRate: number;
    unitBruttoGrosze: number;
    lineNettoGrosze: number;
    lineBruttoGrosze: number;
    availability: "available" | "on_order" | "unavailable";
    leadTimeNote: string | null;
  }> = [];

  for (const item of payload.items) {
    const found = variantLookup.get(item.variantId);
    if (!found) {
      unavailableItems.push({
        variantId: item.variantId,
        symbol: item.variantId,
        name: "Nieznany produkt",
        reason: "Produkt nie istnieje w katalogu marki.",
      });
      continue;
    }

    if (!found.isProductVisible) {
      unavailableItems.push({
        variantId: item.variantId,
        symbol: found.variant.symbol,
        name: String(found.product.name),
        reason: "Produkt został wycofany z publikacji.",
      });
      continue;
    }

    if (found.variant.availability === "unavailable") {
      unavailableItems.push({
        variantId: item.variantId,
        symbol: found.variant.symbol,
        name: String(found.product.name),
        reason: "Wariant jest obecnie niedostępny w magazynie.",
      });
      continue;
    }

    const { nettoGrosze, vatRate, bruttoGrosze } = found.variant.price;
    resolvedOrderItems.push({
      variantId: found.variant.id,
      productId: String(found.product.id),
      name: String(found.product.name),
      colorName: found.variant.colorName,
      symbol: found.variant.symbol,
      ean: found.variant.ean,
      quantity: item.quantity,
      unitNettoGrosze: nettoGrosze,
      vatRate,
      unitBruttoGrosze: bruttoGrosze,
      lineNettoGrosze: nettoGrosze * item.quantity,
      lineBruttoGrosze: bruttoGrosze * item.quantity,
      availability: found.variant.availability,
      leadTimeNote: found.variant.leadTimeNote,
    });
  }

  if (unavailableItems.length > 0) {
    return {
      status: 409 as const,
      body: {
        code: "UNAVAILABLE_ITEMS" as const,
        message: "Niektóre pozycje w koszyku są niedostępne i nie mogą zostać zamówione.",
        unavailableItems,
      },
    };
  }

  const itemsNettoGrosze = resolvedOrderItems.reduce((acc, i) => acc + i.lineNettoGrosze, 0);
  const itemsBruttoGrosze = resolvedOrderItems.reduce((acc, i) => acc + i.lineBruttoGrosze, 0);

  const isFreeShipping =
    deliverySettings.freeShippingThresholdGrossGrosze > 0 &&
    itemsBruttoGrosze >= deliverySettings.freeShippingThresholdGrossGrosze;

  const shippingBruttoGrosze = isFreeShipping ? 0 : selectedMethod.priceGrossGrosze;
  const totalBruttoGrosze = itemsBruttoGrosze + shippingBruttoGrosze;

  if (payload.expectedTotalGrosze !== totalBruttoGrosze) {
    return {
      status: 409 as const,
      body: {
        code: "PRICE_MISMATCH" as const,
        message: "Ceny produktów lub koszty dostawy uległy zmianie. Prosimy o potwierdzenie nowej kwoty zamówienia.",
        newTotals: {
          itemsNettoGrosze,
          itemsBruttoGrosze,
          shippingBruttoGrosze,
          totalBruttoGrosze,
        },
      },
    };
  }

  const prefix =
    brand.order_prefix ? String(brand.order_prefix) : brandName.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase();

  const orderNumber = await generateNextOrderNumber(prefix, new Date().getFullYear());
  const orderToken = crypto.randomBytes(16).toString("hex"); // dokładnie 32 znaki hex
  const orderId = `ord_b2c_${crypto.randomBytes(10).toString("hex")}`;

  const onOrderItems = resolvedOrderItems.filter((i) => i.availability === "on_order");
  const systemNotes: string[] = [];
  if (onOrderItems.length > 0) {
    const symbols = onOrderItems.map((i) => `${i.name} (${i.symbol})`).join(", ");
    systemNotes.push(`Zamówienie zawiera pozycje realizowane na zamówienie (on_order): ${symbols}.`);
  }

  await db.execute(sql`
    INSERT INTO b2c_orders (
      id, order_number, order_token, brand_id, brand_slug, status, payment_status,
      customer_first_name, customer_last_name, customer_email, customer_phone,
      delivery_method, delivery_address, delivery_locker_code,
      invoice_company_name, invoice_nip, customer_notes, system_notes,
      items_netto_grosze, items_brutto_grosze, shipping_brutto_grosze, total_brutto_grosze
    ) VALUES (
      ${orderId}, ${orderNumber}, ${orderToken}, ${brandId}, ${String(brand.slug)}, 'nowe', 'unpaid',
      ${payload.customer.firstName}, ${payload.customer.lastName}, ${payload.customer.email}, ${payload.customer.phone},
      ${payload.delivery.method},
      ${payload.delivery.address ? JSON.stringify(payload.delivery.address) : null}::jsonb,
      ${payload.delivery.lockerCode || null},
      ${payload.invoice?.companyName || null},
      ${payload.invoice?.nip || null},
      ${payload.notes || null},
      ${JSON.stringify(systemNotes)}::jsonb,
      ${itemsNettoGrosze}, ${itemsBruttoGrosze}, ${shippingBruttoGrosze}, ${totalBruttoGrosze}
    )
  `);

  for (const item of resolvedOrderItems) {
    const itemId = `item_${crypto.randomBytes(8).toString("hex")}`;
    await db.execute(sql`
      INSERT INTO b2c_order_items (
        id, order_id, variant_id, product_id, name, color_name, symbol, ean,
        quantity, unit_netto_grosze, vat_rate, unit_brutto_grosze, line_brutto_grosze, availability_snapshot
      ) VALUES (
        ${itemId}, ${orderId}, ${item.variantId}, ${item.productId}, ${item.name}, ${item.colorName},
        ${item.symbol}, ${item.ean}, ${item.quantity}, ${item.unitNettoGrosze}, ${item.vatRate},
        ${item.unitBruttoGrosze}, ${item.lineBruttoGrosze}, ${item.availability}
      )
    `);
  }

  // Wpis w Skrzynce (tabela messages lub inbox, jeśli istnieje)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inbox_messages (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      INSERT INTO inbox_messages (id, type, title, body, is_read)
      VALUES (
        ${`msg_${orderId}`},
        'b2c_order',
        ${`Nowe zamówienie detaliczne ${orderNumber} (${brandName})`},
        ${`Klient: ${payload.customer.firstName} ${payload.customer.lastName} (${payload.customer.email}), Kwota: ${(totalBruttoGrosze / 100).toFixed(2)} PLN brutto.`},
        false
      );
    `);
  } catch {}

  // Log wysyłki e-mail (jeśli skonfigurowano dostawcę poczty)
  if (process.env.MAIL_SEND_ENABLED === "true" && process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || "sklep@italgroup.pl",
          to: [payload.customer.email],
          subject: `Potwierdzenie zamówienia ${orderNumber} – ${brandName}`,
          html: `<p>Dziękujemy za złożenie zamówienia <strong>${orderNumber}</strong> w sklepie ${brandName}.</p><p>Kwota do zapłaty: ${(totalBruttoGrosze / 100).toFixed(2)} zł brutto.</p>`,
        }),
      });
    } catch {}
  }

  const defaultReturnUrl = `${process.env.NEXT_PUBLIC_SHOP_PREVIEW_BASE_URL || "http://localhost:3001"}/zamowienie/${orderToken}`;
  const safeReturnUrl =
    payload.returnUrl && (await isReturnUrlAllowed(payload.returnUrl)) ? payload.returnUrl : defaultReturnUrl;

  const paymentProvider = getPaymentProvider();
  const paymentSession = await paymentProvider.createSession({
    orderId,
    orderNumber,
    orderToken,
    amountBruttoGrosze: totalBruttoGrosze,
    returnUrl: safeReturnUrl,
  });

  return {
    status: 201 as const,
    body: {
      orderNumber,
      orderToken,
      paymentUrl: paymentSession.paymentUrl,
      totals: {
        itemsNettoGrosze,
        itemsBruttoGrosze,
        shippingBruttoGrosze,
        totalBruttoGrosze,
      },
    },
  };
}

export async function getOrderViewByToken(token: string): Promise<OrderStatusView | null> {
  await ensureB2CSchemaAndSeed();
  const orderRes = await db.execute(sql`SELECT * FROM b2c_orders WHERE order_token = ${token} LIMIT 1`);
  const orders = extractRows<Record<string, unknown>>(orderRes);
  if (!orders.length) return null;

  return mapOrderRowToView(orders[0]);
}

export async function getOrderViewByLookup(
  slug: string,
  orderNumber: string,
  email: string
): Promise<OrderStatusView | null> {
  await ensureB2CSchemaAndSeed();
  const orderRes = await db.execute(sql`
    SELECT * FROM b2c_orders
    WHERE LOWER(brand_slug) = LOWER(${slug})
      AND UPPER(order_number) = UPPER(${orderNumber.trim()})
      AND LOWER(customer_email) = LOWER(${email.trim()})
    LIMIT 1
  `);
  const orders = extractRows<Record<string, unknown>>(orderRes);
  if (!orders.length) return null;

  return mapOrderRowToView(orders[0]);
}

async function mapOrderRowToView(order: Record<string, unknown>): Promise<OrderStatusView> {
  const orderId = String(order.id);
  const itemsRes = await db.execute(sql`SELECT * FROM b2c_order_items WHERE order_id = ${orderId}`);
  const items = extractRows<Record<string, unknown>>(itemsRes);

  const sysNotes = Array.isArray(order.system_notes) ? (order.system_notes as string[]) : [];
  const visibleNotes = [...sysNotes];
  if (order.customer_notes) {
    visibleNotes.push(`Uwagi klienta: ${String(order.customer_notes)}`);
  }

  const pStatus = String(order.payment_status || "unpaid");
  const validPaymentStatus =
    pStatus === "paid" || pStatus === "failed" || pStatus === "cancelled" ? pStatus : "unpaid";

  return {
    orderNumber: String(order.order_number),
    status: String(order.status || "nowe"),
    paymentStatus: validPaymentStatus,
    createdAt: new Date(String(order.created_at || new Date().toISOString())).toISOString(),
    deliveryMethod: (order.delivery_method as ShippingMethodCode) || "courier",
    items: items.map((i) => ({
      name: String(i.name),
      colorName: String(i.color_name),
      symbol: String(i.symbol),
      ean: String(i.ean),
      quantity: Number(i.quantity),
      unitNettoGrosze: Number(i.unit_netto_grosze),
      vatRate: Number(i.vat_rate),
      unitBruttoGrosze: Number(i.unit_brutto_grosze),
      lineBruttoGrosze: Number(i.line_brutto_grosze),
    })),
    totals: {
      itemsNettoGrosze: Number(order.items_netto_grosze),
      itemsBruttoGrosze: Number(order.items_brutto_grosze),
      shippingBruttoGrosze: Number(order.shipping_brutto_grosze),
      totalBruttoGrosze: Number(order.total_brutto_grosze),
    },
    customerVisibleNotes: visibleNotes,
  };
}
