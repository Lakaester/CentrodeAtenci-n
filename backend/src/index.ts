/** Arranque del servidor. */
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { ejecutarMigracion } from "./modules/zendesk-test/CustomerMemoryMigrator";
import { initIntegrations } from "./core/integrations/bootstrap";
import { authService } from "./services/auth.service";
import { prisma } from "./repositories/prisma";

const app = createApp();

// ─── Global error handlers ────────────────────────────────────
// Express 4 NO captura errores de promises en middlewares async.
// Si un middleware async lanza un error no capturado, Node.js lo
// trata como unhandledRejection. En Node 15+ esto MATA el proceso.
// Estos handlers evitan que el proceso muera y registran el error.
process.on("unhandledRejection", (reason: unknown) => {
  logger.error("[UNHANDLED_REJECTION]", reason instanceof Error ? reason.stack ?? reason.message : reason);
});
process.on("uncaughtException", (err: Error) => {
  logger.error("[UNCAUGHT_EXCEPTION]", err.stack ?? err.message);
  // No exit — dejar que el servidor siga atendiendo otros requests.
});
// ──────────────────────────────────────────────────────────────

let server: ReturnType<typeof app.listen> | null = null;

async function start() {
  server = app.listen(env.BACKEND_PORT, async () => {
    try {
      await ejecutarMigracion();
    } catch (err: any) {
      logger.error("Error en CustomerMemoryMigrator (no crítico): " + err.message);
    }
    initIntegrations();
    try {
      const creado = await authService.bootstrapAdmin();
      if (creado) logger.info("Administrador inicial creado desde variables de entorno.");
    } catch (err: any) {
      logger.error("Error en bootstrapAdmin (no crítico): " + err.message);
    }
    logger.info(`API escuchando en http://localhost:${env.BACKEND_PORT}/api`);
    logger.info(`Salud:     http://localhost:${env.BACKEND_PORT}/api/health`);
    logger.info(`Salud DB:  http://localhost:${env.BACKEND_PORT}/api/health/db`);
  });
}

// ─── Graceful shutdown ────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info(`Recibido ${signal}. Cerrando conexiones...`);
  if (server) server.close();
  try {
    await prisma.$disconnect();
  } catch { /* ignore */ }
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
// ──────────────────────────────────────────────────────────────

start();
