/**
 * Carga y valida las variables de entorno al arrancar.
 * Si falta algo crítico, la app falla de inmediato con un
 * mensaje claro (mejor fallar temprano que a mitad de uso).
 */
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  BACKEND_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatorio"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOCALBI_BASE_URL: z.string().default("https://restaurantpe.restaurant.pe/restaurant"),
  LOCALBI_MODE: z.enum(["public", "private"]).default("private"),
  LOCALBI_TOKEN: z.string().default(""),
  BOOTSTRAP_ADMIN_EMAIL: z.string().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Error en variables de entorno:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
