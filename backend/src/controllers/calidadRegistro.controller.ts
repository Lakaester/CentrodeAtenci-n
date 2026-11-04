import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { calidadRegistroService } from "../services/calidadRegistro.service";
import type { DashboardFilters } from "../types";

const granularidadSchema = z.enum(["semana", "mes", "trimestre"]).default("mes");

export const calidadRegistroController = {
  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const parsed = granularidadSchema.safeParse(req.query.granularidad);
      if (!parsed.success) {
        return res.status(400).json({
          ok: false,
          error: "Granularidad inválida",
          detail: { granularidad: ["Debe ser semana, mes o trimestre"] },
        });
      }
      const data = await calidadRegistroService.obtener(filters, parsed.data);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },
};
