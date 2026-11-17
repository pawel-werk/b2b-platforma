import { env } from "@/env";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "./schema";

export let db: any;

if (env.DB_DRIVER === "neon") {
  const pool = new NeonPool({ connectionString: env.DATABASE_URL });
  db = drizzleNeon(pool, { schema });
} else {
  const pool = new PgPool({ connectionString: env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
}
