import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { adminConfigService } from "../services/admin.config.service";
import { DomainError } from "../core/errors/types";

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "DUPLICADO") return 409;
    if (err.code === "NOMBRE_REQUERIDO" || err.code === "EMAIL_REQUERIDO" || err.code === "DATOS_REQUERIDOS") return 400;
    if (err.code === "NO_ENCONTRADO") return 404;
    return 400;
  }
  return 500;
}

function handle(res: Response, err: unknown) {
  res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error" });
}

const crearUsuarioSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().nullable().optional(),
  email: z.string().min(1),
  rol: z.string().nullable().optional(),
  equipoId: z.string().nullable().optional(),
  iniciales: z.string().nullable().optional(),
  password: z.string().optional(),
}).strict();

const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().nullable().optional(),
  email: z.string().optional(),
  rol: z.string().nullable().optional(),
  equipoId: z.string().nullable().optional(),
  estado: z.string().optional(),
  iniciales: z.string().nullable().optional(),
  password: z.string().optional(),
}).strict();

const rolSchema = z.object({ nombre: z.string().min(1), descripcion: z.string().nullable().optional() });
const rolPatchSchema = z.object({ nombre: z.string().min(1).optional(), descripcion: z.string().nullable().optional(), activo: z.boolean().optional(), orden: z.number().int().optional() });
const equipoSchema = z.object({ nombre: z.string().min(1), descripcion: z.string().nullable().optional() });
const equipoPatchSchema = z.object({ nombre: z.string().min(1).optional(), descripcion: z.string().nullable().optional(), activo: z.boolean().optional(), orden: z.number().int().optional() });
const permisoSchema = z.object({ modulo: z.string().min(1), accion: z.string().min(1), rolId: z.string().min(1), permitido: z.boolean() });

export const adminConfigController = {
  async listarUsuarios(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await adminConfigService.listarUsuarios() }); }
    catch (err) { next(err); }
  },

  async crearUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearUsuarioSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      res.status(201).json({ ok: true, data: await adminConfigService.crearUsuario(parsed.data) });
    } catch (err) { handle(res, err); }
  },

  async actualizarUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actualizarUsuarioSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      res.json({ ok: true, data: await adminConfigService.actualizarUsuario(req.params.id, parsed.data) });
    } catch (err) { handle(res, err); }
  },

  async listarRoles(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await adminConfigService.listarRoles() }); }
    catch (err) { next(err); }
  },

  async crearRol(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = rolSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Nombre requerido" });
      res.status(201).json({ ok: true, data: await adminConfigService.crearRol(parsed.data.nombre, parsed.data.descripcion) });
    } catch (err) { handle(res, err); }
  },

  async actualizarRol(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = rolPatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      res.json({ ok: true, data: await adminConfigService.actualizarRol(req.params.id, parsed.data) });
    } catch (err) { handle(res, err); }
  },

  async listarEquipos(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await adminConfigService.listarEquipos() }); }
    catch (err) { next(err); }
  },

  async crearEquipo(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = equipoSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Nombre requerido" });
      res.status(201).json({ ok: true, data: await adminConfigService.crearEquipo(parsed.data.nombre, parsed.data.descripcion) });
    } catch (err) { handle(res, err); }
  },

  async actualizarEquipo(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = equipoPatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      res.json({ ok: true, data: await adminConfigService.actualizarEquipo(req.params.id, parsed.data) });
    } catch (err) { handle(res, err); }
  },

  async listarPermisos(req: Request, res: Response, next: NextFunction) {
    try {
      const rolId = (req.query.rolId as string | undefined) ?? null;
      res.json({ ok: true, data: await adminConfigService.listarPermisos(rolId) });
    } catch (err) { next(err); }
  },

  async setPermiso(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = permisoSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      await adminConfigService.setPermiso(parsed.data.modulo, parsed.data.accion, parsed.data.rolId, parsed.data.permitido);
      res.json({ ok: true });
    } catch (err) { handle(res, err); }
  },
};
