import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { DomainError } from "../core/errors/types";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { seguimientoProactivoService as service } from "../services/seguimientoProactivo.service";
import type { SeguimientoEstado } from "../types/seguimientoProactivo";

const estados = ["sin_seguimiento", "con_pendientes", "finalizado"] as const;

const crearLoteSchema = z.object({
  semana: z.string().regex(/^\d{4}-W\d{2}$/, "Formato YYYY-Www").optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD").optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD").optional(),
  claves: z.array(z.string().min(1)).max(500).optional(),
});

const gestionSchema = z.object({
  contactoAt: z.string().min(10),
  proximoContactoAt: z.string().min(10).nullable().optional(),
  resumen: z.string().trim().min(10, "El resumen debe tener al menos 10 caracteres").max(2000),
  estadoNuevo: z.enum(estados),
});

const actualizarSchema = z.object({
  asesorId: z.string().min(1).nullable().optional(),
  proximoContactoAt: z.string().min(10).nullable().optional(),
});

const scopeSchema = z.enum(["semana", "mes", "backlog", "todos"]);

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "NO_ENCONTRADO") return 404;
    if (err.code === "SIN_PERMISO") return 403;
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

function authDe(req: Request) {
  const auth = (req as AuthedRequest).auth;
  if (!auth) throw new DomainError("No autenticado", "UNAUTHENTICATED");
  return auth;
}

function intParam(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export const seguimientoProactivoController = {
  async candidatos(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.candidatos({
        desde: typeof req.query.desde === "string" ? req.query.desde : undefined,
        hasta: typeof req.query.hasta === "string" ? req.query.hasta : undefined,
      });
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async resumen(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.resumen({
        semana: typeof req.query.semana === "string" ? req.query.semana : undefined,
        periodo: typeof req.query.periodo === "string" ? req.query.periodo : undefined,
      });
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const scope = scopeSchema.safeParse(req.query.scope);
      const estado = z.enum(estados).safeParse(req.query.estado);
      const data = await service.listar(
        {
          scope: scope.success ? scope.data : "semana",
          periodo: typeof req.query.periodo === "string" ? req.query.periodo : undefined,
          semana: typeof req.query.semana === "string" ? req.query.semana : undefined,
          estado: estado.success ? (estado.data as SeguimientoEstado) : undefined,
          asesorId: typeof req.query.asesorId === "string" ? req.query.asesorId : undefined,
          senal: typeof req.query.senal === "string" ? req.query.senal : undefined,
          search: typeof req.query.search === "string" ? req.query.search : undefined,
          soloMisCasos: req.query.soloMisCasos === "true",
          page: intParam(req.query.page, 1),
          pageSize: intParam(req.query.pageSize, 25),
        },
        authDe(req),
      );
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async detalle(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ ok: true, data: await service.detalle(req.params.id) });
    } catch (err) {
      handle(res, err);
    }
  },

  async atenciones(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.atenciones(req.params.id, {
        page: intParam(req.query.page, 1),
        pageSize: intParam(req.query.pageSize, 25),
        categoria: typeof req.query.categoria === "string" ? req.query.categoria : undefined,
        subcategoria: typeof req.query.subcategoria === "string" ? req.query.subcategoria : undefined,
      });
      res.json({ ok: true, data });
    } catch (err) {
      handle(res, err);
    }
  },

  async crearLote(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearLoteSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      }
      const data = await service.crearLote(parsed.data, authDe(req));
      res.status(201).json({ ok: true, data });
    } catch (err) {
      handle(res, err);
    }
  },

  async gestionar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = gestionSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      }
      const data = await service.gestionar(req.params.id, parsed.data, authDe(req));
      res.status(201).json({ ok: true, data });
    } catch (err) {
      handle(res, err);
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actualizarSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      }
      const data = await service.actualizar(req.params.id, parsed.data, authDe(req));
      res.json({ ok: true, data });
    } catch (err) {
      handle(res, err);
    }
  },
};
