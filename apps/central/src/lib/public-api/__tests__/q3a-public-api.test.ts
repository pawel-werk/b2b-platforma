import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  ShopCatalogResponseSchema,
  CheckoutConflictResponseSchema,
} from "@repo/shared";
import {
  getShopCatalog,
  processB2CCheckout,
  generateNextOrderNumber,
  getOrderViewByLookup,
  getBrandVersionOnly,
} from "../service";
import { ensureB2CSchemaAndSeed } from "../b2c-db";
import { saveProduct, toggleProductAvailability } from "@/actions/catalog";

describe("Q3a Publiczne API B2C", () => {
  let testBrandId = "";
  let testBrandSlug = "";
  let availableVariantId = "";
  let unavailableVariantId = "";

  beforeAll(async () => {
    await ensureB2CSchemaAndSeed();

    const brandsRes = await db.execute(sql`SELECT id, slug, name FROM brands LIMIT 1`);
    const rows = (brandsRes as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? (brandsRes as unknown as Array<Record<string, unknown>>);

    if (rows.length > 0) {
      testBrandId = String(rows[0].id);
      testBrandSlug = String(rows[0].slug);
    } else {
      testBrandId = "brand-villeroy-test";
      testBrandSlug = "villeroy";
      await db.execute(sql`
        INSERT INTO brands (id, slug, name, order_prefix, content_version)
        VALUES (${testBrandId}, ${testBrandSlug}, 'Villeroy & Boch', 'VIL', 1)
        ON CONFLICT (id) DO NOTHING
      `);
    }

    // Produkt dostępny (1000.00 zł netto, 23% VAT -> 123000 groszy brutto)
    const savedAvail = await saveProduct({
      id: "new",
      brandId: testBrandId,
      name: "Zlewozmywak Ceramiczny Subway 60",
      sku: `VIL-SUB-${Date.now().toString().slice(-5)}`,
      ean: "4051202000011",
      retailPriceNet: 1000,
      vatRate: 23,
      isNetNet: false,
      isAvailable: true,
      availability: "available",
    });
    availableVariantId = savedAvail.id;

    // Produkt niedostępny
    const savedUnavail = await saveProduct({
      id: "new",
      brandId: testBrandId,
      name: "Bateria Kuchenna Umbrella Flex",
      sku: `VIL-UMB-${Date.now().toString().slice(-5)}`,
      ean: "4051202000028",
      retailPriceNet: 800,
      vatRate: 23,
      isNetNet: false,
      isAvailable: false,
      availability: "unavailable",
    });
    unavailableVariantId = savedUnavail.id;
    await toggleProductAvailability(unavailableVariantId, "unavailable");
  });

  it("1. odpowiedź catalog jest w 100% zgodna ze schematem Zod w packages/shared", async () => {
    const catalog = await getShopCatalog(testBrandSlug);
    expect(catalog).not.toBeNull();
    const parsed = ShopCatalogResponseSchema.safeParse(catalog);
    expect(parsed.success).toBe(true);
  });

  it("2. wariant o statusie unavailable nie przechodzi checkoutu (zwraca 409 z listą pozycji)", async () => {
    const result = await processB2CCheckout(testBrandSlug, {
      items: [{ variantId: unavailableVariantId, quantity: 1 }],
      customer: {
        firstName: "Jan",
        lastName: "Kowalski",
        email: "jan@example.com",
        phone: "500600700",
      },
      delivery: {
        method: "pickup",
      },
      termsAccepted: true,
      expectedTotalGrosze: 98400,
    });

    expect(result.status).toBe(409);
    const conflict = CheckoutConflictResponseSchema.parse(result.body);
    expect(conflict.code).toBe("UNAVAILABLE_ITEMS");
    expect(conflict.unavailableItems?.length).toBeGreaterThan(0);
    expect(conflict.unavailableItems?.[0].variantId).toBe(unavailableVariantId);
  });

  it("3. zmiana ceny w centrali zwraca 409 z nowymi sumami (PRICE_MISMATCH)", async () => {
    const result = await processB2CCheckout(testBrandSlug, {
      items: [{ variantId: availableVariantId, quantity: 1 }],
      customer: {
        firstName: "Anna",
        lastName: "Nowak",
        email: "anna@example.com",
        phone: "600700800",
      },
      delivery: {
        method: "pickup",
      },
      termsAccepted: true,
      expectedTotalGrosze: 50000, // Nieaktualna kwota z przeglądarki
    });

    expect(result.status).toBe(409);
    const conflict = CheckoutConflictResponseSchema.parse(result.body);
    expect(conflict.code).toBe("PRICE_MISMATCH");
    expect(conflict.newTotals?.totalBruttoGrosze).toBe(123000);
  });

  it("4. numeracja zamówień nie powtarza numerów przy równoległych żądaniach", async () => {
    const parallelCalls = Array.from({ length: 12 }, () =>
      generateNextOrderNumber("VIL", 2026)
    );
    const numbers = await Promise.all(parallelCalls);
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(12);
    for (const num of numbers) {
      expect(num).toMatch(/^VIL\/2026\/\d{4}$/);
    }
  });

  it("5. lookup z błędnym e-mailem zwraca null (404 w API) bez zdradzania, czy numer istnieje", async () => {
    const checkoutRes = await processB2CCheckout(testBrandSlug, {
      items: [{ variantId: availableVariantId, quantity: 2 }], // 2460.00 zł -> darmowa dostawa
      customer: {
        firstName: "Piotr",
        lastName: "Zieliński",
        email: "piotr.zielinski@example.com",
        phone: "700800900",
      },
      delivery: {
        method: "courier",
        address: { street: "Braniborska 14", postalCode: "53-680", city: "Wrocław" },
      },
      termsAccepted: true,
      expectedTotalGrosze: 246000,
    });

    expect(checkoutRes.status).toBe(201);
    const orderNumber = (checkoutRes.body as { orderNumber: string }).orderNumber;

    const wrongEmailLookup = await getOrderViewByLookup(
      testBrandSlug,
      orderNumber,
      "intruz@example.com"
    );
    expect(wrongEmailLookup).toBeNull();

    const validLookup = await getOrderViewByLookup(
      testBrandSlug,
      orderNumber,
      "piotr.zielinski@example.com"
    );
    expect(validLookup).not.toBeNull();
    expect(validLookup?.orderNumber).toBe(orderNumber);
  });

  it("6. po zapisie produktu contentVersion marki rośnie", async () => {
    const beforeVersion = (await getBrandVersionOnly(testBrandSlug)) ?? 1;

    await saveProduct({
      id: availableVariantId,
      brandId: testBrandId,
      name: "Zlewozmywak Ceramiczny Subway 60 (Aktualizacja)",
      sku: `VIL-SUB-${Date.now().toString().slice(-5)}`,
      ean: "4051202000011",
      retailPriceNet: 1050,
      vatRate: 23,
      isNetNet: false,
      isAvailable: true,
      availability: "available",
    });

    const afterVersion = (await getBrandVersionOnly(testBrandSlug)) ?? 1;
    expect(afterVersion).toBeGreaterThan(beforeVersion);
  });
});
