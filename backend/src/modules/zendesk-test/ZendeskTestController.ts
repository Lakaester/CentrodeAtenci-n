import { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../../middlewares/auth.middleware";
import { ZendeskTestService } from "./ZendeskTestService";
import { ZendeskInboxService } from "./ZendeskInboxService";
import { ZendeskTicketService } from "./ZendeskTicketService";
import { ZendeskCustomerService } from "./ZendeskCustomerService";
import { ZendeskActionsService } from "./ZendeskActionsService";
import { AtencionViewModelService } from "./AtencionViewModelService";

import { AtencionCompletaService } from "./AtencionCompletaService";
import { ClientStore } from "./ClientStore";
import { AgentStore } from "./AgentStore";
import { clasificarCategoriaQyd, clasificacionQuejaDesdeSubcategoria } from "../../services/quejasCasos.service";
import { fechaOrigenExacta } from "../../utils/fechaQyd";
import { obtenerContextoQydLocal } from "../../services/qydContextoLocal.service";
import { CustomerMemory } from "./CustomerMemory";
import { atencionOperativaService } from "../../integrations/atenciones/services/AtencionOperativaService";
import { normalizeDomain, isValidDomainFormat } from "../../domain/contacto/normalizacion";
import { env } from "../../config/env";
import { authService } from "../../services/auth.service";
import { identidadDe, type IdentidadUsuario } from "./identidad";

const testService = new ZendeskTestService();
const inboxService = new ZendeskInboxService();
const ticketService = new ZendeskTicketService();
const customerService = new ZendeskCustomerService();
const actionsService = new ZendeskActionsService();
const viewModelService = new AtencionViewModelService();
const atencionCompletaService = new AtencionCompletaService();

function usuarioDe(req: Request): string | null {
  return identidadDe(req)?.etiqueta ?? null;
}

/** Auditoría operativa con identidad autenticada. No falla la acción de Zendesk. */
async function auditarAtencion(
  ticketId: string,
  identidad: IdentidadUsuario,
  accion: string,
  detalle: string,
  campo?: string | null,
  valorNuevo?: string | null,
): Promise<void> {
  try {
    await atencionOperativaService.registrarAccion(ticketId, {
      accion,
      detalle,
      campo: campo ?? null,
      valorNuevo: valorNuevo ?? null,
      usuario: identidad.etiqueta,
      origen: "zendesk",
    });
  } catch (err) {
    console.error(`[Operativa] No se pudo registrar ${accion} #${ticketId}:`, err);
  }
}

export const zendeskTestController = {
  async test(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await testService.testConnection();
      if (!result.success) {
        const status = result.error?.httpStatus ?? 502;
        return res.status(status).json({ ok: false, conectado: false, error: result.error, timingMs: result.timing });
      }
      res.json({ ok: true, conectado: true, data: result.data, timingMs: result.timing, mensaje: `Conexión exitosa. Usuario: ${result.data?.nombre}` });
    } catch (err) { next(err); }
  },

  async inbox(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inboxService.obtenerInbox();
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  async views(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inboxService.obtenerInbox();
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  async atencionCompletaViewModel(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ ok: false, error: "ID inválido" });
      const viewModel = await viewModelService.assemble(id);
      if (!viewModel) return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
      res.json({ ok: true, data: viewModel });
    } catch (err) { next(err); }
  },

  async ticketDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ ok: false, error: "ID inválido" });
      const ticket = await ticketService.obtenerTicket(id);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket no encontrado en Zendesk" });
      res.json({ ok: true, data: ticket });
    } catch (err) { next(err); }
  },

  async customer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ ok: false, error: "ID inválido" });
      const cliente = await customerService.obtenerCliente(id);
      if (!cliente) return res.status(404).json({ ok: false, error: "Usuario no encontrado en Zendesk" });
      res.json({ ok: true, data: cliente });
    } catch (err) { next(err); }
  },

  // ── Customer Timeline (39.5) ──
  async customerTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ ok: false, error: "ID inválido" });
      const timeline = await actionsService.timelineCliente(id);
      res.json({ ok: true, data: timeline });
    } catch (err) { next(err); }
  },

  // ── Agents list (39.7) ──
  async agents(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await actionsService.listarAgentes();
      res.json({ ok: true, data: agents });
    } catch (err) { next(err); }
  },

  // ── Internal Note (39.6) ──
  async internalNote(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { body } = req.body;
      if (isNaN(id) || !body) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const identidad = identidadDe(req);
      if (!identidad) return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
      const result = await actionsService.internalNote(id, body, identidad.etiqueta);
      await auditarAtencion(String(id), identidad, "nota_interna", "Nota interna agregada", "nota");
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  // ── Assign (39.7) ──
  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { assigneeId } = req.body;
      if (isNaN(id) || !assigneeId) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const identidad = identidadDe(req);
      if (!identidad) return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
      const result = await actionsService.assign(id, assigneeId, identidad.etiqueta);
      await auditarAtencion(String(id), identidad, "asignacion", `Asignado a ${assigneeId}`, "asesor", String(assigneeId));
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  // ── Change Status (39.8) ──
  async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { status, email } = req.body;
      if (isNaN(id) || !status) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const identidad = identidadDe(req);
      if (!identidad) return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
      const result = await actionsService.changeStatus(id, status, identidad.etiqueta);
      // CustomerMemory: register resolution
      if (status === "solved" && email) {
        CustomerMemory.registrarResolucion(email, String(id));
      }

      // ── Registro operativo COPE: estado + resolución/cierre ──
      await auditarAtencion(
        String(id),
        identidad,
        status === "solved" ? "resolucion" : status === "closed" ? "cierre" : "cambio_estado",
        `Estado: ${status}`,
        "estado",
        status,
      );

      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  // ── Categorize (39.9) ──
  async categorize(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { categoria, subcategoria, email } = req.body;
      if (isNaN(id) || !categoria) return res.status(400).json({ ok: false, error: "Faltan datos" });

      // Identidad SIEMPRE desde la sesión autenticada. body.autor se ignora.
      const identidad = identidadDe(req);
      if (!identidad) {
        return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
      }
      const usuario = identidad.etiqueta;
      const nombreAsesor = identidad.nombreCompleto;

      // 1) Persistir la categoría en Zendesk.
      const result = await actionsService.categorize(id, categoria, subcategoria ?? "", usuario);

      // CustomerMemory: registro en memoria; no es fuente de verdad.
      if (email && subcategoria) {
        CustomerMemory.registrarCategoria(email, categoria, subcategoria);
      }

      // 2) Persistir la clasificación en el snapshot operativo de COPE.
      //    Si falla, no responder como éxito: la categoría ya está en Zendesk
      //    y el reintento es idempotente.
      try {
        await atencionOperativaService.registrarClasificacion(String(id), {
          categoria,
          subcategoria: subcategoria ?? null,
          usuario,
          origen: "zendesk",
        });
      } catch (err) {
        console.error(`[Operativa] No se pudo registrar clasificación #${id}:`, err);
        return res.status(500).json({
          ok: false,
          error: {
            code: "ERROR_PERSISTENCIA_ATENCION",
            message: "La categoría se guardó en Zendesk, pero no se pudo persistir en COPE. Reintente.",
          },
          data: {
            ...result,
            caso: null,
            creado: false,
            reutilizado: false,
            motivo: "ERROR_PERSISTENCIA_ATENCION",
            expedientePendiente: true,
          },
        });
      }

      // 3) Flag de seguridad: la creación automática está deshabilitada por defecto.
      if (!env.QD_AUTO_CREATE_ENABLED) {
        return res.json({
          ok: true,
          data: {
            ...result,
            caso: null,
            creado: false,
            reutilizado: false,
            casoReutilizado: false,
            motivo: "AUTO_CREATE_DESHABILITADO",
            expedientePendiente: false,
            canal: null,
          },
        });
      }

      // 3.1) Autorización adicional para crear expedientes QyD.
      // La categorización ya quedó guardada; si no hay permiso QyD, no se crea
      // el expediente y queda pendiente para un usuario autorizado.
      const auth = (req as AuthedRequest).auth;
      if (!auth || !authService.hasPermiso(auth, "Quejas y Devoluciones", "crear")) {
        console.warn(`[QD] categoria ticket_id=${id} usuario=${usuario} resultado=SIN_PERMISO_QYD`);
        return res.json({
          ok: true,
          data: {
            ...result,
            caso: null,
            creado: false,
            reutilizado: false,
            casoReutilizado: false,
            motivo: "SIN_PERMISO_QYD",
            expedientePendiente: true,
            canal: null,
          },
        });
      }

      // 4) Integración Quejas y Devoluciones: crear o reutilizar el expediente.
      let casoCreado: Awaited<ReturnType<typeof crearCasoDesdeCategoria>>;
      try {
        casoCreado = await crearCasoDesdeCategoria(String(id), categoria, subcategoria, nombreAsesor, usuario);
      } catch (err) {
        console.error(`[QD] Error creando expediente para #${id}:`, err);
        return res.status(500).json({
          ok: false,
          error: {
            code: "ERROR_CREACION_EXPEDIENTE",
            message: "La categoría se guardó, pero no se pudo crear el expediente. El intento queda pendiente para reintento.",
          },
          data: {
            ...result,
            caso: null,
            creado: false,
            reutilizado: false,
            motivo: "ERROR_CREACION_EXPEDIENTE",
            expedientePendiente: true,
          },
        });
      }

      const motivo = casoCreado.motivoNoCreacion ?? null;
      const expedientePendiente = !casoCreado.caso && [
        "PENDIENTE_CANAL",
        "CANAL_NO_SOPORTADO",
        "PENDIENTE_DOMINIO",
        "PENDIENTE_RELACION",
        "PENDIENTE_ATENCION",
        "PENDIENTE_FECHA",
        "SIN_PERMISO_QYD",
      ].includes(motivo ?? "");

      res.json({
        ok: true,
        data: {
          ...result,
          caso: casoCreado.caso,
          creado: casoCreado.creado,
          reutilizado: casoCreado.reutilizado,
          // Compatibilidad con el frontend actual.
          casoReutilizado: casoCreado.reutilizado,
          motivo,
          expedientePendiente,
          canal: casoCreado.canal ?? null,
        },
      });
    } catch (err) { next(err); }
  },

  // ── Reply (40.0) ──
  async reply(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { body } = req.body;
      if (isNaN(id) || !body) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const identidad = identidadDe(req);
      if (!identidad) return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
      const result = await actionsService.reply(id, body, identidad.etiqueta);
      await auditarAtencion(String(id), identidad, "respuesta", "Respuesta enviada", "respuesta");
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  // ── Reply + Upload + Resolve ──
  async replyResolve(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { body, resolver, archivos } = req.body;
      if (isNaN(id) || !body) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const identidad = identidadDe(req);
      if (!identidad) return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });

      const files = (archivos ?? []).map((a: any) => ({
        nombre: a.nombre,
        buffer: Buffer.from(a.base64 || "", "base64"),
        contentType: a.contentType ?? "application/octet-stream",
      }));

      // Validate buffers
      for (const f of files) {
        if (f.buffer.length === 0) throw new Error(`Archivo vacío: ${f.nombre}`);
      }

      const result = await actionsService.responderYResolver(id, body, identidad.etiqueta, files, resolver);
      await auditarAtencion(
        String(id),
        identidad,
        resolver ? "respuesta_resolucion" : "respuesta",
        resolver ? "Respuesta enviada y ticket resuelto" : "Respuesta enviada",
        "respuesta",
      );
      res.json({ ok: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[replyResolve] Error #${req.params.id}: ${msg}`);
      res.status(500).json({ ok: false, error: msg });
    }
  },

  async ticketComments(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ ok: false, error: "ID inválido" });
      const ticket = await ticketService.obtenerTicket(id);
      const requesterId = ticket ? (ticket as any).requesterId : undefined;
      const comentarios = await ticketService.obtenerComentarios(id, requesterId);
      res.json({ ok: true, data: { ticketId: String(id), mensajes: comentarios, total: comentarios.length } });
    } catch (err) { next(err); }
  },

  async atencionCompleta(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ ok: false, error: "ID inválido" });
      const result = await atencionCompletaService.obtener(id);
      if (!result) return res.status(404).json({ ok: false, error: "Ticket no encontrado" });

      // CustomerMemory: auto-identify or create client
      if (result.ticket.clienteEmail) {
        const cliente = CustomerMemory.obtenerOCrear(result.ticket.clienteEmail, result.ticket.clienteNombre);
        if (result.ticket.dominio) {
          CustomerMemory.vincularDominio(result.ticket.clienteEmail, result.ticket.dominio);
        }
        // Add customer memory data to response
        (result as any).clienteCope = CustomerMemory.obtenerParaFrontend(result.ticket.clienteEmail);
      }

      // Auto-register domain and email when ticket is solved/closed
      if (result.ticket.dominio && result.ticket.clienteEmail) {
        ClientStore.registrar(result.ticket.clienteEmail, result.ticket.dominio);
      }

      // ── Registro operativo COPE: sincronizar snapshot por atención (no rompe el flujo) ──
      try {
        const operativa = await atencionOperativaService.sincronizarDesdeZendesk(
          String(id),
          {
            asunto: result.ticket.asunto,
            descripcion: result.ticket.descripcion,
            clienteEmail: result.ticket.clienteEmail,
            telefono: result.ticket.telefono,
            dominio: result.ticket.dominio,
            pais: result.ticket.pais,
            estado: result.ticket.ticketOriginalStatus,
            prioridad: result.ticket.prioridad,
            tipo: result.ticket.tipo,
            createdAt: result.ticket.createdAt,
            updatedAt: result.ticket.updatedAt,
            tags: result.ticket.tags,
            assigneeId: result.ticket.assigneeId,
            requesterId: result.ticket.requesterId,
            canal: result.ticket.canal,
            canalRaw: result.ticket.canalRaw,
            via: result.ticket.via,
            followupIds: result.ticket.followupIds,
            ticketPadreId: result.ticket.ticketPadreId,
            relacionVerificada: result.ticket.relacionVerificada,
          },
          { usuario: usuarioDe(req) },
        );
        (result as any).operativa = operativa;
      } catch (err) {
        console.error(`[Operativa] No se pudo sincronizar atención #${id}:`, err);
      }

      console.log(`[AtencionCompleta] #${id} — ${result.metrica.totalMs}ms`);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  async updateDomain(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { dominio, email } = req.body;
      if (isNaN(id) || !dominio) return res.status(400).json({ ok: false, error: "ID y dominio requeridos" });
      // Update in Zendesk via custom field
      const client = new (require("../zendesk/infrastructure/ZendeskClient").ZendeskClient)();
      await client.actualizarCampos(id, [{ id: 40769061038615, value: dominio }]);
      // Register in local store
      if (email) ClientStore.registrar(email, dominio);

      // ── Registro operativo COPE: snapshot de identificación ──
      try {
        const d = normalizeDomain(dominio);
        if (d && isValidDomainFormat(d)) {
          await atencionOperativaService.registrarIdentificacion(String(id), {
            contactoTipo: "email",
            contactoValor: email ?? undefined,
            dominio: d,
            tipoIdentificacion: "MANUAL",
            usuario: usuarioDe(req),
          });
        }
      } catch (err) {
        console.error(`[Operativa] No se pudo registrar dominio #${id}:`, err);
      }

      res.json({ ok: true, data: { ticketId: id, dominio } });
    } catch (err) { next(err); }
  },

  async getClientInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({ ok: false, error: "Email requerido" });
      const data = ClientStore.obtener(email);
      res.json({ ok: true, data: data ?? { dominios: [], primerContacto: null, ultimoContacto: null, totalTickets: 0 } });
    } catch (err) { next(err); }
  },

  async addClientDomain(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, dominio } = req.body;
      if (!email || !dominio) return res.status(400).json({ ok: false, error: "Email y dominio requeridos" });
      ClientStore.agregarDominio(email, dominio);
      res.json({ ok: true, data: ClientStore.obtener(email) });
    } catch (err) { next(err); }
  },

  async getAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const force = req.query.sync === "true";
      const agents = await AgentStore.obtenerAgentes(force);
      res.json({ ok: true, data: agents });
    } catch (err) { next(err); }
  },

  // ── Customer Memory (COPE-010) ──
  async getCustomerMemory(req: Request, res: Response, next: NextFunction) {
    try {
      const correo = req.query.correo as string;
      if (!correo) return res.status(400).json({ ok: false, error: "Correo requerido" });
      const data = CustomerMemory.obtenerParaFrontend(correo);
      if (!data) return res.json({ ok: true, data: null });
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },

  async linkDomainCustomerMemory(req: Request, res: Response, next: NextFunction) {
    try {
      const { correo, dominio } = req.body;
      if (!correo || !dominio) return res.status(400).json({ ok: false, error: "Correo y dominio requeridos" });
      CustomerMemory.vincularDominio(correo, dominio);
      res.json({ ok: true, data: CustomerMemory.obtenerParaFrontend(correo) });
    } catch (err) { next(err); }
  },

  async checkDomainSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const correo = req.query.correo as string;
      if (!correo) return res.status(400).json({ ok: false, error: "Correo requerido" });
      const sugerencia = CustomerMemory.sugerirVinculacion(correo);
      res.json({ ok: true, data: sugerencia });
    } catch (err) { next(err); }
  },

  // ── Customer History (COPE-004) ──
  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = Number(req.params.requesterId);
      if (isNaN(requesterId)) return res.status(400).json({ ok: false, error: "ID de cliente inválido" });
      const result = await customerService.obtenerHistorial(requesterId);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },
};

