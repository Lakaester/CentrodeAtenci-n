/**
 * Cliente único de Prisma (patrón singleton) para reutilizar
 * el pool de conexiones en toda la app.
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ["warn", "error"],
});
