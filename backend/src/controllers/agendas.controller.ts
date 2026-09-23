import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { agendasService } from "../services/agendas.service";
import { agendasExportService } from "../services/agendasExport.service";
import { actaPdfService } from "../services/actaPdf.service";
import { DomainError } from "../core/errors/types";
import { AuthedRequest } from "../middlewares/auth.middleware";

const crearSchema = z.object({
  tipo: z.enum(["REUNION", "CAPACITACION"]),
  asesorId: z.string().min(1, "Asesor requerido"),
  asesorNombre: z.string().min(1, "Nombre del asesor requerido"),
  asesorCorreo: z.string().email("Correo inválido"),
  dominio: z.string().nullable().optional(),
  clienteNombre: z.string().nullable().optional(),
  clienteNumero: z.string().nullable().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  horaInicio: z.string().min(1, "Hora de inicio requerida"),
  horaFin: z.string().min(1, "Hora de fin requerida"),
  estado: z.enum(["PENDIENTE", "ACTIVA", "FINALIZADA", "CANCELADA"]).optional(),
  descripcion: z.string().nullable().optional(),
  grabacionUrl: z.string().optional().nullable().refine(
    (v) => !v || z.string().url().safeParse(v).success,
    "URL inválida"
  ),
});

const actualizarSchema = z.object({
  tipo: z.enum(["REUNION", "CAPACITACION"]).optional(),
  dominio: z.string().nullable().optional(),
  clienteNombre: z.string().nullable().optional(),
  clienteNumero: z.string().nullable().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  estado: z.enum(["PENDIENTE", "ACTIVA", "FINALIZADA", "CANCELADA"]).optional(),
  resultado: z.enum(["REALIZADA", "SIN_REALIZAR", "CANCELADA"]).nullable().optional(),
  descripcion: z.string().nullable().optional(),
  grabacionUrl: z.string().optional().nullable().refine(
    (v) => !v || z.string().url().safeParse(v).success,
    "URL inválida"
  ),
});

const estadoSchema = z.object({
  estado: z.enum(["PENDIENTE", "ACTIVA", "FINALIZADA", "CANCELADA"]),
});

const inicioRealSchema = z.object({
  hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato HH:MM o HH:MM:SS"),
});

const finRealSchema = z.object({
  hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato HH:MM o HH:MM:SS"),
});

const resultadoSchema = z.object({
  resultado: z.enum(["REALIZADA", "SIN_REALIZAR", "CANCELADA"]).nullable(),
});

const actaSchema = z.object({
  contenido: z.any(),
  estado: z.enum(["BORRADOR", "FINALIZADA"]),
});

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "NO_ENCONTRADO") return 404;
    if (err.code === "AGENDA_CERRADA" || err.code === "TRANSICION_INVALIDA") return 409;
    if (err.code === "AGENDA_CANCELADA" || err.code === "AGENDA_FINALIZADA") return 409;
    if (err.code === "YA_REGISTRADO" || err.code === "SIN_INICIO_REAL") return 409;
    if (err.code === "HORA_FIN_REAL_INVALIDA") return 400;
    if (err.code === "RESULTADO_INVALIDO" || err.code === "RESULTADO_INCOMPATIBLE") return 400;
    if (err.code === "GOOGLE_NOT_CONFIGURED") return 503;
    if (err.code === "GOOGLE_NOT_CONNECTED") return 503;
    if (err.code === "GOOGLE_OAUTH_STATE_INVALID" || err.code === "GOOGLE_AUTH_FAILED") return 400;
    if (err.code === "CALENDAR_CREATE_ERROR" || err.code === "CALENDAR_UPDATE_ERROR") return 502;
    if (err.code === "ASESOR_SIN_CORREO") return 400;
    if (err.code === "SYNC_NO_ERROR") return 409;
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

