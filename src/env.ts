import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("Musi być prawidłowym adresem URL do bazy danych"),
  MAIN_HOST: z.string().min(1, "Wymagany główny host"),
  AUTH_SECRET: z.string().min(1, "Wymagany sekret autoryzacji"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  // NAPRAWIONE: przekazujemy wartość logiczną (false) zamiast tekstu ("false")
  MAIL_SEND_ENABLED: z.string().optional().transform((val) => val === "true").default(false),
  CRON_SECRET: z.string().min(1, "Wymagany sekret do crona"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);