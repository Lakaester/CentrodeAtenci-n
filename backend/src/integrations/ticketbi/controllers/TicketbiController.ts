import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ticketbiService } from "../services/TicketbiService";
import { catalogoTicketService } from "../services/CatalogoTicketService";
import { ApplicationError } from "../../../core/errors/types";

const crearTicketSchema = z.object({
  localbi_id: z.union([z.number(), z.string()]).nullable().optional(),
  personabi_id: z.union([z.number(), z.string()]).nullable().optional(),
  ticketbi_asunto: z.string().min(1).optional(),
  ticketbi_categoria: z.string().optional(),
  // Campos del formulario (estado temporal de COPE; no se envían al endpoint).
  subcategoria: z.string().optional(),
  nivel: z.string().optional(),
  fecha_tentativa: z.string().optional(),
  descripcion: z.string().optional(),
  conclusion: z.string().optional(),
  detalleList: z.array(
    z.object({
      tarea_nombre: z.string().optional(),
      tarea_descripcion: z.string().optional(),
      area: z.string().optional(),
      plataforma: z.string().optional(),
      proyecto: z.string().optional(),
      version: z.string().optional(),
      tipo: z.string().optional(),
      etapa_error: z.string().optional(),
      fecha_entrega: z.string().optional(),
      referencia: z.string().optional(),
      casos: z.string().optional(),
    }),
  ).optional(),
});

function toHttp(err: unknown): number {
  if (err instanceof ApplicationError) return 400;
  return 500;
}

function handle(res: Response, err: unknown) {
  res.status(toHttp(err)).json({
    ok: false,
    error: err instanceof Error ? err.message : "No fue posible crear el ticket.",
    code: err instanceof ApplicationError ? err.code : undefined,
  });
}

export const ticketbiController = {
  /** POST /api/atenciones/ticket-desarrollo — Crea un ticket interno de Desarrollo. */
  async crearTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "Payload del ticket incompleto o inválido." });
      }
      const resultado = await ticketbiService.crearTicket(parsed.data);
      res.json({ ok: true, data: resultado });
    } catch (err) {
      handle(res, err);
    }
  },

  /** GET /api/atenciones/ticket-catalogos/categorias — categorías locales de COPE. */
  async categorias(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: catalogoTicketService.categorias() }); } catch (err) { next(err); }
  },

  /** GET /api/atenciones/ticket-catalogos/subcategorias?categoria=... */
  async subcategorias(req: Request, res: Response, next: NextFunction) {
    try {
      const categoria = (req.query.categoria as string | undefined) ?? "";
      res.json({ ok: true, data: catalogoTicketService.subcategoriasDe(categoria) });
    } catch (err) { next(err); }
  },

  /** GET /api/atenciones/ticket-catalogos/niveles — niveles de ticket. */
  async niveles(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: catalogoTicketService.niveles() }); } catch (err) { next(err); }
  },

  /** GET /api/atenciones/ticket-catalogos/areas — áreas de tarea. */
  async areas(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: catalogoTicketService.areas() }); } catch (err) { next(err); }
  },
};