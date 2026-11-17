"use server";
import { db } from "@/db";
import { products, companies, companyBrandDiscounts, companyProductPrices, orders, orderItems, orderNotes, notifications } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { calculateB2BPrice } from "@/lib/pricing";
import { nextOrderNumber } from "@/lib/orders";
import { revalidatePath } from "next/cache";

export async function fetchCartData(cart: Record<string, number>) {
  const session = await auth();
  if (!session || session.user.role !== "company") throw new Error("Unauthorized");
  const companyId = session.user.companyId!;

  const productIds = Object.keys(cart);
  if (productIds.length === 0) return { items: [], summary: { net: 0, vat: 0, gross: 0 }, limit: null, paymentTerm: "prepayment", companyName: "", companyNip: "" };

  const compRes = await db.select().from(companies).where(eq(companies.id, companyId));
  const company = compRes[0];

  const rawProducts = await db.select().from(products).where(inArray(products.id, productIds));
  const discounts = await db.select().from(companyBrandDiscounts).where(eq(companyBrandDiscounts.companyId, companyId));
  const customPrices = await db.select().from(companyProductPrices).where(eq(companyProductPrices.companyId, companyId));

  let sumNet = 0, sumVat = 0, sumGross = 0;

  const items = rawProducts.map(p => {
    const qty = cart[p.id] || 1;
    const brandDiscount = discounts.find(d => d.brandId === p.brandId)?.discountPb || 0;
    const cp = customPrices.find(c => c.productId === p.id)?.priceNet || null;
    
    const pricing = calculateB2BPrice({
      retailPriceNet: p.retailPriceNet,
      vatRate: p.vatRate,
      netNetPrice: p.netNetPrice,
      customPriceNet: cp,
      discountPb: brandDiscount
    });

    const itemNet = pricing.finalNet * qty;
    const itemGross = pricing.finalGross * qty;
    const itemVat = itemGross - itemNet;

    sumNet += itemNet; sumVat += itemVat; sumGross += itemGross;

    return { product: p, qty, pricing, itemNet, itemGross };
  });

  let limitData = null;
  if (company.limitNet !== null) {
    const usedRes = await db.execute(sql`SELECT COALESCE(SUM(sum_net), 0) as used FROM orders WHERE company_id = ${companyId} AND payment_status != 'paid'`);
    const used = parseInt((usedRes as any).rows ? (usedRes as any).rows[0].used : (usedRes as any)[0].used) || 0;
    limitData = {
      total: company.limitNet,
      used: used,
      remaining: company.limitNet - used,
      afterOrder: company.limitNet - used - sumNet
    };
  }

  return { 
    items, 
    summary: { net: sumNet, vat: sumVat, gross: sumGross }, 
    limit: limitData, 
    paymentTerm: company.paymentTerm,
    companyName: company.name,
    companyNip: company.nip
  };
}

export async function placeB2BOrder(cart: Record<string, number>, note: string) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "company") {
      return { success: false, error: "Brak aktywnej sesji. Zaloguj się ponownie." };
    }
    const companyId = session.user.companyId!;
    
    const data = await fetchCartData(cart);
    if (data.items.length === 0) return { success: false, error: "Koszyk jest pusty." };

    if (data.limit && data.limit.afterOrder < 0) {
      return { success: false, error: "Przekroczono dostępny limit kupiecki! Opłać zaległe faktury." };
    }

    const orderNum = await nextOrderNumber("HUR");
    
    // Twarde przypisanie danych firmy do zamówienia (chroni przed błędami serializacji JSON)
    const newOrder = await db.insert(orders).values({
      orderNumber: orderNum,
      source: "b2b",
      companyId: companyId,
      customerData: { name: data.companyName, nip: data.companyNip },
      fulfillmentStatus: "new",
      paymentStatus: "unpaid",
      paymentTerm: data.paymentTerm as any,
      sumNet: data.summary.net,
      sumVat: data.summary.vat,
      sumGross: data.summary.gross,
      customerNote: note || null
    }).returning();

    const orderId = newOrder[0].id;

    const orderItemsData = data.items.map(item => ({
      orderId: orderId,
      symbol: item.product.symbol,
      name: item.product.name,
      quantity: item.qty,
      unitPriceNet: item.pricing.finalNet,
      vatRate: item.product.vatRate,
      discountPb: 0, 
      priceSource: item.pricing.priceSource as any,
      sumNet: item.itemNet,
      sumVat: item.itemGross - item.itemNet,
      sumGross: item.itemGross
    }));

    await db.insert(orderItems).values(orderItemsData);

    if (note && note.trim().length > 0) {
      await db.insert(orderNotes).values({ orderId, author: "customer", content: note.trim(), isVisibleToCustomer: true });
    }

    await db.insert(notifications).values({
      type: "new_order",
      title: "Nowe zamówienie B2B",
      content: `Firma ${data.companyName} złożyła zamówienie ${orderNum} na kwotę ${(data.summary.gross / 100).toFixed(2)} PLN`,
      relatedId: orderId
    });

    revalidatePath("/panel/zamowienia");
    return { success: true, orderId };
  } catch (error: any) {
    console.error("🔥 BŁĄD SKŁADANIA ZAMÓWIENIA:", error);
    return { success: false, error: error.message || "Krytyczny błąd bazy danych." };
  }
}
