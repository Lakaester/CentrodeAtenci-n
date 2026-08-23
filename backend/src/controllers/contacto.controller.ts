import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { contactoDominioService } from "../integrations/localbi/services/ContactoDominioService";
import { AuthedRequest } from "../middlewares/auth.middleware";

const tipoSchema = z.enum(["email", "whatsapp"]);

const resolverQuerySchema = z.object({
  tipo: tipoSchema,
  valor: z.string().min(1),
  dominio_explicito: z.string().optional(),
  dominio_hilo: z.string().optional(),
});

const vincularSchema = z.object({
  tipo: tipoSchema,
  valor: z.string().min(1),
  dominio: z.string().min(1),
  origen: z.enum(["MANUAL", "ZENDESK_EXPLICITO", "HISTORIAL", "WHATSAPP_HISTORICO", "AUTO", "CONFLICTO"]).optional().default("MANUAL"),
});

const desvincularSchema = z.object({
  tipo: tipoSchema,
  valor: z.string().min(1),
  dominio: z.string().min(1),
});

function usuarioDe(req: Request): string | null {
  const auth = (req as AuthedRequest).auth;
  return auth?.nombre ?? null;
}

function handle(res: Response, err: unknown) {
  const msg = err instanceof Error ? err.message : "Error";
  res.status(400).json({ ok: false, error: msg });
}

export const contactoController = {
  /** GET /api/contactos/dominio?tipo=email&valor=...&dominio_explicito=... */
  async resolver(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = resolverQuerySchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Parámetros inválidos" });
      const data = await contactoDominioService.resolver(parsed.data.tipo, parsed.data.valor, {
        dominioExplicito: parsed.data.dominio_explicito ?? null,
        dominioHilo: parsed.data.dominio_hilo ?? null,
        usuario: usuarioDe(req),
      });
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  /** POST /api/contactos/dominio — vincula un dominio a un contacto. */
  async vincular(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = vincularSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Payload inválido" });
      const data = await contactoDominioService.vincular(
        parsed.data.tipo, parsed.data.valor, parsed.data.dominio, usuarioDe(req), parsed.data.origen,
      );
      res.status(201).json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },

  /** DELETE /api/contactos/dominio — desactiva un dominio de un contacto. */
  async desvincular(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = desvincularSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Payload inválido" });
      const data = await contactoDominioService.desvincular(parsed.data.tipo, parsed.data.valor, parsed.data.dominio);
      res.json({ ok: true, data });
    } catch (err) { handle(res, err); }
  },
};
