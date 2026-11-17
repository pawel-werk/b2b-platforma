import 'dotenv/config';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function drop() {
  await pool.query(`
    DROP TABLE IF EXISTS brands, products, product_images, product_files, companies, company_users, company_brand_discounts, company_product_prices, company_change_requests, delivery_methods, orders, order_items, order_notes, order_sequences, notifications, staff_users, settings, b2b_customers CASCADE;
    DROP TYPE IF EXISTS company_status, payment_term, change_request_status, delivery_type, order_source, fulfillment_status, payment_status, note_author, price_source CASCADE;
  `);
  console.log('✅ Baza wyzerowana z poziomu SQL!');
  process.exit(0);
}
drop();
