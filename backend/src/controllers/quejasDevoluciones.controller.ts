import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { qdService } from "../services/quejasDevoluciones.service";
import { qdRepository } from "../repositories/quejasDevoluciones.repository";
import { qdExportService } from "../services/quejasDevolucionesExport.service";
import { DomainError } from "../core/errors/types";
import { AuthedRequest } from "../middlewares/auth.middleware";

const casoBase = {
  ticketId: z.string().nullable().optional(),
  dominio: z.string().nullable().optional(),
  pais: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  resultado: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  motivo: z.string().nullable().optional(),
  observacion: z.string().nullable().optional(),
  moneda: z.enum(["PEN", "USD"]).nullable().optional(),
};

const crearSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("devolucion"),
    ...casoBase,
    montoPagado: z.number().nonnegative().nullable().optional(),
    tipoMonto: z.string().nullable().optional(),
    porcentaje: z.number().min(0).max(100).nullable().optional(),
    montoDevuelto: z.number().nonnegative().nullable().optional(),
  }),
  z.object({
    tipo: z.literal("queja"),
    ...casoBase,
    clasificacion: z.string().nullable().optional(),
    producto: z.string().nullable().optional(),
  }),
]);

const actualizarSchema = z.object({
  ticketId: z.string().nullable().optional(),
  dominio: z.string().nullable().optional(),
  pais: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  resultado: z.string().nullable().optional(),
  moneda: z.enum(["PEN", "USD"]).nullable().optional(),
  area: z.string().nullable().optional(),
  motivo: z.string().nullable().optional(),
  montoPagado: z.number().nonnegative().nullable().optional(),
  tipoMonto: z.string().nullable().optional(),
  porcentaje: z.number().min(0).max(100).nullable().optional(),
  montoDevuelto: z.number().nonnegative().nullable().optional(),
  clasificacion: z.string().nullable().optional(),
  producto: z.string().nullable().optional(),
  observacion: z.string().nullable().optional(),
});

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "CASO_DUPLICADO") return 409;
    if (err.code === "NO_ENCONTRADO") return 404;
    if (err.code === "ORIGEN_NO_ELIMINABLE") return 403;
    return 400;
  }
  return 500;
}

function handle(res: Response, err: unknown) {
  res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "Error", code: err instanceof DomainError ? err.code : undefined });
}

function usuarioDe(req: Request): string | null {
  const auth = (req as AuthedRequest).auth;
  return auth?.nombre ?? null;
}

