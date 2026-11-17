import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, notifications } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  // Weryfikacja CRON_SECRET z Vercela
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Idempotentne sprawdzanie i generowanie powiadomień (przykładowa logika SQL)
  // Szukamy zamówień 'unpaid', których createdAt + paymentTerm < teraz
  // I sprawdzamy LEFT JOIN z notifications, by nie powielać powiadomień tego samego dnia
  try {
    await db.execute(sql`
      INSERT INTO notifications (id, type, title, content, related_id)
      SELECT gen_random_uuid(), 'payment_overdue', 'Płatność przeterminowana', 
             'Zamówienie ' || order_number || ' zalega z płatnością.', id
      FROM orders o
      WHERE o.payment_status = 'unpaid' 
        AND o.payment_term != 'prepayment'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.related_id = o.id 
            AND n.type = 'payment_overdue' 
            AND n.created_at::date = CURRENT_DATE
        )
    `);
    return NextResponse.json({ success: true, message: 'Monity wygenerowane idempotentnie.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
