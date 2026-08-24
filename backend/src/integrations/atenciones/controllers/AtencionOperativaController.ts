import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { atencionOperativaService } from "../services/AtencionOperativaService";
import { AuthedRequest } from "../../../middlewares/auth.middleware";

const ticketIdSchema = z.object({ id: z.string().min(1) });

const identificacionSchema = z.object({
  contactoTipo: z.enum(["email", "whatsapp"]).optional(),
  contactoValor: z.string().optional(),
  dominio: z.string().min(1),
  tipoIdentificacion: z.enum(["AUTO", "MANUAL", "ZENDESK_EXPLICITO", "HISTORIAL", "SIN_IDENTIFICAR"]),
});

const clasificacionSchema = z.object({
  categoria: z.string().min(1),
  subcategoria: z.string().optional().nullable(),
  origen: z.enum(["cope", "zendesk"]).default("cope"),
});

const calificacionSchema = z.object({
  calificacion: z.string().min(1),
});

const accionSchema = z.object({
  accion: z.string().min(1),
  detalle: z.string().optional().nullable(),
  campo: z.string().optional().nullable(),
  valorAnterior: z.string().optional().nullable(),
  valorNuevo: z.string().optional().nullable(),
  origen: z.enum(["cope", "zendesk"]).default("cope"),
});

function usuarioDe(req: Request): string | null {
  const auth = (req as AuthedRequest).auth;
  return auth?.nombre ?? null;
}

function handle(res: Response, err: unknown) {
  const msg = err instanceof Error ? err.message : "Error en registro operativo de atención";
  res.status(400).json({ ok: false, error: msg });
}

export const atencionOperativaController = {
  /** GET /api/atenciones/:id/operativa — snapshot + auditoría de la atención. */
  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ticketIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "ID de atención requerido" });
      const data = await atencionOperativaService.obtenerPorTicket(parsed.data.id);
      if (!data) return res.status(404).json({ ok: false, error: "Atención no encontrada" });
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  /** POST /api/atenciones/:id/operativa/identificacion — vincula dominio al snapshot. */
  async registrarIdentificacion(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ticketIdSchema.safeParse(req.params);
      const body = identificacionSchema.safeParse(req.body);
      if (!parsed.success || !body.success) return res.status(400).json({ ok: false, error: "Payload inválido" });
      await atencionOperativaService.registrarIdentificacion(parsed.data.id, {
        ...body.data,
        usuario: usuarioDe(req),
      });
      res.status(201).json({ ok: true });
    } catch (err) { handle(res, err); }
  },

  /** POST /api/atenciones/:id/operativa/clasificacion — categoría/subcategoría. */
  async registrarClasificacion(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ticketIdSchema.safeParse(req.params);
      const body = clasificacionSchema.safeParse(req.body);
      if (!parsed.success || !body.success) return res.status(400).json({ ok: false, error: "Payload inválido" });
      await atencionOperativaService.registrarClasificacion(parsed.data.id, {
        ...body.data,
        usuario: usuarioDe(req),
      });
      res.status(201).json({ ok: true });
    } catch (err) { handle(res, err); }
  },

  /** POST /api/atenciones/:id/operativa/calificacion — calificación de la atención. */
  async registrarCalificacion(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ticketIdSchema.safeParse(req.params);
      const body = calificacionSchema.safeParse(req.body);
      if (!parsed.success || !body.success) return res.status(400).json({ ok: false, error: "Payload inválido" });
      await atencionOperativaService.registrarCalificacion(parsed.data.id, {
        ...body.data,
        usuario: usuarioDe(req),
      });
      res.status(201).json({ ok: true });
    } catch (err) { handle(res, err); }
  },

  /** POST /api/atenciones/:id/operativa/acciones — acción operativa genérica. */
  async registrarAccion(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ticketIdSchema.safeParse(req.params);
      const body = accionSchema.safeParse(req.body);
      if (!parsed.success || !body.success) return res.status(400).json({ ok: false, error: "Payload inválido" });
      await atencionOperativaService.registrarAccion(parsed.data.id, {
        ...body.data,
        usuario: usuarioDe(req),
      });
      res.status(201).json({ ok: true });
    } catch (err) { handle(res, err); }
  },
};