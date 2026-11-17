import 'dotenv/config';
import { db } from './src/db';
import { orders, companies } from './src/db/schema';
import { nextOrderNumber } from './src/lib/orders';

async function run() {
  const activeCompanies = await db.select().from(companies).limit(1);
  if (!activeCompanies.length) {
    console.log("Brak aktywnych firm, pomijam seed zamówień.");
    process.exit(0);
  }
  
  const company = activeCompanies[0];
  const statuses: ("new" | "in_progress" | "partially_completed" | "completed" | "cancelled")[] = 
    ["new", "in_progress", "partially_completed", "completed", "cancelled"];

  console.log("Generowanie zamówień demo dla zakładek...");
  
  for (const status of statuses) {
    const num = await nextOrderNumber("HUR"); // Wywołanie atomowej funkcji
    await db.insert(orders).values({
      orderNumber: num,
      source: "b2b",
      companyId: company.id,
      customerData: { name: company.name, nip: company.nip },
      fulfillmentStatus: status,
      paymentStatus: "unpaid",
      paymentTerm: "d14",
      sumNet: 150000,
      sumVat: 34500,
      sumGross: 184500,
    });
  }
  
  // Przykładowe zamówienie ze sklepu (PREFIKS)
  const shopNum = await nextOrderNumber("FGM");
  await db.insert(orders).values({
    orderNumber: shopNum,
    source: "shop",
    companyId: null,
    customerData: { name: "Jan Kowalski (B2C)" },
    fulfillmentStatus: "new",
    paymentStatus: "paid",
    paymentTerm: "prepayment",
    sumNet: 45000,
    sumVat: 10350,
    sumGross: 55350,
  });

  console.log("✅ Wstrzyknięto bazę testowych zamówień dla każdego statusu!");
  process.exit(0);
}
run();
