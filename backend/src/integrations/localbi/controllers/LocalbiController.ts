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

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

function fechaValida(v: string): boolean {
  if (!FECHA_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Fecha actual en America/Lima como YYYY-MM-DD. */
function fechaLimaHoy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Resta días calendario a un YYYY-MM-DD sin cruces de zona horaria. */
function restarDias(ymd: string, dias: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - dias);
  return dt.toISOString().slice(0, 10);
}

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

  /** GET /search-clientes?busqueda=... — Búsqueda a nivel dominio (para /clientes COPE). */
  async searchClientes(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      }
      const result = await service.buscarClientes(parsed.data.busqueda, parsed.data.pagina, parsed.data.limite);

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

  /** GET /actividad-cose?dominios=a,b,c&desde=YYYY-MM-DD&hasta=YYYY-MM-DD — agregado COSE. */
  async actividadCose(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.query.dominios as string | undefined;
      const dominios = (raw ?? "").split(",").map((d) => d.trim()).filter(Boolean);
      if (dominios.length === 0) {
        return res.status(400).json({ ok: false, error: "dominios requerido (lista separada por comas)" });
      }
      if (dominios.length > 100) {
        return res.status(400).json({ ok: false, error: "demasiados dominios (máx 100)" });
      }

      const desdeRaw = typeof req.query.desde === "string" ? req.query.desde.trim() : undefined;
      const hastaRaw = typeof req.query.hasta === "string" ? req.query.hasta.trim() : undefined;
      if (desdeRaw && !fechaValida(desdeRaw)) {
        return res.status(400).json({ ok: false, error: "desde inválido (formato YYYY-MM-DD)" });
      }
      if (hastaRaw && !fechaValida(hastaRaw)) {
        return res.status(400).json({ ok: false, error: "hasta inválido (formato YYYY-MM-DD)" });
      }

      const hasta = hastaRaw ?? fechaLimaHoy();
      const desde = desdeRaw ?? restarDias(hasta, 29);
      if (desde > hasta) {
        return res.status(400).json({ ok: false, error: "desde no puede ser mayor que hasta" });
      }

      const limiteRaw = req.query.limite;
      const limite = limiteRaw === undefined ? 200 : Number(limiteRaw);
      if (!Number.isInteger(limite) || limite < 1 || limite > 500) {
        return res.status(400).json({ ok: false, error: "limite debe ser un entero entre 1 y 500" });
      }

      const canalRaw = typeof req.query.canal === "string" ? req.query.canal.trim().toUpperCase() : undefined;
      if (canalRaw && !["WHATSAPP", "CORREO"].includes(canalRaw)) {
        return res.status(400).json({ ok: false, error: "canal inválido (WHATSAPP o CORREO)" });
      }

      const estadoRaw = typeof req.query.estado === "string" ? req.query.estado.trim() : undefined;
      if (estadoRaw && !["cerrado", "resuelto", "abierto", "sin_mapear"].includes(estadoRaw)) {
        return res.status(400).json({ ok: false, error: "estado inválido (cerrado, resuelto, abierto, sin_mapear)" });
      }

      const localbi_id = typeof req.query.localbi_id === "string" ? req.query.localbi_id.trim() : undefined;
      if (localbi_id && localbi_id.length > 200) {
        return res.status(400).json({ ok: false, error: "localbi_id demasiado largo" });
      }
      const asesor = typeof req.query.asesor === "string" ? req.query.asesor.trim() : undefined;
      if (asesor && asesor.length > 100) {
        return res.status(400).json({ ok: false, error: "asesor demasiado largo" });
      }
      const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
      if (q && q.length > 100) {
        return res.status(400).json({ ok: false, error: "q demasiado largo (máx 100)" });
      }

      const data = await actividadCopeService.obtenerActividadCose(dominios, {
        desde,
        hasta,
        limite,
        localbi_id: localbi_id || undefined,
        canal: canalRaw,
        asesor: asesor || undefined,
        estado: estadoRaw,
        q: q || undefined,
      });

      res.json({ ok: true, status: "success", data, warnings: [] });
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
