/**
 * Cliente único de Prisma (patrón singleton) para reutilizar
 * el pool de conexiones en toda la app.
 *
 * Configuración de pool:
 *  - connection_limit: máximo de conexiones simultáneas (default 10).
 *  - pool_timeout: segundos esperando una conexión libre antes de fallar.
 *  - connect_timeout: segundos para conectar al servidor antes de fallar.
 *
 * Prisma reutiliza conexiones del pool y reconecta automáticamente
 * si la conexión se pierde. Sin embargo, si el servidor PostgreSQL
 * cierra una conexión idle (P1017), Prisma lanza un error que debe
 * ser capturado por el middleware/ruta que lo invoca.
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ["warn", "error"],
  errorFormat: "minimal",
});
