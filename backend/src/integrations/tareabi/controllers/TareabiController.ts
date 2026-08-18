import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TareabiService } from "../services/TareabiService";

const service = new TareabiService();

const logsParamsSchema = z.object({
  tareabiId: z.string().min(1),
  ticketbiId: z.string().min(1),
});

const detalleParamsSchema = z.object({
  tareabiId: z.string().min(1),
});

function toHttp(result: { status: string }): number {
  if (result.status === "unavailable") return 502;
  if (result.status === "error") return 502;
  return 500;
}

export const tareabiController = {
  /** POST /logs/:tareabiId/:ticketbiId — logs de una tarea + su ticket. */
  async logs(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = logsParamsSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "tareabiId y ticketbiId requeridos" });
      const result = await service.obtenerLogsPorTicket(parsed.data);
      if (result.status === "success") return res.json({ ok: true, data: result.data });
      return res.status(toHttp(result)).json({ ok: false, status: result.status, error: result.mensaje });
    } catch (err) { next(err); }
  },

  /** GET /detalle/:tareabiId — detalle de una tarea. */
  async detalle(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = detalleParamsSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "tareabiId requerido" });
      const result = await service.obtenerDetalle(parsed.data.tareabiId);
      if (result.status === "success") return res.json({ ok: true, data: result.data });
      return res.status(toHttp(result)).json({ ok: false, status: result.status, error: result.mensaje });
    } catch (err) { next(err); }
  },

  /** GET /estados — catálogo de estados de tareas. */
  async estados(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.obtenerEstados();
      if (result.status === "success") return res.json({ ok: true, data: result.data });
      return res.status(toHttp(result)).json({ ok: false, status: result.status, error: result.mensaje });
    } catch (err) { next(err); }
  },
};
