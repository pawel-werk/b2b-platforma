import { db } from "@/db";
import { sql } from "drizzle-orm";
import type { DeliverySettings, SellerInfo, AvailabilityStatus } from "@repo/shared";
import fs from "fs";
import path from "path";

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  freeShippingThresholdGrossGrosze: 150000, // 1500,00 zł
  methods: [
    { method: "courier", label: "Kurier", enabled: true, priceGrossGrosze: 1900 }, // 19,00 zł
    { method: "locker", label: "Paczkomat InPost", enabled: true, priceGrossGrosze: 1400 }, // 14,00 zł
    { method: "pickup", label: "Odbiór osobisty (Mirków k. Wrocławia)", enabled: true, priceGrossGrosze: 0 }, // 0,00 zł
  ],
};

export const DEFAULT_SELLER_INFO: SellerInfo = {
  companyName: "ITAL GROUP Sp. z o.o.",
  address: "ul. Łąkowa 6, 55-095 Mirków",
  nip: "8952000000",
  email: "sklep@italgroup.pl",
  phone: "+48 71 000 00 00",
};

let initialized = false;

/**
 * Zapewnia istnienie wszystkich kolumn i tabel dla Q3a oraz seeduje domyślne banery i ustawienia dostawy.
 */
export async function ensureB2CSchemaAndSeed(): Promise<void> {
  if (initialized) return;

  // 1. Rozszerzenie tabeli brands
  await db.execute(sql`
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '/logo-IT.png';
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#4F7A5E';
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#E6EFE8';
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS content_version INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS delivery_settings JSONB;
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS order_prefix TEXT;
  `);

  // 2. Rozszerzenie tabeli products pod B2C
  await db.execute(sql`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS collection TEXT DEFAULT 'Kolekcja Flagowa';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Urządzenia';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time_note TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS color_name TEXT DEFAULT 'Stal szlachetna / Czarny';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS color_code TEXT DEFAULT 'INOX-BLK';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS swatch_hex TEXT DEFAULT '#2A322D';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS variants_json JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;
  `);

  // 3. Tabela ustawień centrali (dane sprzedawcy do stopki)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS central_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    INSERT INTO central_settings (key, value)
    VALUES ('seller_info', ${JSON.stringify(DEFAULT_SELLER_INFO)}::jsonb)
    ON CONFLICT (key) DO NOTHING;
  `);

  // 4. Tabela banerów
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      button_text TEXT NOT NULL DEFAULT 'Zobacz kolekcję',
      target_url TEXT NOT NULL DEFAULT '/katalog',
      sort_order INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 5. Tabela atomowych sekwencji zamówień (np. VIL + 2026 -> licznik)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS order_sequences (
      prefix TEXT NOT NULL,
      year INTEGER NOT NULL,
      current_val INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (prefix, year)
    );
  `);

  // 6. Tabele zamówień B2C i płatności
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS b2c_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      order_token TEXT NOT NULL UNIQUE,
      brand_id TEXT NOT NULL,
      brand_slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nowe',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      customer_first_name TEXT NOT NULL,
      customer_last_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_method TEXT NOT NULL,
      delivery_address JSONB,
      delivery_locker_code TEXT,
      invoice_company_name TEXT,
      invoice_nip TEXT,
      customer_notes TEXT,
      system_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
      items_netto_grosze INTEGER NOT NULL,
      items_brutto_grosze INTEGER NOT NULL,
      shipping_brutto_grosze INTEGER NOT NULL,
      total_brutto_grosze INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS b2c_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color_name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      ean TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_netto_grosze INTEGER NOT NULL,
      vat_rate INTEGER NOT NULL,
      unit_brutto_grosze INTEGER NOT NULL,
      line_brutto_grosze INTEGER NOT NULL,
      availability_snapshot TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      order_token TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'fake',
      amount_brutto_grosze INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      return_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      bucket_key TEXT PRIMARY KEY,
      hit_count INTEGER NOT NULL DEFAULT 1,
      window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  
  // 6b. Gwarancja istnienia marki Villeroy & Boch (slug: villeroy) oraz produktów pokazowych
  await db.execute(sql`
    INSERT INTO brands (name, slug, prefix, domain, is_active, display_order, content_version)
    VALUES ('Villeroy & Boch', 'villeroy', 'VIL', 'villeroy-zlewozmywaki.pl', true, 1, 1)
    ON CONFLICT (slug) DO NOTHING;
  `);

  const vilRes = await db.execute(sql`SELECT id FROM brands WHERE slug = 'villeroy' LIMIT 1`);
  const vilRows = (vilRes as unknown as { rows?: Array<{ id: string }> }).rows ?? (vilRes as unknown as Array<{ id: string }>);
  if (vilRows.length > 0) {
    const vilId = vilRows[0].id;
    const prodCntRes = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM products WHERE brand_id = ${vilId}`);
    const prodCntRows = (prodCntRes as unknown as { rows?: Array<{ cnt: number }> }).rows ?? (prodCntRes as unknown as Array<{ cnt: number }>);
    if (Number(prodCntRows[0]?.cnt ?? 0) === 0) {
      await db.execute(sql`
        INSERT INTO products (brand_id, symbol, slug, ean, name, collection, category, description, retail_price_net, vat_rate, is_available, availability, color_name, color_code, swatch_hex)
        VALUES
          (${vilId}, 'VIL-SUB-60-WE', 'zlewozmywak-subway-60-bialy', '4051202000101', 'Zlewozmywak ceramiczny Subway 60 SU – Weiss Alpin', 'Kolekcja Subway', 'Zlewozmywaki ceramiczne', 'Ponadczasowy zlewozmywak ceramiczny z powłoką CeramicPlus odporną na zarysowania i wysokie temperatury.', 185000, 23, true, 'available', 'Weiss Alpin', 'WE', '#F8F9FA'),
          (${vilId}, 'VIL-CIS-60-GR', 'zlewozmywak-cisterna-60-grafit', '4051202000102', 'Zlewozmywak podwieszany Cisterna 60 – Graphite', 'Kolekcja Cisterna', 'Zlewozmywaki ceramiczne', 'Minimalistyczna komora do montażu podblatowego w blatach kamiennych i kompozytowych.', 210000, 23, true, 'on_order', 'Graphite', 'GR', '#374151'),
          (${vilId}, 'VIL-UMB-FLEX', 'bateria-kuchenna-umbrella-flex', '4051202000103', 'Bateria kuchenna z wyciąganą wylewką Umbrella Flex', 'Kolekcja Armatura', 'Baterie kuchenne', 'Wysoka bateria kuchenna ze stali szlachetnej z elastyczną wylewką i dwufunkcyjnym perlatorem.', 149000, 23, true, 'available', 'Stal szczotkowana', 'INOX', '#9CA3AF'),
          (${vilId}, 'VIL-SIL-60-BK', 'zlewozmywak-siluet-60-czarny-mat', '4051202000104', 'Zlewozmywak ceramiczny Siluet 60 – Chromit Czarny Mat', 'Kolekcja Siluet', 'Zlewozmywaki ceramiczne', 'Nowoczesna bryła o ultracienkich rantach w głębokim, matowym wykończeniu.', 239000, 23, true, 'available', 'Chromit Mat', 'CM', '#1F2937')
        ON CONFLICT (symbol) DO NOTHING;
      `);
    }
  }

  // 7. Uzupełnienie domyślnych ustawień dostawy, prefiksów i banerów dla marek
  const brandsRes = await db.execute(sql`SELECT id, slug, name, delivery_settings, order_prefix FROM brands`);
  const rows = (brandsRes as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? (brandsRes as unknown as Array<Record<string, unknown>>);

  for (const b of rows) {
    const brandId = String(b.id);
    const brandSlug = String(b.slug || String(b.name).toLowerCase().replace(/\s+/g, "-"));
    const brandName = String(b.name);
    const prefix = b.order_prefix ? String(b.order_prefix) : brandName.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase();

    if (!b.delivery_settings) {
      await db.execute(sql`
        UPDATE brands
        SET delivery_settings = ${JSON.stringify(DEFAULT_DELIVERY_SETTINGS)}::jsonb,
            order_prefix = COALESCE(order_prefix, ${prefix})
        WHERE id = ${brandId}
      `);
    }

    // Sprawdź czy marka ma już banery
    const countRes = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM banners WHERE brand_id = ${brandId}`);
    const countRows = (countRes as unknown as { rows?: Array<{ cnt: number }> }).rows ?? (countRes as unknown as Array<{ cnt: number }>);
    const cnt = Number(countRows[0]?.cnt ?? 0);

    if (cnt === 0) {
      const seedBanners = [
        {
          idx: 1,
          title: `${brandName} – Nowa Kolekcja 2026`,
          subtitle: "Włoski design i perfekcyjna ergonomia w Twojej kuchni",
          buttonText: "Odkryj kolekcję",
          targetUrl: "/kolekcja/flagowa",
          bg1: "#2A322D",
          bg2: "#4F7A5E",
        },
        {
          idx: 2,
          title: `Technologia Premium ${brandName}`,
          subtitle: "Cicha praca, klasa energetyczna A++ i pełna gwarancja producenta",
          buttonText: "Sprawdź modele",
          targetUrl: "/katalog",
          bg1: "#1F2937",
          bg2: "#374151",
        },
        {
          idx: 3,
          title: "Darmowa dostawa od 1 500 zł",
          subtitle: "Bezpieczny transport na półpalecie z wniesieniem pod wskazany adres",
          buttonText: "Złóż zamówienie",
          targetUrl: "/dostawa",
          bg1: "#4F7A5E",
          bg2: "#2E4F3B",
        },
      ];

      for (const sb of seedBanners) {
        const fileName = `${brandSlug}-banner-${sb.idx}.svg`;
        const imageUrl = `/banners/${fileName}`;
        try {
          const publicDir = path.join(process.cwd(), "public", "banners");
          if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
          const filePath = path.join(publicDir, fileName);
          if (!fs.existsSync(filePath)) {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="600" viewBox="0 0 1600 600">
              <defs>
                <linearGradient id="g${sb.idx}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="${sb.bg1}" />
                  <stop offset="100%" stop-color="${sb.bg2}" />
                </linearGradient>
              </defs>
              <rect width="1600" height="600" fill="url(#g${sb.idx})" rx="24"/>
              <circle cx="1350" cy="300" r="220" fill="#ffffff" fill-opacity="0.06"/>
              <text x="100" y="260" fill="#ffffff" font-family="Plus Jakarta Sans, sans-serif" font-size="56" font-weight="700">${sb.title}</text>
              <text x="100" y="330" fill="#E6EFE8" font-family="Plus Jakarta Sans, sans-serif" font-size="28" font-weight="400">${sb.subtitle}</text>
            </svg>`;
            fs.writeFileSync(filePath, svg, "utf8");
          }
        } catch {
          // Ignorujemy błąd zapisu na read-only FS
        }

        const bannerId = `bn_${brandSlug}_${sb.idx}`;
        await db.execute(sql`
          INSERT INTO banners (id, brand_id, image_url, title, subtitle, button_text, target_url, sort_order, is_active)
          VALUES (${bannerId}, ${brandId}, ${imageUrl}, ${sb.title}, ${sb.subtitle}, ${sb.buttonText}, ${sb.targetUrl}, ${sb.idx}, true)
          ON CONFLICT (id) DO NOTHING
        `);
      }
    }
  }

  // 8. Uzupełnienie slugów dla istniejących produktów
  await db.execute(sql`
    UPDATE products
    SET slug = LOWER(REGEXP_REPLACE(COALESCE(symbol, id::text), '[^a-zA-Z0-9]+', '-', 'g'))
    WHERE slug IS NULL OR slug = '';
  `);

  initialized = true;
}

export function normalizeAvailability(raw: unknown, isAvailableBool?: unknown): AvailabilityStatus {
  if (raw === "on_order" || raw === "on_demand") return "on_order";
  if (raw === "unavailable") return "unavailable";
  if (raw === "available") return "available";
  if (isAvailableBool === false) return "unavailable";
  return "available";
}
