import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  WHATSAPP_API_URL: z.string().url(),
  WHATSAPP_API_KEY: z.string().min(1),
  RECIPIENT_PHONE: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:5173"),
  CRON_SCHEDULE: z.string().default("0 10 * * *"),
  TIMEZONE: z.string().default("America/Argentina/Buenos_Aires"),
});

export const config = envSchema.parse(process.env);
