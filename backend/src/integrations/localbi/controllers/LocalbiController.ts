import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { LocalbiService } from "../services/LocalbiService";
import { actividadCopeService } from "../services/ActividadCopeService";
import { soporteOnlineService } from "../services/SoporteOnlineService";
import { historiaLocalService } from "../services/HistoriaLocalService";

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

  /** GET /actividad?dominios=a,b,c — actividad real de COPE (v_unificado_norm) por dominios. */
  async actividad(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.query.dominios as string | undefined;
      const dominios = (raw ?? "").split(",").map((d) => d.trim()).filter(Boolean);
      if (dominios.length === 0) {
        return res.status(400).json({ ok: false, error: "dominios requerido (lista separada por comas)" });
      }
      if (dominios.length > 100) {
        return res.status(400).json({ ok: false, error: "demasiados dominios (máx 100)" });
      }
      const data = await actividadCopeService.obtenerActividadPorDominios(dominios, 30);
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  /** GET /actividad-local?ids=a,b,c — resumen de actividad por localbi_id (Nivel 1). */
  async actividadLocal(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.query.ids as string | undefined;
      const ids = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) return res.status(400).json({ ok: false, error: "ids requerido (lista separada por comas)" });
      if (ids.length > 500) return res.status(400).json({ ok: false, error: "demasiados localbi_ids (máx 500)" });
      const data = await actividadCopeService.obtenerActividadPorLocales(ids);
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  /** GET /soporte?dominios=a,b,c&periodo=30 — Soporte en Línea (public.incidencias) por dominios. */
  async soporte(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.query.dominios as string | undefined;
      const dominios = (raw ?? "").split(",").map((d) => d.trim()).filter(Boolean);
      if (dominios.length === 0) {
        return res.status(400).json({ ok: false, error: "dominios requerido (lista separada por comas)" });
      }
      if (dominios.length > 100) {
        return res.status(400).json({ ok: false, error: "demasiados dominios (máx 100)" });
      }
      const periodo = (req.query.periodo as string | undefined) || undefined;
      const data = await soporteOnlineService.obtenerSoporteOnline(dominios, periodo);
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  /** GET /historia/:unidad/local/:localbiId — Historia Clínica de un LOCAL específico. */
  async historiaLocal(req: Request, res: Response, next: NextFunction) {
    try {
      const unidad = decodeURIComponent(req.params.unidadNegocio);
      const localbiId = req.params.localbiId?.trim();
      if (!unidad) return res.status(400).json({ ok: false, error: "unidad de negocio requerida" });
      if (!localbiId) return res.status(400).json({ ok: false, error: "localbiId requerido" });

      const fichaResult = await service.obtenerHistoria(unidad);
      if (fichaResult.status !== "success" && fichaResult.status !== "warning") {
        return res.status(502).json({ ok: false, status: fichaResult.status, error: "no se pudo cargar la ficha LocalBI" });
      }
      const ficha = fichaResult.data;
      const data = await historiaLocalService.getHistoriaLocal(ficha, localbiId);
      if (!data) return res.status(404).json({ ok: false, error: "local no encontrado en la unidad" });
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },
};