type ResultadoCategoriaQyd = {
  caso: any | null;
  creado: boolean;
  reutilizado: boolean;
  interaccionAsociada: boolean;
  motivoNoCreacion: string | null;
  canal: string | null;
};

/** Crea (o reutiliza) un caso de Quejas y Devoluciones cuando la categoría del ticket es QUEJA o DEVOLUCIÓN. */
async function crearCasoDesdeCategoria(
  ticketId: string,
  categoria: string,
  subcategoria: string,
  autor: string,
  usuarioAudit: string,
): Promise<ResultadoCategoriaQyd> {
  // FIX QYD realtime: clasificación de las 4 categorías QyD (QUEJA / RECLAMO /
  // SOLICITUD DE DEVOLUCIÓN / QUEJA Y DEVOLUCIÓN + variantes de mayúsculas/tildes/separadores).
  const clasificacionCat = clasificarCategoriaQyd(categoria, subcategoria);
  if (!clasificacionCat) {
    logQyd(ticketId, categoria, subcategoria, null, null, null, "NOT_QYD_CATEGORY");
    return { caso: null, creado: false, reutilizado: false, interaccionAsociada: false, motivoNoCreacion: "NO_ELEGIBLE", canal: null };
  }
  const tipo = clasificacionCat.tipo;

  // Derivar clasificación de queja desde la subcategoría cuando sea posible.
  const clasificacion = clasificacionQuejaDesdeSubcategoria(tipo, subcategoria);

  // Fuente de verdad local: PostgreSQL (atención + vista normalizada +
  // relaciones verificadas). No se consulta la API de Zendesk en este flujo.
  const contexto = await obtenerContextoQydLocal(ticketId);
  const canal = contexto?.canal ?? null;
  const canalRaw = contexto?.canalRaw ?? null;
  const fechaSolicitud = fechaOrigenExacta(contexto?.fechaOriginalIso ?? null);

  const pendiente = (motivo: string): ResultadoCategoriaQyd => {
    const motivoFinal = motivo === "PENDIENTE_CANAL" && canalRaw && !canal
      ? "CANAL_NO_SOPORTADO"
      : motivo;
    logQyd(
      ticketId, categoria, subcategoria, contexto?.estado ?? null,
      contexto?.dominio ?? null, canal ?? null, motivoFinal,
    );
    return {
      caso: null,
      creado: false,
      reutilizado: false,
      interaccionAsociada: false,
      motivoNoCreacion: motivoFinal,
      canal: canal ?? null,
    };
  };

  if (!contexto) return pendiente("PENDIENTE_ATENCION");
  if (!fechaSolicitud) return pendiente("PENDIENTE_FECHA");
  if (!canal) return pendiente("PENDIENTE_CANAL");
  // Sin dominio no bloquea: se crea/reutiliza el expediente como SIN DOMINIO
  // y queda CERRADO. La relación solo se exige cuando hay un padre/follow-up
  // conocido que no se pudo verificar; la ausencia total de relación no impide
  // crear una raíz independiente (flujo multicanal PostgreSQL).
  const sinRelacionConocida = !contexto.ticketPadreId
    && (contexto.followupIds ?? []).length === 0;
  if (!sinRelacionConocida && !contexto.relacionVerificada) {
    return pendiente("PENDIENTE_RELACION");
  }

  const { qdService } = await import("../../services/quejasDevoluciones.service");
  try {
    const resultado = await qdService.crearDesdeCategorizacion({
      ticketId,
      ticketPadreId: contexto.ticketPadreId,
      followupIds: contexto.followupIds,
      relacionVerificada: contexto.relacionVerificada,
      tipo,
      asesor: contexto.asesor ?? autor,
      dominio: contexto.dominio,
      dominioOriginal: contexto.dominioOriginal,
      pais: contexto.pais,
      estado: contexto.dominio ? "Pendiente de conciliación" : undefined,
      estadoTicket: contexto.estado,
      canal,
      fechaSolicitud,
      permitirZendesk: false,
      permitirSinRelacionVerificada: sinRelacionConocida,
      ...(clasificacion ? { clasificacion } : {}),
    }, usuarioAudit);

    let motivo = resultado?.motivoNoCreacion ?? null;
    if (motivo === "PENDIENTE_CANAL" && canalRaw && !canal) motivo = "CANAL_NO_SOPORTADO";

    logQyd(
      ticketId, categoria, subcategoria, contexto.estado, contexto.dominio, canal,
      resultado?.creado ? "CREATED" : (resultado?.reutilizado ? "ALREADY_EXISTS" : (motivo ?? "ERROR")),
    );
    return {
      caso: resultado?.caso ?? null,
      creado: resultado?.creado ?? false,
      reutilizado: resultado?.reutilizado ?? false,
      interaccionAsociada: resultado?.interaccionAsociada ?? false,
      motivoNoCreacion: motivo,
      canal,
    };
  } catch (err: any) {
    // Si ya existe un caso para este ticket+tipo, no fallar la categorización.
    if (err?.code === "CASO_DUPLICADO") {
      const existente = await qdService.porTicketGeneral(ticketId, tipo);
      logQyd(ticketId, categoria, subcategoria, contexto.estado, null, canal, "ALREADY_EXISTS");
      return {
        caso: existente,
        creado: false,
        reutilizado: !!existente,
        interaccionAsociada: false,
        motivoNoCreacion: existente ? null : "YA_EXISTE",
        canal,
      };
    }
    // Sin dominio identificado: no crear caso incompleto; registrar el pendiente.
    if (err?.code === "DOMINIO_REQUERIDO") {
      logQyd(ticketId, categoria, subcategoria, contexto.estado, null, canal, "INVALID_DOMAIN");
      return { caso: null, creado: false, reutilizado: false, interaccionAsociada: false, motivoNoCreacion: "PENDIENTE_DOMINIO", canal };
    }
    logQyd(ticketId, categoria, subcategoria, contexto.estado, null, canal, "ERROR");
    throw err;
  }
}

/** Log del procesamiento de un ticket candidato QyD. Sin secretos. */
function logQyd(
  ticketId: string,
  categoriaOriginal: string,
  subcategoria: string,
  estado: string | null,
  dominio: string | null,
  canal: string | null,
  resultado: string,
) {
  // eslint-disable-next-line no-console
  console.warn(
    `[QD] categoria ticket_id=${ticketId} canal=${canal ?? "?"} estado=${estado ?? "?"} ` +
    `categoria_original=${categoriaOriginal} subcategoria=${subcategoria ?? ""} ` +
    `categoria_normalizada=${clasificarCategoriaQyd(categoriaOriginal, subcategoria)?.categoria ?? "no_qyd"} ` +
    `dominio=${dominio ?? "?"} resultado=${resultado}`,
  );
}