export const agendasController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const filtros: Record<string, any> = {
        desde: (req.query.desde as string) || undefined,
        hasta: (req.query.hasta as string) || undefined,
        estado: (req.query.estado as string) || undefined,
        tipo: (req.query.tipo as string) || undefined,
        dominio: (req.query.dominio as string) || undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      // "Mis Agendas": solo si se envía el parámetro misAgendas=true
      if (req.query.misAgendas === "true") {
        filtros.asesorId = userIdDe(req);
      } else if (req.query.asesorId) {
        filtros.asesorId = req.query.asesorId as string;
      }
      const result = await agendasService.listar(filtros);
      res.json({ ok: true, data: result.data, total: result.total });
    } catch (err) { next(err); }
  },

  async detalle(req: Request, res: Response, next: NextFunction) {
    try {
      const agenda = await agendasService.porId(req.params.id);
      if (!agenda) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      res.json({ ok: true, data: agenda });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const agenda = await agendasService.crear(parsed.data, usuarioDe(req));
      // Auto-sync con Google Calendar (fire-and-forget, no bloquea la respuesta)
      agendasService.sincronizarCalendar(agenda.id).catch(() => {});
      res.status(201).json({ ok: true, data: agenda });
    } catch (err) { handle(res, err); }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actualizarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const agenda = await agendasService.actualizar(req.params.id, parsed.data);
      if (!agenda) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      // Intentar sync con Google Calendar (fire-and-forget).
      // Si el primer sync falló (calendar_event_id null), sincronizarCalendar
      // detectará que no tiene evento y creará uno nuevo.
      agendasService.sincronizarCalendar(agenda.id).catch(() => {});
      res.json({ ok: true, data: agenda });
    } catch (err) { handle(res, err); }
  },

  async actualizarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = estadoSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const agenda = await agendasService.actualizarEstado(req.params.id, parsed.data.estado);
      if (!agenda) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      res.json({ ok: true, data: agenda });
    } catch (err) { handle(res, err); }
  },

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = await agendasService.eliminar(req.params.id);
      if (!ok) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      res.json({ ok: true });
    } catch (err) { handle(res, err); }
  },

  async registrarInicioReal(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = inicioRealSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const agenda = await agendasService.registrarInicioReal(req.params.id, parsed.data.hora);
      if (!agenda) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      res.json({ ok: true, data: agenda });
    } catch (err) { handle(res, err); }
  },

  async registrarFinReal(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = finRealSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const agenda = await agendasService.registrarFinReal(req.params.id, parsed.data.hora);
      if (!agenda) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      res.json({ ok: true, data: agenda });
    } catch (err) { handle(res, err); }
  },

  async setResultado(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = resultadoSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const agenda = await agendasService.setResultado(req.params.id, parsed.data.resultado);
      if (!agenda) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      res.json({ ok: true, data: agenda });
    } catch (err) { handle(res, err); }
  },

  async kpis(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await agendasService.kpis();
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async porRangoFecha(req: Request, res: Response, next: NextFunction) {
    try {
      const desde = (req.query.desde as string) || "";
      const hasta = (req.query.hasta as string) || "";
      if (!desde || !hasta) {
        return res.status(400).json({ ok: false, error: "Se requieren 'desde' y 'hasta'" });
      }
      const data = await agendasService.porRangoFecha(desde, hasta);
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async exportar(req: Request, res: Response, next: NextFunction) {
    try {
      const f = {
        desde: (req.query.desde as string) || undefined,
        hasta: (req.query.hasta as string) || undefined,
        estado: (req.query.estado as string) || undefined,
        tipo: (req.query.tipo as string) || undefined,
        asesorId: (req.query.asesorId as string) || undefined,
        dominio: (req.query.dominio as string) || undefined,
      };
      const { buffer, nombre, total } = await agendasExportService.generar(f);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
      res.setHeader("X-Export-Total", String(total));
      res.send(buffer);
    } catch (err) { handle(res, err); }
  },

  // ── Google Calendar ──

  async sincronizarCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await agendasService.sincronizarCalendar(req.params.id);
      res.json({ ok: true, data: result });
    } catch (err) { handle(res, err); }
  },

  async reintentarSyncCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await agendasService.reintentarSyncCalendar(req.params.id);
      res.json({ ok: true, data: result });
    } catch (err) { handle(res, err); }
  },

  // ── Google Calendar OAuth ──

  async googleCalendarStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await agendasService.getGoogleCalendarStatus();
      res.json({ ok: true, data: result });
    } catch (err) { handle(res, err); }
  },

  async googleCalendarConnect(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await agendasService.getGoogleCalendarAuthUrl();
      res.json({ ok: true, data: result });
    } catch (err) { handle(res, err); }
  },

  async googleCalendarCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string | undefined;
      if (!code) {
        return res.status(400).json({ ok: false, error: "Falta el parámetro code" });
      }
      await agendasService.handleGoogleCalendarCallback(code, state);
      // Redirigir al frontend con éxito
      const frontendUrl = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",")[0];
      res.redirect(`${frontendUrl}/gestion/agendas?google_calendar=connected`);
    } catch (err) {
      const frontendUrl = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",")[0];
      const msg = err instanceof Error ? err.message : "Error desconocido";
      res.redirect(`${frontendUrl}/gestion/agendas?google_calendar=error&message=${encodeURIComponent(msg)}`);
    }
  },

  async googleCalendarDisconnect(_req: Request, res: Response, next: NextFunction) {
    try {
      await agendasService.disconnectGoogleCalendar();
      res.json({ ok: true });
    } catch (err) { handle(res, err); }
  },

  async googleCalendarInfo(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await agendasService.getGoogleCalendarInfo();
      res.json({ ok: true, data: result });
    } catch (err) { handle(res, err); }
  },

  async verificarDisponibilidad(req: Request, res: Response, next: NextFunction) {
    try {
      const desde = req.query.desde as string;
      const hasta = req.query.hasta as string;
      if (!desde || !hasta) {
        return res.status(400).json({ ok: false, error: "Se requieren 'desde' y 'hasta'" });
      }
      const result = await agendasService.verificarDisponibilidad(desde, hasta);
      res.json({ ok: true, data: result });
    } catch (err) { handle(res, err); }
  },

  async reconciliarAgenda(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await agendasService.reconciliarAgenda(req.params.id);
      res.json({ ok: true, data: result });
    } catch (err) { handle(res, err); }
  },

  async guardarActa(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const agenda = await agendasService.guardarActa(req.params.id, parsed.data.contenido, parsed.data.estado);
      if (!agenda) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      res.json({ ok: true, data: agenda });
    } catch (err) { handle(res, err); }
  },

  async descargarActaPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const agenda = await agendasService.porId(req.params.id);
      if (!agenda) return res.status(404).json({ ok: false, error: "Agenda no encontrada" });
      if (agenda.acta_estado !== "FINALIZADA") {
        return res.status(404).json({ ok: false, error: "El acta no está finalizada" });
      }
      if (!agenda.acta_nombre) {
        return res.status(404).json({ ok: false, error: "El acta no tiene archivo PDF asociado" });
      }
      const buffer = actaPdfService.getBuffer(agenda.ticket);
      if (!buffer) {
        return res.status(404).json({ ok: false, error: "Archivo PDF no encontrado en disco" });
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${agenda.acta_nombre}"`);
      res.send(buffer);
    } catch (err) { handle(res, err); }
  },
};
