/** Arranque del servidor. */
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { ejecutarMigracion } from "./modules/zendesk-test/CustomerMemoryMigrator";
import { initIntegrations } from "./core/integrations/bootstrap";

const app = createApp();

app.listen(env.BACKEND_PORT, async () => {
  // Migración única: poblar CustomerMemory desde v_unificado_norm
  await ejecutarMigracion();
  // Inicializar integraciones (PrinterAdapter, etc.)
  initIntegrations();
  logger.info(`API escuchando en http://localhost:${env.BACKEND_PORT}/api`);
  logger.info(`Salud:     http://localhost:${env.BACKEND_PORT}/api/health`);
  logger.info(`Salud DB:  http://localhost:${env.BACKEND_PORT}/api/health/db`);
});
