import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { apoyosService } from "../services/apoyos.service";
import { apoyosExportService } from "../services/apoyosExport.service";
import { DomainError } from "../core/errors/types";
import { AuthedRequest } from "../middlewares/auth.middleware";

const crearSchema = z.object({
  asesorId: z.string().min(1, "Asesor requerido"),
  asesorNombre: z.string().min(1, "Nombre del asesor requerido"),
  dominio: z.string().nullable().optional(),
  clienteNombre: z.string().nullable().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  horaInicio: z.string().nullable().optional(),
  categoria: z.enum([
    "Dudas y consultas",
    "Apoyos con clientes",
    "Manejo de casos derivado",
    "Apoyo funciones de otras áreas",
  ]),
  subcategoriaFun: z.string().nullable().optional(),
  subSubcategoriaFun: z.string().nullable().optional(),
  area: z.string().min(1, "Área requerida"),
  personaApoyo: z.string().nullable().optional(),
  comentario: z.string().nullable().optional(),
});

const actualizarSchema = z.object({
  dominio: z.string().nullable().optional(),
  clienteNombre: z.string().nullable().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horaInicio: z.string().nullable().optional(),
  horaFin: z.string().nullable().optional(),
  categoria: z.enum([
    "Dudas y consultas",
    "Apoyos con clientes",
    "Manejo de casos derivado",
    "Apoyo funciones de otras áreas",
  ]).optional(),
  subcategoriaFun: z.string().nullable().optional(),
  subSubcategoriaFun: z.string().nullable().optional(),
  area: z.string().optional(),
  personaApoyo: z.string().nullable().optional(),
  comentario: z.string().nullable().optional(),
});

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "NO_ENCONTRADO") return 404;
    if (err.code === "APYO_CERRADO" || err.code === "YA_CERRADO") return 409;
    if (err.code === "TRANSICION_INVALIDA") return 409;
    return 400;
  }
  return 500;
}

function handle(res: Response, err: unknown) {
  res.status(toHttp(err)).json({
    ok: false,
    error: err instanceof Error ? err.message : "Error",
    code: err instanceof DomainError ? err.code : undefined,
  });
}

function usuarioDe(req: Request): string | null {
  const auth = (req as AuthedRequest).auth;
  return auth?.nombre ?? null;
}

function userIdDe(req: Request): string | null {
  const auth = (req as AuthedRequest).auth;
  return auth?.id ?? null;
}

export const apoyosController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const filtros: Record<string, any> = {
        desde: (req.query.desde as string) || undefined,
        hasta: (req.query.hasta as string) || undefined,
        estado: (req.query.estado as string) || undefined,
        area: (req.query.area as string) || undefined,
        categoria: (req.query.categoria as string) || undefined,
        dominio: (req.query.dominio as string) || undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      // "Mis Apoyos": solo si se envía el parámetro misApoyos=true
      if (req.query.misApoyos === "true") {
        filtros.asesorId = userIdDe(req);
      } else if (req.query.asesorId) {
        filtros.asesorId = req.query.asesorId as string;
      }
      const result = await apoyosService.listar(filtros);
      res.json({ ok: true, data: result.data, total: result.total });
    } catch (err) { next(err); }
  },

  async detalle(req: Request, res: Response, next: NextFunction) {
    try {
      const apoyo = await apoyosService.porId(req.params.id);
      if (!apoyo) return res.status(404).json({ ok: false, error: "Apoyo no encontrado" });
      res.json({ ok: true, data: apoyo });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const apoyo = await apoyosService.crear(parsed.data, usuarioDe(req));
      res.status(201).json({ ok: true, data: apoyo });
    } catch (err) { handle(res, err); }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actualizarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const apoyo = await apoyosService.actualizar(req.params.id, parsed.data, usuarioDe(req));
      if (!apoyo) return res.status(404).json({ ok: false, error: "Apoyo no encontrado" });
      res.json({ ok: true, data: apoyo });
    } catch (err) { handle(res, err); }
  },

  async cerrar(req: Request, res: Response, next: NextFunction) {
    try {
      const apoyo = await apoyosService.cerrar(req.params.id, usuarioDe(req));
      if (!apoyo) return res.status(404).json({ ok: false, error: "Apoyo no encontrado" });
      res.json({ ok: true, data: apoyo });
    } catch (err) { handle(res, err); }
  },

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await apoyosService.eliminar(req.params.id);
      if (!ok) return res.status(404).json({ ok: false, error: "Apoyo no encontrado" });
      res.json({ ok: true });
    } catch (err) { handle(res, err); }
  },

  async kpis(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await apoyosService.kpis();
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async listarAreas(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await apoyosService.listarAreas();
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async listarAsesores(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await apoyosService.listarAsesores();
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async listarCategoriasFun(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await apoyosService.listarCategoriasFun();
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async listarSubcategoriasDeCategoria(req: Request, res: Response, next: NextFunction) {
    try {
      const categoria = req.params.categoria;
      if (!categoria) return res.status(400).json({ ok: false, error: "Categoría requerida" });
      const data = await apoyosService.listarSubcategoriasDeCategoria(categoria);
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async exportar(req: Request, res: Response, next: NextFunction) {
    try {
      const f = {
        desde: (req.query.desde as string) || undefined,
        hasta: (req.query.hasta as string) || undefined,
        estado: (req.query.estado as string) || undefined,
        area: (req.query.area as string) || undefined,
        categoria: (req.query.categoria as string) || undefined,
        asesorId: (req.query.asesorId as string) || undefined,
        dominio: (req.query.dominio as string) || undefined,
      };
      const { buffer, nombre, total } = await apoyosExportService.generar(f);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
      res.setHeader("X-Export-Total", String(total));
      res.send(buffer);
    } catch (err) { handle(res, err); }
  },
};
