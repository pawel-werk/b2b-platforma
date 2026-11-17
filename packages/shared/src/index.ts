import { z } from "zod";

// ==========================================
// 1. FUNKCJE CEN DETALICZNYCH B2C (100% DETAL, W GROSZACH)
// ==========================================
export interface RetailPriceCalculation {
  nettoGrosze: number;
  vatRate: number;
  bruttoGrosze: number;
}

/**
 * Oblicza cenę detaliczną B2C (100% ceny detalicznej, bez rabatów B2B).
 * Przyjmuje cenę netto wariantu (lub produktu, jeśli wariant nie nadpisuje) w groszach.
 */
export function calculateRetailPrice(
  variantOrProductNettoGrosze: number,
  vatRate: number
): RetailPriceCalculation {
  const nettoGrosze = Math.round(variantOrProductNettoGrosze);
  const safeVat = Math.max(0, Math.round(vatRate));
  const bruttoGrosze = Math.round(nettoGrosze * (1 + safeVat / 100));
  return {
    nettoGrosze,
    vatRate: safeVat,
    bruttoGrosze,
  };
}

// ==========================================
// 2. SCHEMATY ZOD - DOSTAWA I ROZPOZNAWANIE SKLEPU
// ==========================================
export const ShippingMethodCodeSchema = z.enum(["courier", "locker", "pickup"]);
export type ShippingMethodCode = z.infer<typeof ShippingMethodCodeSchema>;

export const ShippingMethodOptionSchema = z.object({
  method: ShippingMethodCodeSchema,
  label: z.string(),
  enabled: z.boolean(),
  priceGrossGrosze: z.number().int().nonnegative(),
});

export const DeliverySettingsSchema = z.object({
  freeShippingThresholdGrossGrosze: z.number().int().nonnegative(),
  methods: z.array(ShippingMethodOptionSchema),
});
export type DeliverySettings = z.infer<typeof DeliverySettingsSchema>;

export const SellerInfoSchema = z.object({
  companyName: z.string(),
  address: z.string(),
  nip: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
});
export type SellerInfo = z.infer<typeof SellerInfoSchema>;

export const ShopResolveResponseSchema = z.object({
  slug: z.string(),
  name: z.string(),
  logoUrl: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
  }),
  contentVersion: z.number().int(),
  seller: SellerInfoSchema,
  deliverySettings: DeliverySettingsSchema,
});
export type ShopResolveResponse = z.infer<typeof ShopResolveResponseSchema>;

export const ShopVersionResponseSchema = z.object({
  contentVersion: z.number().int(),
});

// ==========================================
// 3. SCHEMATY ZOD - KATALOG, WARIANTY, BANERY
// ==========================================
export const AvailabilityStatusSchema = z.enum(["available", "on_order", "unavailable"]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;

export const ProductImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  isMain: z.boolean(),
  sortOrder: z.number().int(),
});

export const ProductFileSchema = z.object({
  kind: z.string(),
  title: z.string(),
  url: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
});

export const VariantPriceSchema = z.object({
  nettoGrosze: z.number().int(),
  vatRate: z.number().int(),
  bruttoGrosze: z.number().int(),
});

export const CatalogVariantSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  ean: z.string(),
  colorName: z.string(),
  colorCode: z.string(),
  swatchHex: z.string(),
  availability: AvailabilityStatusSchema,
  leadTimeNote: z.string().nullable(),
  price: VariantPriceSchema,
  images: z.array(ProductImageSchema),
  files: z.array(ProductFileSchema),
});
export type CatalogVariant = z.infer<typeof CatalogVariantSchema>;

export const CatalogProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  collection: z.string().nullable(),
  category: z.string(),
  description: z.string(),
  variants: z.array(CatalogVariantSchema),
});
export type CatalogProduct = z.infer<typeof CatalogProductSchema>;

export const BannerSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  title: z.string(),
  subtitle: z.string(),
  buttonText: z.string(),
  targetUrlOrCollection: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type BannerDto = z.infer<typeof BannerSchema>;

export const CatalogCategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  count: z.number().int(),
});

