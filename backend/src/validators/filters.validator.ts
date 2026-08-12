/**
 * Middleware que valida y normaliza los filtros de la query.
 * Si algo está mal, responde 400 con detalle. Si está bien,
 * deja los filtros limpios en req.filters para el controller.
 */
import { Request, Response, NextFunction } from "express";
import { filtersSchema } from "../dto/filters.dto";

export function validateFilters(req: Request, res: Response, next: NextFunction) {
  const result = filtersSchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      ok: false,
      error: "Filtros inválidos",
      detail: result.error.flatten().fieldErrors,
    });
  }
  // Adjuntamos los filtros validados al request.
  (req as Request & { filters: unknown }).filters = result.data;
  next();
}
