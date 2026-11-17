import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function nextOrderNumber(sourceCode: string): Promise<string> {
  const year = new Date().getFullYear();

  // Zabezpieczenie schematu - dodajemy unikalny indeks, niezbędny do atomowego ON CONFLICT
  try {
    await db.execute(sql`ALTER TABLE order_sequences ADD CONSTRAINT unique_source_year UNIQUE (source_code, year);`);
  } catch (e) {
    // Ignorujemy, jeśli constraint już istnieje
  }

  // Atomowa operacja z blokadą wiersza - 100% odporności na wyścigi w neon-http
  const result = await db.execute(sql`
    INSERT INTO order_sequences (id, source_code, year, last_number)
    VALUES (gen_random_uuid(), ${sourceCode}, ${year}, 1)
    ON CONFLICT (source_code, year) DO UPDATE 
    SET last_number = order_sequences.last_number + 1
    RETURNING last_number;
  `);

  const raw = (result as any).rows ? (result as any).rows[0] : (result as any)[0];
  const lastNumber = raw.last_number;

  const formattedNum = lastNumber.toString().padStart(4, "0");
  return `${sourceCode}/${year}/${formattedNum}`;
}
