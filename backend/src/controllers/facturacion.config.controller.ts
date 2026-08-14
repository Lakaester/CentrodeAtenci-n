import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { facturacionConfigService } from "../services/facturacion.config.service";
import { DomainError } from "../core/errors/types";

const crearSchema = z.object({ nombre: z.string().min(1) });
const actualizarSchema = z.object({
  nombre: z.string().min(1).optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
});

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "DUPLICADO") return 409;
    if (err.code === "NOMBRE_REQUERIDO") return 400;
    if (err.code === "NO_ENCONTRADO") return 404;
    return 400;
  }
  return 500;
}

function handle(res: Response, err: unknown) {
  res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error" });
}

export const facturacionConfigController = {
  async listarEstados(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await facturacionConfigService.listarEstados() }); }
    catch (err) { next(err); }
  },

  async listarSubcategorias(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await facturacionConfigService.listarSubcategorias() }); }
    catch (err) { next(err); }
  },

  async crearEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Nombre requerido" });
      res.status(201).json({ ok: true, data: await facturacionConfigService.crearEstado(parsed.data.nombre) });
    } catch (err) { handle(res, err); }
  },

  async crearSubcategoria(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Nombre requerido" });
      res.status(201).json({ ok: true, data: await facturacionConfigService.crearSubcategoria(parsed.data.nombre) });
    } catch (err) { handle(res, err); }
  },

  async actualizarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actualizarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      res.json({ ok: true, data: await facturacionConfigService.actualizarEstado(req.params.id, parsed.data) });
    } catch (err) { handle(res, err); }
  },

  async actualizarSubcategoria(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actualizarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      res.json({ ok: true, data: await facturacionConfigService.actualizarSubcategoria(req.params.id, parsed.data) });
    } catch (err) { handle(res, err); }
  },
};