export const qdController = {
  async listarDevoluciones(req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await qdService.listar("devolucion") }); }
    catch (err) { next(err); }
  },
  async listarQuejas(req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await qdService.listar("queja") }); }
    catch (err) { next(err); }
  },
  async detalle(req: Request, res: Response, next: NextFunction) {
    try {
      const d = await qdService.porId(req.params.id);
      if (!d) return res.status(404).json({ ok: false, error: "Caso no encontrado" });
      res.json({ ok: true, data: d });
    } catch (err) { next(err); }
  },

  /** Asocia un ticket existente a un caso como interacción relacionada. */
  async asociarInteraccion(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = (req.body?.ticketId as string)?.trim();
      if (!ticketId) return res.status(400).json({ ok: false, error: "ticketId requerido" });
      const interaccion = await qdService.asociarInteraccion(req.params.id, ticketId, usuarioDe(req));
      if (!interaccion) {
        return res.json({ ok: true, data: null, mensaje: "Este ticket ya está asociado al caso" });
      }
      res.status(201).json({ ok: true, data: interaccion });
    } catch (err) { handle(res, err); }
  },

  /** Asigna/actualiza manualmente el dominio de un caso. Auditable. NO fusiona casos. */
  async asignarDominio(req: Request, res: Response, next: NextFunction) {
    try {
      const dominio = req.body?.dominio == null ? null : String(req.body.dominio).trim() || null;
      const caso = await qdService.asignarDominio(req.params.id, dominio, usuarioDe(req));
      res.json({ ok: true, data: caso });
    } catch (err) { handle(res, err); }
  },

  /** Cierra manualmente un caso. */
  async cerrarCaso(req: Request, res: Response, next: NextFunction) {
    try {
      const caso = await qdService.cerrarCaso(req.params.id, usuarioDe(req));
      res.json({ ok: true, data: caso });
    } catch (err) { handle(res, err); }
  },

  /** Reabre manualmente un caso cerrado. */
  async reabrirCaso(req: Request, res: Response, next: NextFunction) {
    try {
      const caso = await qdService.reabrirCaso(req.params.id, usuarioDe(req));
      res.json({ ok: true, data: caso });
    } catch (err) { handle(res, err); }
  },

  /** Consolida varios casos secundarios en un caso principal. */
  async consolidarCasos(req: Request, res: Response, next: NextFunction) {
    try {
      const principalId = String(req.body?.principalId ?? "").trim();
      const idsSecundarios = Array.isArray(req.body?.casosIds) ? req.body.casosIds.map(String) : [];
      const motivo = req.body?.motivo == null ? null : String(req.body.motivo).trim() || null;
      if (!principalId) return res.status(400).json({ ok: false, error: "principalId requerido" });
      if (idsSecundarios.length === 0) return res.status(400).json({ ok: false, error: "casosIds requerido" });
      const r = await qdService.consolidarCasos(principalId, idsSecundarios, usuarioDe(req), motivo);
      res.json({ ok: true, data: r });
    } catch (err) { handle(res, err); }
  },

  /** Vincula un ticket existente a un caso como contacto. */
  async vincularTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = (req.body?.ticketId as string)?.trim();
      if (!ticketId) return res.status(400).json({ ok: false, error: "ticketId requerido" });
      const canal = req.body?.canal == null ? null : String(req.body.canal);
      const interaccion = await qdService.vincularTicket(req.params.id, ticketId, usuarioDe(req), canal);
      if (!interaccion) {
        return res.json({ ok: true, data: null, mensaje: "Este ticket ya está vinculado al caso" });
      }
      res.status(201).json({ ok: true, data: interaccion });
    } catch (err) { handle(res, err); }
  },

  async porTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = req.params.ticketId;
      const casos = [];
      // Busca por ticket principal, ticket padre de hilo o interacción relacionada.
      const dev = await qdService.porTicketGeneral(ticketId, "devolucion");
      const queja = await qdService.porTicketGeneral(ticketId, "queja");
      if (dev) casos.push(dev);
      if (queja) casos.push(queja);
      res.json({ ok: true, data: casos });
    } catch (err) { next(err); }
  },

  /**
   * Exportación Excel operativa. Genera el archivo en backend aplicando los
   * filtros activos (query params) y lo devuelve como descarga .xlsx.
   * El permiso "exportar" se valida en la ruta; aquí se registra la auditoría.
   */
  async exportar(req: Request, res: Response, next: NextFunction) {
    try {
      const f = {
        tipo: (req.query.tipo as string) || undefined,
        desde: (req.query.desde as string) || undefined,
        hasta: (req.query.hasta as string) || undefined,
        pais: (req.query.pais as string) || undefined,
        estado: (req.query.estado as string) || undefined,
        resultado: (req.query.resultado as string) || undefined,
        asesor: (req.query.asesor as string) || undefined,
        area: (req.query.area as string) || undefined,
        producto: (req.query.producto as string) || undefined,
        tipoQueja: (req.query.tipoQueja as string) || undefined,
      };
      const usuario = usuarioDe(req);
      const { buffer, nombre, total } = await qdExportService.generar(f, usuario);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
      res.setHeader("X-Export-Total", String(total));
      res.send(buffer);
    } catch (err) { handle(res, err); }
  },
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const caso = await qdService.crear(parsed.data, usuarioDe(req));
      res.status(201).json({ ok: true, data: caso });
    } catch (err) { handle(res, err); }
  },
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = actualizarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const caso = await qdService.actualizar(req.params.id, parsed.data, usuarioDe(req));
      res.json({ ok: true, data: caso });
    } catch (err) { handle(res, err); }
  },

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const caso = await qdService.eliminar(req.params.id, usuarioDe(req));
      res.json({ ok: true, data: caso });
    } catch (err) { handle(res, err); }
  },

  /**
   * Carga retroactiva (BACKFILL) del histórico real de Quejas y Devoluciones.
   * Body: { desde: "YYYY-MM-DD", hasta: "YYYY-MM-DD" }.
   * Idempotente: re-ejecutar el mismo rango no duplica casos.
   */
  async backfill(req: Request, res: Response, next: NextFunction) {
    try {
      const desde = String(req.body?.desde ?? "").trim();
      const hasta = String(req.body?.hasta ?? "").trim();
      if (!desde || !hasta) {
        return res.status(400).json({ ok: false, error: "Se requieren 'desde' y 'hasta' (YYYY-MM-DD)" });
      }
      const resultado = await qdService.backfillQuejasDevoluciones(desde, hasta);
      res.json({ ok: true, data: resultado });
    } catch (err) { handle(res, err); }
  },

  async listarEstados(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await qdService.listarEstados() }); } catch (err) { next(err); }
  },
  async listarResultados(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await qdService.listarResultados() }); } catch (err) { next(err); }
  },
  async listarAreas(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await qdService.listarAreas() }); } catch (err) { next(err); }
  },
  async listarProductos(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await qdService.listarProductos() }); } catch (err) { next(err); }
  },
  async listarTiposQueja(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await qdService.listarTiposQueja() }); } catch (err) { next(err); }
  },

  /** Catálogo de dominios homologados (solo lectura). */
  async listarDominios(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: await qdService.listarDominios() }); } catch (err) { next(err); }
  },

  // ── CRUD de catálogos ──
  async crearCatalogo(req: Request, res: Response, next: NextFunction) {
    try {
      const tabla = (req.params.tabla as string) ?? "";
      const permitidas = ["estados", "resultados", "areas", "productos", "tipos-queja"];
      if (!permitidas.includes(tabla)) return res.status(400).json({ ok: false, error: "Catálogo no válido" });
      const nombre = (req.body?.nombre as string)?.trim();
      if (!nombre) return res.status(400).json({ ok: false, error: "Nombre requerido" });
      const nombreTabla = tabla === "tipos-queja" ? "qd_tipos_queja" : `qd_${tabla}`;
      const items = await qdRepository.listarCatalogo(nombreTabla);
      if (items.some((i) => i.nombre.toLowerCase() === nombre.toLowerCase())) {
        return res.status(409).json({ ok: false, error: "Ya existe un elemento con ese nombre" });
      }
      res.status(201).json({ ok: true, data: await qdRepository.crearCatalogo(nombreTabla, nombre) });
    } catch (err) { next(err); }
  },

  async actualizarCatalogo(req: Request, res: Response, next: NextFunction) {
    try {
      const tabla = (req.params.tabla as string) ?? "";
      const permitidas = ["estados", "resultados", "areas", "productos", "tipos-queja"];
      if (!permitidas.includes(tabla)) return res.status(400).json({ ok: false, error: "Catálogo no válido" });
      const nombreTabla = tabla === "tipos-queja" ? "qd_tipos_queja" : `qd_${tabla}`;
      const patch: { nombre?: string; activo?: boolean; orden?: number } = {};
      if (req.body?.nombre !== undefined) patch.nombre = String(req.body.nombre).trim();
      if (req.body?.activo !== undefined) patch.activo = Boolean(req.body.activo);
      if (req.body?.orden !== undefined) patch.orden = Number(req.body.orden);
      await qdRepository.actualizarCatalogo(nombreTabla, req.params.id, patch);
      res.json({ ok: true });
    } catch (err) { next(err); }
  },
};
