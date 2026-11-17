import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

if (process.env.ALLOW_SEED !== "true") {
  console.error("❌ ZABEZPIECZENIE: Uruchomienie seedu wymaga jawnego ustawienia zmiennej ALLOW_SEED=true.");
  process.exit(1);
}

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

function generateValidEan13(prefix: string): string {
  const base = prefix.padEnd(12, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

function generateValidNip(): string {
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  let sum = base.reduce((acc, val, idx) => acc + val * weights[idx], 0);
  let check = sum % 11;
  if (check === 10) return generateValidNip();
  return base.join('') + check;
}

async function runSeed() {
  console.log('🌱 Rozpoczynam czyszczenie bazy danych (TRUNCATE CASCADE)...');
  
  // Czyszczenie - bezpieczne narzędzie idempotencji
  const tables = ['brands', 'products', 'companies', 'company_users', 'company_brand_discounts', 'delivery_methods', 'orders', 'order_items', 'order_notes', 'notifications', 'staff_users', 'settings'];
  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
  }

  console.log('✅ Baza wyczyszczona. Generuję dane testowe...');

  // 1. Staff Admin
  const adminEmail = process.env.SEED_ADMIN_EMAIL!;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD!;
  const adminHash = await bcrypt.hash(adminPassword, 10);
  
  await db.insert(schema.staffUsers).values({
    email: adminEmail,
    passwordHash: adminHash,
    name: 'Główny Administrator'
  });

  // 2. Marki
  const brandsData = [
    { name: 'Fulgor Milano', slug: 'fulgor-milano', prefix: 'FUL', theme: { primary: '#1a1a1a' } },
    { name: 'Galvamet', slug: 'galvamet', prefix: 'GAL', theme: { primary: '#0055a4' } },
    { name: 'Temptech', slug: 'temptech', prefix: 'TEM', theme: { primary: '#8b0000' } },
    { name: 'HITACHI', slug: 'hitachi', prefix: 'HIT', theme: { primary: '#e60012' } },
    { name: 'gorenje', slug: 'gorenje', prefix: 'GOR', theme: { primary: '#ff6600' } }
  ];

  const insertedBrands = await db.insert(schema.brands).values(brandsData).returning();

  // 3. Produkty dla każdej marki (po 7)
  const productCategories: Record<string, string> = {
    FUL: 'Piekarnik do zabudowy',
    GAL: 'Okap wyspowy',
    TEM: 'Chłodziarka do wina',
    HIT: 'Lodówka Multidoor',
    GOR: 'Pralka automatyczna'
  };

  const productsToInsert: Array<{ brandId: string; symbol: string; ean: string; name: string; description: string; retailPriceNet: number; vatRate: number; netNetPrice: number | null; isAvailable: boolean }> = [];
  for (const brand of insertedBrands) {
    for (let i = 1; i <= 7; i++) {
      const eanPrefix = `590${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      const isAvailable = i !== 7; // Ostatni niedostępny
      const hasNetNet = i === 2; // Jeden produkt z super ceną

      productsToInsert.push({
        brandId: brand.id,
        symbol: `${brand.prefix}-${i.toString().padStart(3, '0')}`,
        ean: generateValidEan13(eanPrefix),
        name: `${productCategories[brand.prefix]} Model X${i}00`,
        description: `Wysokiej klasy ${productCategories[brand.prefix].toLowerCase()} marki ${brand.name}.`,
        retailPriceNet: 100000 * i, // Od 1000 do 7000 PLN netto
        vatRate: 23,
        netNetPrice: hasNetNet ? (100000 * i) - 20000 : null, // O 200 PLN taniej
        isAvailable,
      });
    }
  }
  await db.insert(schema.products).values(productsToInsert);

  // 4. Firmy (Pending i Active)
  const demoHash = await bcrypt.hash(process.env.SEED_DEMO_PASSWORD!, 10);

  // Pending
  await db.insert(schema.companies).values([
    { status: 'pending', name: 'Dom i Ogród Lublin sp. z o.o.', nip: generateValidNip(), street: 'Kwiatowa 1', zipCode: '20-001', city: 'Lublin', contactPerson: 'Jan Kowalski', contactEmail: 'kontakt@domiogrod.pl', contactPhone: '111222333' },
    { status: 'pending', name: 'Salon AGD Gdynia sp. j.', nip: generateValidNip(), street: 'Morska 50', zipCode: '81-001', city: 'Gdynia', contactPerson: 'Anna Nowak', contactEmail: 'biuro@agdgdynia.pl', contactPhone: '444555666' }
  ]);

  // Active - Sklep Domar Wrocław
  const domar = await db.insert(schema.companies).values({
    status: 'active', name: 'Sklep Domar Wrocław', nip: generateValidNip(), street: 'Braniborska 14', zipCode: '53-680', city: 'Wrocław', contactPerson: 'Piotr Wiśniewski', contactEmail: 'sklep@domar.pl', contactPhone: '777888999', paymentTerm: 'd30', limitNet: 2000000, approvedAt: new Date()
  }).returning();

  await db.insert(schema.companyUsers).values({ companyId: domar[0].id, email: 'sklep@domar.pl', passwordHash: demoHash });
  
  // Rabaty Domar (20% = 2000 pb na wszystko)
  const domarDiscounts = insertedBrands.map(b => ({ companyId: domar[0].id, brandId: b.id, discountPb: 2000 }));
  await db.insert(schema.companyBrandDiscounts).values(domarDiscounts);

  // Active - Mega Market
  const mega = await db.insert(schema.companies).values({
    status: 'active', name: 'Mega Market', nip: generateValidNip(), street: 'Wielka 10', zipCode: '00-001', city: 'Warszawa', contactPerson: 'Krzysztof Mega', contactEmail: 'zakupy@megamarket.pl', contactPhone: '000111222', paymentTerm: 'prepayment', limitNet: 500000, approvedAt: new Date()
  }).returning();

  await db.insert(schema.companyUsers).values({ companyId: mega[0].id, email: 'zakupy@megamarket.pl', passwordHash: demoHash });
  
  // Rabaty Mega (5% = 500 pb na wszystko)
  const megaDiscounts = insertedBrands.map(b => ({ companyId: mega[0].id, brandId: b.id, discountPb: 500 }));
  await db.insert(schema.companyBrandDiscounts).values(megaDiscounts);

  // 5. Przykładowe zamówienie i notyfikacja
  const order = await db.insert(schema.orders).values({
    orderNumber: 'HUR/2026/0001',
    source: 'b2b',
    companyId: domar[0].id,
    customerData: { name: domar[0].name, nip: domar[0].nip },
    fulfillmentStatus: 'new',
    paymentStatus: 'unpaid',
    sumNet: 400000,
    sumVat: 92000,
    sumGross: 492000,
  }).returning();

  await db.insert(schema.orderNotes).values({
    orderId: order[0].id,
    author: 'customer',
    content: 'Proszę o kontakt przed wysyłką.',
  });

  await db.insert(schema.notifications).values({
    type: 'new_order',
    title: 'Nowe zamówienie B2B',
    content: `Firma ${domar[0].name} złożyła zamówienie.`,
    link: `/panel/zamowienia/${order[0].id}`,
  });

  console.log('✅ Seed zakończony sukcesem!');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Błąd podczas seedowania:', err);
  process.exit(1);
});