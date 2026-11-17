import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DB_DRIVER: z.enum(["neon", "pg"]),
  AUTH_SECRET: z.string(),
  AUTH_URL: z.string().url().optional(),
  STORAGE_DRIVER: z.enum(["local", "vercel-blob"]),
  UPLOAD_DIR: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CRON_SECRET: z.string(),
  ALLOWED_ORIGINS: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string(),
});

export const env = envSchema.parse(process.env);
