/** Responde 404 para rutas inexistentes. */
import { Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ ok: false, error: `Ruta no encontrada: ${req.originalUrl}` });
}
