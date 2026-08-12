/** Configuración de la aplicación Express (sin arrancar el servidor). */
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import { MotorContexto } from "./domain/contexto/MotorContexto";
import { initEvents } from "./core/events/bootstrap";
import { securityHeaders, rateLimiter } from "./middlewares/security.middleware";

export function createApp() {
  const app = express();

  MotorContexto.inicializar();
  initEvents();

  // Security
  app.use(securityHeaders);
  app.use(rateLimiter);
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "50mb" }));
  app.disable("x-powered-by");

  // Routes
  app.use("/api", apiRouter);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
