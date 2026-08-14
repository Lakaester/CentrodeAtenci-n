import { Request, Response, NextFunction } from "express";
import { ZendeskTestService } from "./ZendeskTestService";
import { ZendeskInboxService } from "./ZendeskInboxService";
import { ZendeskTicketService } from "./ZendeskTicketService";
import { ZendeskCustomerService } from "./ZendeskCustomerService";
import { ZendeskActionsService } from "./ZendeskActionsService";
import { AtencionViewModelService } from "./AtencionViewModelService";

import { AtencionCompletaService } from "./AtencionCompletaService";
import { ClientStore } from "./ClientStore";
import { AgentStore } from "./AgentStore";
import { CustomerMemory } from "./CustomerMemory";

const testService = new ZendeskTestService();
const inboxService = new ZendeskInboxService();
const ticketService = new ZendeskTicketService();
const customerService = new ZendeskCustomerService();
const actionsService = new ZendeskActionsService();
const viewModelService = new AtencionViewModelService();
const atencionCompletaService = new AtencionCompletaService();

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

  async atencionCompleta(req: Request, res: Response, next: NextFunction) {
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
      const { body, autor } = req.body;
      if (isNaN(id) || !body || !autor) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const result = await actionsService.internalNote(id, body, autor);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  // ── Assign (39.7) ──
  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { assigneeId, autor } = req.body;
      if (isNaN(id) || !assigneeId || !autor) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const result = await actionsService.assign(id, assigneeId, autor);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  // ── Change Status (39.8) ──
  async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { status, autor, email } = req.body;
      if (isNaN(id) || !status || !autor) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const result = await actionsService.changeStatus(id, status, autor);
      // CustomerMemory: register resolution
      if (status === "solved" && email) {
        CustomerMemory.registrarResolucion(email, String(id));
      }
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  // ── Categorize (39.9) ──
  async categorize(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { categoria, subcategoria, autor, email } = req.body;
      if (isNaN(id) || !categoria || !autor) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const result = await actionsService.categorize(id, categoria, subcategoria ?? "", autor);
      // CustomerMemory: register category
      if (email && subcategoria) {
        CustomerMemory.registrarCategoria(email, categoria, subcategoria);
      }

      // Integración Quejas y Devoluciones: si la categoría es QUEJA o DEVOLUCIÓN,
      // crear o reutilizar el caso (sin duplicados por ticket+tipo ni por hilo follow_up).
      const casoCreado = await crearCasoDesdeCategoria(req, String(id), categoria, subcategoria, autor);
      res.json({ ok: true, data: { ...result, caso: casoCreado?.caso ?? null, casoReutilizado: casoCreado?.reutilizado ?? false } });
    } catch (err) { next(err); }
  },

  // ── Reply (40.0) ──
  async reply(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { body, autor } = req.body;
      if (isNaN(id) || !body || !autor) return res.status(400).json({ ok: false, error: "Faltan datos" });
      const result = await actionsService.reply(id, body, autor);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  // ── Reply + Upload + Resolve ──
  async replyResolve(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { body, autor, resolver, archivos } = req.body;
      if (isNaN(id) || !body || !autor) return res.status(400).json({ ok: false, error: "Faltan datos" });

      const files = (archivos ?? []).map((a: any) => ({
        nombre: a.nombre,
        buffer: Buffer.from(a.base64 || "", "base64"),
        contentType: a.contentType ?? "application/octet-stream",
      }));

      // Validate buffers
      for (const f of files) {
        if (f.buffer.length === 0) throw new Error(`Archivo vacío: ${f.nombre}`);
      }

      const result = await actionsService.responderYResolver(id, body, autor, files, resolver);
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

/** Crea (o reutiliza) un caso de Quejas y Devoluciones cuando la categoría del ticket es QUEJA o DEVOLUCIÓN. */
async function crearCasoDesdeCategoria(req: Request, ticketId: string, categoria: string, subcategoria: string, autor: string) {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const cat = norm(categoria);
  const sub = norm(subcategoria);

  if (cat !== "queja" && cat !== "devolucion" && cat !== "gestion") return null;
  if (cat === "gestion" && !(sub.includes("queja") || sub.includes("devolucion"))) return null;

  const tipo = (cat === "queja" || sub.includes("queja")) ? "queja" : "devolucion";

  // Derivar clasificación de queja desde la subcategoría cuando sea posible.
  let clasificacion = null;
  if (tipo === "queja") {
    if (sub.includes("servicio")) clasificacion = "Servicio";
    else if (sub.includes("producto")) clasificacion = "Producto";
    else if (sub.includes("otro")) clasificacion = "Otro";
  }

  // Identificador relacional del hilo: consultamos el ticket real en Zendesk
  // para obtener via.source.from.ticket_id (rel === "follow_up") y el dominio
  // del ticket (custom field), fuente confiable para el caso Q/D.
  let ticketPadreId: string | null = null;
  let dominioTicket: string | null = null;
  let paisTicket: string | null = null;
  const numId = Number(ticketId);
  if (!isNaN(numId)) {
    try {
      const detalle = await ticketService.obtenerTicket(numId);
      ticketPadreId = detalle?.ticketPadreId ?? null;
      dominioTicket = detalle?.dominio ?? null;
      paisTicket = detalle?.pais ?? null;
    } catch {
      // Si no se puede consultar, continuar sin ticket padre.
    }
  }

  const { qdService } = await import("../../services/quejasDevoluciones.service");
  try {
    // El dominio se toma del ticket real; solo si el cliente lo envía explícito
    // en el body se prefiere ese valor (ambos son válidos si no están vacíos).
    const dominio = (req.body as any)?.dominio?.trim() ? String((req.body as any).dominio).trim() : dominioTicket;
    const resultado = await qdService.crearDesdeCategorizacion({
      ticketId,
      ticketPadreId,
      tipo,
      asesor: autor,
      dominio,
      pais: (req.body as any)?.pais ?? paisTicket,
      estado: "Pendiente de conciliación",
      ...(clasificacion ? { clasificacion } : {}),
    }, autor);
    return resultado;
  } catch (err: any) {
    // Si ya existe un caso para este ticket+tipo, no fallar la categorización.
    if (err?.code === "CASO_DUPLICADO") return null;
    // Sin dominio identificado: no crear caso incompleto; registrar el pendiente.
    if (err?.code === "DOMINIO_REQUERIDO") {
      console.warn(`[QD] Caso pendiente por falta de dominio del ticket #${ticketId}`);
      return null;
    }
    console.error(`[QD] No se pudo crear caso desde categorización: ${err?.message}`);
    return null;
  }
}
