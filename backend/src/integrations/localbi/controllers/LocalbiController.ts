import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { LocalbiService } from "../services/LocalbiService";

const service = new LocalbiService();

const searchQuerySchema = z.object({
  busqueda: z.string().default(""),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(500).default(50),
});

const historiaParamsSchema = z.object({
  unidadNegocio: z.string().min(1, "unidad de negocio requerida"),
});

export const localbiController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      }
      const result = await service.buscarUnidades(parsed.data.busqueda, parsed.data.pagina, parsed.data.limite);

      switch (result.status) {
        case "success":
        case "warning":
          return res.json({ ok: true, status: result.status, data: result.data, warnings: result.warnings ?? [] });
        case "error":
          return res.json({ ok: false, status: "error", mensajes: result.mensajes });
        case "not_configured":
          return res.status(503).json({ ok: false, status: "not_configured", error: result.mensaje });
        case "unavailable":
          return res.status(502).json({ ok: false, status: "unavailable", error: result.mensaje });
        default:
          return res.status(500).json({ ok: false, error: "Estado desconocido" });
      }
    } catch (err) {
      next(err);
    }
  },

  async historia(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = historiaParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "unidad de negocio requerida" });
      }
      const result = await service.obtenerHistoria(decodeURIComponent(parsed.data.unidadNegocio));

      switch (result.status) {
        case "success":
        case "warning":
          return res.json({ ok: true, status: result.status, data: result.data, warnings: result.warnings ?? [] });
        case "error":
          return res.json({ ok: false, status: "error", mensajes: result.mensajes });
        case "not_configured":
          return res.status(503).json({ ok: false, status: "not_configured", error: result.mensaje });
        case "unavailable":
          return res.status(502).json({ ok: false, status: "unavailable", error: result.mensaje });
        default:
          return res.status(500).json({ ok: false, error: "Estado desconocido" });
      }
    } catch (err) {
      next(err);
    }
  },

  async health(req: Request, res: Response, next: NextFunction) {
    try {
      const estado = service.estado();
      res.json({ ok: true, ...estado });
    } catch (err) {
      next(err);
    }
  },
};
