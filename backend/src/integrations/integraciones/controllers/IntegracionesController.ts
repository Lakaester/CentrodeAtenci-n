import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { IntegracionesService } from "../services/IntegracionesService";

const service = new IntegracionesService();

const dominioParamsSchema = z.object({
  dominio: z.string().min(1),
});

const busquedaBodySchema = z.object({
  dominio: z.string().min(1),
  pagina: z.number().int().positive().default(1),
  registros: z.number().int().positive().max(100).default(20),
  totalregistros: z.number().int().default(0),
  suscripciones: z.array(z.string()).default([]),
  integraciones: z.array(z.string()).default([]),
  storeIds: z.array(z.string()).default([]),
  estados: z.array(z.string()).default([]),
  fechas: z.array(z.string()).default([]),
});

function toHttp(err: unknown): number {
  if (err instanceof Error && "status" in err) return (err as { status: number }).status;
  return 500;
}

export const integracionesController = {
  /** GET /api/integraciones/dominio/:dominio — integraciones de un dominio. */
  async porDominio(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = dominioParamsSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Dominio requerido." });
      const result = await service.obtenerIntegracionesPorDominio(parsed.data.dominio);
      if (result.status === "success") return res.json({ ok: true, data: result.data });
      return res.status(toHttp(result)).json({ ok: false, status: result.status, error: result.mensaje });
    } catch (err) { next(err); }
  },

  /** POST /api/integraciones/pedidos — búsqueda de pedidos (dominio requerido para seguridad). */
  async buscarPedidos(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = busquedaBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Filtros inválidos. Se requiere dominio." });
      const { dominio, ...filtros } = parsed.data;
      const result = await service.buscarPedidos(filtros, dominio);
      if (result.status === "success") return res.json({ ok: true, data: result.data });
      return res.status(toHttp(result)).json({ ok: false, status: result.status, error: result.mensaje });
    } catch (err) { next(err); }
  },
};