export const ShopCatalogResponseSchema = z.object({
  brandSlug: z.string(),
  contentVersion: z.number().int(),
  categories: z.array(CatalogCategorySchema),
  banners: z.array(BannerSchema),
  products: z.array(CatalogProductSchema),
});
export type ShopCatalogResponse = z.infer<typeof ShopCatalogResponseSchema>;

// ==========================================
// 4. SCHEMATY ZOD - CHECKOUT I ZAMÓWIENIA B2C
// ==========================================
export const CheckoutRequestSchema = z
  .object({
    items: z
      .array(
        z.object({
          variantId: z.string().min(1),
          quantity: z.number().int().positive(),
        })
      )
      .min(1, "Koszyk nie może być pusty"),
    customer: z.object({
      firstName: z.string().min(2, "Podaj imię"),
      lastName: z.string().min(2, "Podaj nazwisko"),
      email: z.string().email("Nieprawidłowy adres e-mail"),
      phone: z.string().min(7, "Podaj poprawny numer telefonu"),
    }),
    delivery: z.object({
      method: ShippingMethodCodeSchema,
      address: z
        .object({
          street: z.string().min(2),
          postalCode: z.string().min(4),
          city: z.string().min(2),
        })
        .optional(),
      lockerCode: z.string().optional(),
    }),
    invoice: z
      .object({
        companyName: z.string().min(2, "Podaj nazwę firmy"),
        nip: z.string().regex(/^\d{10}$/, "NIP musi składać się z 10 cyfr"),
      })
      .optional()
      .nullable(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "Wymagana jest akceptacja regulaminu sklepu" }),
    }),
    notes: z.string().max(1000).optional(),
    expectedTotalGrosze: z.number().int().nonnegative(),
    returnUrl: z.string().url().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.delivery.method === "courier" && !data.delivery.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["delivery", "address"],
        message: "Adres dostawy jest wymagany dla przesyłki kurierskiej",
      });
    }
    if (data.delivery.method === "locker" && !data.delivery.lockerCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["delivery", "lockerCode"],
        message: "Kod paczkomatu jest wymagany",
      });
    }
  });
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

export const CheckoutSuccessResponseSchema = z.object({
  orderNumber: z.string(),
  orderToken: z.string().length(32),
  paymentUrl: z.string(),
  totals: z.object({
    itemsNettoGrosze: z.number().int(),
    itemsBruttoGrosze: z.number().int(),
    shippingBruttoGrosze: z.number().int(),
    totalBruttoGrosze: z.number().int(),
  }),
});

export const CheckoutConflictResponseSchema = z.object({
  code: z.enum(["UNAVAILABLE_ITEMS", "PRICE_MISMATCH"]),
  message: z.string(),
  unavailableItems: z
    .array(
      z.object({
        variantId: z.string(),
        symbol: z.string(),
        name: z.string(),
        reason: z.string(),
      })
    )
    .optional(),
  newTotals: z
    .object({
      itemsNettoGrosze: z.number().int(),
      itemsBruttoGrosze: z.number().int(),
      shippingBruttoGrosze: z.number().int(),
      totalBruttoGrosze: z.number().int(),
    })
    .optional(),
});

export const OrderStatusViewSchema = z.object({
  orderNumber: z.string(),
  status: z.string(),
  paymentStatus: z.enum(["unpaid", "paid", "failed", "cancelled"]),
  createdAt: z.string(),
  deliveryMethod: ShippingMethodCodeSchema,
  items: z.array(
    z.object({
      name: z.string(),
      colorName: z.string(),
      symbol: z.string(),
      ean: z.string(),
      quantity: z.number().int(),
      unitNettoGrosze: z.number().int(),
      vatRate: z.number().int(),
      unitBruttoGrosze: z.number().int(),
      lineBruttoGrosze: z.number().int(),
    })
  ),
  totals: z.object({
    itemsNettoGrosze: z.number().int(),
    itemsBruttoGrosze: z.number().int(),
    shippingBruttoGrosze: z.number().int(),
    totalBruttoGrosze: z.number().int(),
  }),
  customerVisibleNotes: z.array(z.string()),
});
export type OrderStatusView = z.infer<typeof OrderStatusViewSchema>;

export const OrderLookupRequestSchema = z.object({
  orderNumber: z.string().min(3, "Podaj numer zamówienia"),
  email: z.string().email("Podaj poprawny adres e-mail"),
});
