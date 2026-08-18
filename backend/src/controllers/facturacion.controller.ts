import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { facturacionService } from "../services/facturacion.service";
import { DomainError } from "../core/errors/types";
import { AuthedRequest } from "../middlewares/auth.middleware";

/**
 * Resuelve el asesor de una intervención.
 *
 * FUENTE PRINCIPAL: el usuario autenticado (sesión) — la identidad NO puede
 * falsificarse desde el navegador.
 * FALLBACK AISLADO: header X-Asesor, solo para compatibilidad temporal mientras
 * no todas las rutas requieren sesión. Será eliminado cuando la autenticación
 * esté completa.
 */
function asesorDe(req: Request): string {
  const auth = (req as AuthedRequest).auth;
  if (auth?.nombre) return auth.nombre;
  const header = (req.headers["x-asesor"] as string | undefined)?.trim();
  if (header) return header;
  const body = (req.body as { asesor?: string } | undefined)?.asesor?.trim();
  return body || "sistema";
}

const crearSchema = z.object({
  unidadNegocioId: z.string().nullable().optional(),
  clienteNombre: z.string().nullable().optional(),
  ruc: z.string().nullable().optional(),
  dominio: z.string().min(1, "dominio requerido"),
  proveedor: z.string().nullable().optional(),
  facturasPendientes: z.number().int().nullable().optional(),
  boletasPendientes: z.number().int().nullable().optional(),
  subcategoriaId: z.string().nullable().optional(),
  estadoId: z.string().nullable().optional(),
});

const pausarSchema = z.object({
  motivo: z.string().nullable().optional(),
});

const finalizarSchema = z.object({
  status: z.enum(["RESUELTA", "NO_RESUELTA", "DERIVADA", "CANCELADA"]),
  causa: z.string().nullable().optional(),
  resultado: z.string().nullable().optional(),
  observacion: z.string().nullable().optional(),
  subcategoriaId: z.string().nullable().optional(),
  estadoId: z.string().nullable().optional(),
  mensajeError: z.string().nullable().optional(),
  facturasPendientes: z.number().int().nullable().optional(),
  boletasPendientes: z.number().int().nullable().optional(),
});

const actualizarSchema = z.object({
  causa: z.string().nullable().optional(),
  resultado: z.string().nullable().optional(),
  observacion: z.string().nullable().optional(),
  unidadNegocioId: z.string().nullable().optional(),
  clienteNombre: z.string().nullable().optional(),
  ruc: z.string().nullable().optional(),
  dominio: z.string().optional(),
  proveedor: z.string().nullable().optional(),
  facturasPendientes: z.number().int().nullable().optional(),
  boletasPendientes: z.number().int().nullable().optional(),
  subcategoriaId: z.string().nullable().optional(),
  estadoId: z.string().nullable().optional(),
  mensajeError: z.string().nullable().optional(),
});

const actividadSchema = z.object({
  tipo: z.string().min(1),
  detalle: z.string().nullable().optional(),
});

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "INTERVENCION_ACTIVA") return 409;
    if (err.code === "NO_AUTORIZADO") return 403;
    if (err.code === "NO_ENCONTRADA") return 404;
    return 400;
  }
  return 500;
}

export const facturacionController = {
  async activa(req: Request, res: Response, next: NextFunction) {
    try {
      const activa = await facturacionService.obtenerActiva(asesorDe(req));
      res.json({ ok: true, data: activa });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const data = await facturacionService.crear({ ...parsed.data, asesor: asesorDe(req), dominio: parsed.data.dominio });
      res.status(201).json({ ok: true, data });
    } catch (err) {
      res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error" });
    }
  },

  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const limite = Number(req.query.limite ?? 50);
      const data = await facturacionService.listar(asesorDe(req), Number.isFinite(limite) ? limite : 50);
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async porCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const unidadNegocioId = (req.query.unidadNegocioId as string | undefined)?.trim() || null;
      const dominiosRaw = req.query.dominios as string | string[] | undefined;
      const dominios = (Array.isArray(dominiosRaw) ? dominiosRaw : (dominiosRaw ? [dominiosRaw] : []))
        .map((d) => String(d).trim())
        .filter(Boolean);

      if (!unidadNegocioId && dominios.length === 0) {
        return res.status(400).json({ ok: false, error: "Se requiere unidadNegocioId o dominios" });
      }
      const data = await facturacionService.listarPorCliente(unidadNegocioId, dominios);
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async pausar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = pausarSchema.safeParse(req.body);
      const data = await facturacionService.pausar(req.params.id, asesorDe(req), parsed.success ? parsed.data.motivo : null);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error" });
    }
  },

  async reanudar(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await facturacionService.reanudar(req.params.id, asesorDe(req));
      res.json({ ok: true, data });
    } catch (err) {
      res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error" });
    }
  },

  async finalizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = finalizarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const data = await facturacionService.finalizar(req.params.id, asesorDe(req), parsed.data.status, {
        causa: parsed.data.causa ?? null,
        resultado: parsed.data.resultado ?? null,
        observacion: parsed.data.observacion ?? null,
        subcategoriaId: parsed.data.subcategoriaId ?? null,
        estadoId: parsed.data.estadoId ?? null,
        mensajeError: parsed.data.mensajeError ?? null,
        facturasPendientes: parsed.data.facturasPendientes ?? null,
        boletasPendientes: parsed.data.boletasPendientes ?? null,
      });
      res.json({ ok: true, data });
    } catch (err) {
      res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error" });
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actualizarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const camlToSnake: Record<string, string> = {
        unidadNegocioId: "unidad_negocio_id",
        clienteNombre: "cliente_nombre",
        facturasPendientes: "facturas_pendientes",
        boletasPendientes: "boletas_pendientes",
        subcategoriaId: "subcategoria_id",
        estadoId: "estado_id",
        mensajeError: "mensaje_error",
      };
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed.data)) {
        if (v !== undefined) patch[camlToSnake[k] ?? k] = v;
      }
      const data = await facturacionService.actualizar(req.params.id, asesorDe(req), patch);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error" });
    }
  },

  async registrarActividad(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actividadSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      await facturacionService.registrarActividad(req.params.id, asesorDe(req), parsed.data.tipo, parsed.data.detalle ?? null);
      res.json({ ok: true });
    } catch (err) {
      res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error" });
    }
  },
};
