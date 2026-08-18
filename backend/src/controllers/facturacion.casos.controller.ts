import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { facturacionCasosService } from "../services/facturacion.casos.service";
import { DomainError } from "../core/errors/types";
import { AuthedRequest } from "../middlewares/auth.middleware";

function usuarioDe(req: Request): string | null {
  const auth = (req as AuthedRequest).auth;
  return auth?.nombre ?? null;
}

const asignarSchema = z.object({ asesor: z.string().min(1) });
const estadoSchema = z.object({ estado: z.string().min(1) });
const snapshotSchema = z.object({
  facturas: z.number().int().nullable().optional(),
  boletas: z.number().int().nullable().optional(),
  total: z.number().int().nullable().optional(),
  origen: z.enum(["MANUAL", "INTERVENCION", "ADAPTER"]).default("MANUAL"),
});
const categoriaSchema = z.object({
  categoriaId: z.string().nullable().optional(),
  subcategoriaId: z.string().nullable().optional(),
});

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "NO_ENCONTRADO") return 404;
    if (err.code === "TRANSICION_NO_PERMITIDA") return 400;
    if (err.code === "ESTADO_INVALIDO") return 400;
    if (err.code === "ASESOR_REQUERIDO") return 400;
    if (err.code === "CATEGORIA_INVALIDA" || err.code === "SUBCATEGORIA_INVALIDA") return 400;
    return 400;
  }
  return 500;
}

function handle(res: Response, err: unknown) {
  res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error", code: err instanceof DomainError ? err.code : undefined });
}

function filtrosDe(req: Request): Record<string, string | undefined> {
  return {
    desde: (req.query.desde as string) || undefined,
    hasta: (req.query.hasta as string) || undefined,
    asesor: (req.query.asesor as string) || undefined,
    proveedor: (req.query.proveedor as string) || undefined,
    dominio: (req.query.dominio as string) || undefined,
    ruc: (req.query.ruc as string) || undefined,
    estado: (req.query.estado as string) || undefined,
    categoria: (req.query.categoria as string) || undefined,
    subcategoria: (req.query.subcategoria as string) || undefined,
    resultado: (req.query.resultado as string) || undefined,
  };
}

export const facturacionCasosController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const limite = Number(req.query.limite ?? 200);
      const data = await facturacionCasosService.listarCasos(filtrosDe(req), Number.isFinite(limite) ? limite : 200);
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async detalle(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await facturacionCasosService.obtenerCaso(req.params.id);
      res.json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },

  async porDominio(req: Request, res: Response, next: NextFunction) {
    try {
      const dominio = (req.query.dominio as string)?.trim();
      if (!dominio) return res.status(400).json({ ok: false, error: "dominio requerido" });
      const data = await facturacionCasosService.obtenerCasoPorDominio(dominio);
      res.json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },

  async snapshots(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await facturacionCasosService.obtenerSnapshots(req.params.id);
      res.json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },

  async asignar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = asignarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "asesor requerido" });
      const data = await facturacionCasosService.asignarCaso(req.params.id, parsed.data.asesor, usuarioDe(req));
      res.json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },

  async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = estadoSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "estado requerido" });
      const data = await facturacionCasosService.cambiarEstadoOperativo(req.params.id, parsed.data.estado, usuarioDe(req));
      res.json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },

  async registrarSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = snapshotSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const data = await facturacionCasosService.registrarSnapshot({
        casoId: req.params.id,
        facturas: parsed.data.facturas ?? null,
        boletas: parsed.data.boletas ?? null,
        total: parsed.data.total ?? null,
        origen: parsed.data.origen,
        usuario: usuarioDe(req),
      });
      res.json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },

  async cambiarCategoria(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = categoriaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const data = await facturacionCasosService.cambiarCategoria(
        req.params.id, parsed.data.categoriaId ?? null, parsed.data.subcategoriaId ?? null, usuarioDe(req),
      );
      res.json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },

  async listarCategorias(_req: Request, res: Response, next: NextFunction) {
    try {
      const { facturacionCasosRepository } = await import("../repositories/facturacion.casos.repository");
      res.json({ ok: true, data: await facturacionCasosRepository.listarCategorias() });
    } catch (err) { next(err); }
  },

  async listarSubcategorias(req: Request, res: Response, next: NextFunction) {
    try {
      const { facturacionCasosRepository } = await import("../repositories/facturacion.casos.repository");
      const categoriaId = req.params.categoriaId ?? "";
      res.json({ ok: true, data: await facturacionCasosRepository.listarSubcategoriasDeCategoria(categoriaId) });
    } catch (err) { next(err); }
  },

  async exportar(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, nombre, total } = await facturacionCasosService.exportarExcel(filtrosDe(req), usuarioDe(req));
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
      res.setHeader("X-Export-Total", String(total));
      res.send(buffer);
    } catch (err) { next(err); }
  },
};
