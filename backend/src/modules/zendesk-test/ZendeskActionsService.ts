import { ZendeskClient } from "../zendesk/infrastructure/ZendeskClient";

export class ZendeskActionsService {
  private client: ZendeskClient;

  constructor() {
    this.client = new ZendeskClient();
  }

  async internalNote(ticketId: number, body: string, autor: string) {
    const ticket = await this.client.agregarComentario(ticketId, body, false);
    if (!ticket) throw new Error("No se pudo agregar la nota interna");
    console.log(`[ZendeskActions] Nota interna agregada al ticket ${ticketId} por ${autor}`);
    return { success: true, ticketId: String(ticketId), tipo: "nota_interna" };
  }

  async assign(ticketId: number, assigneeId: number, autor: string) {
    const ticket = await this.client.asignarTicket(ticketId, assigneeId);
    if (!ticket) throw new Error("No se pudo asignar el ticket");
    console.log(`[ZendeskActions] Ticket ${ticketId} asignado a ${assigneeId} por ${autor} — nuevo estado: ${ticket.status}`);
    return {
      success: true,
      ticketId: String(ticketId),
      nuevoAsignado: assigneeId,
      nuevoEstado: ticket.status,
    };
  }

  async changeStatus(ticketId: number, status: string, autor: string) {
    const valido = ["new", "open", "pending", "solved", "closed"];
    if (!valido.includes(status)) throw new Error(`Estado inválido: ${status}`);
    const ticket = await this.client.cambiarEstado(ticketId, status);
    if (!ticket) throw new Error("No se pudo cambiar el estado");
    return {
      success: true,
      ticketId: String(ticketId),
      nuevoEstado: ticket.status,
    };
  }

  async categorize(ticketId: number, categoria: string, subcategoria: string, autor: string) {
    // Only send the subcategory to Zendesk (field: Categoría de Soporte, id: 38744095836311)
    const ticket = await this.client.actualizarCampos(ticketId, [
      { id: 38744095836311, value: subcategoria },
    ]);
    if (!ticket) throw new Error("No se pudo categorizar el ticket");
    console.log(`[ZendeskActions] Ticket ${ticketId} categorizado: ${categoria}/${subcategoria} por ${autor}`);
    return { success: true, ticketId: String(ticketId), categoria, subcategoria };
  }

  async reply(ticketId: number, body: string, autor: string) {
    const ticket = await this.client.agregarComentario(ticketId, body, true);
    if (!ticket) throw new Error("No se pudo responder el ticket");
    console.log(`[ZendeskActions] Ticket ${ticketId} respondido por ${autor}`);
    return { success: true, ticketId: String(ticketId), tipo: "respuesta", nuevoEstado: ticket.status };
  }

  /** Reply + upload files + optionally resolve, all in one call */
  async responderYResolver(
    ticketId: number,
    body: string,
    autor: string,
    archivos?: { nombre: string; buffer: Buffer; contentType: string }[],
    resolver?: boolean,
  ) {
    // Step 1: upload files
    const tokens: string[] = [];
    if (archivos && archivos.length > 0) {
      for (const f of archivos) {
        const token = await this.client.subirArchivo(f.buffer, f.nombre, f.contentType);
        if (!token) throw new Error(`Error al subir ${f.nombre}`);
        tokens.push(token);
      }
    }

    // Step 2: reply + optionally resolve
    const nuevoStatus = resolver ? "solved" : undefined;
    const ticket = await this.client.responderYResolver(ticketId, body, tokens, nuevoStatus);
    if (!ticket) throw new Error("No se pudo enviar la respuesta");

    console.log(`[ZendeskActions] Ticket ${ticketId} respondido${resolver ? " y resuelto" : ""} por ${autor} — estado: ${ticket.status}`);
    return {
      success: true,
      ticketId: String(ticketId),
      nuevoEstado: ticket.status,
      tipo: resolver ? "respuesta+resolver" : "respuesta",
    };
  }

  async uploadFile(ticketId: number, fileBuffer: Buffer, filename: string, contentType: string) {
    const token = await this.client.subirArchivo(fileBuffer, filename, contentType);
    if (!token) throw new Error(`Error al subir ${filename}`);
    return { success: true, token };
  }

  async listarAgentes() {
    const users = await this.client.listarAgentes();
    return users.map((u) => ({
      id: u.id,
      nombre: u.name,
      email: u.email,
    }));
  }

  async timelineCliente(requesterId: number) {
    const result = await this.client.listarTicketsPorSolicitante(requesterId);
    return result.tickets
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 15)
      .map((t) => ({
        ticketId: String(t.id),
        asunto: t.subject,
        estado: t.status,
        prioridad: t.priority,
        fecha: t.created_at,
        canal: "zendesk",
      }));
  }
}
