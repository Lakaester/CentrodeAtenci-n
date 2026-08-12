/** Rutas de salud: sirven para comprobar que la API y la base viven. */
import { Router, Request, Response } from "express";
import { unificadoRepository } from "../repositories/unificado.repository";

export const healthRouter = Router();

// GET /api/health  -> ¿vive la API?
healthRouter.get("/", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "backend-bi", time: new Date().toISOString() });
});

// GET /api/health/db  -> ¿responde PostgreSQL?
healthRouter.get("/db", async (_req: Request, res: Response) => {
  try {
    await unificadoRepository.ping();
    res.json({ ok: true, db: "conectada" });
  } catch {
    res.status(503).json({ ok: false, db: "sin conexión" });
  }
});
