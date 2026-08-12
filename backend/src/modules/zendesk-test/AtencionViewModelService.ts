import { ZendeskClient } from "../zendesk/infrastructure/ZendeskClient";
import type { AtencionViewModel } from "./AtencionViewModel";

export class AtencionViewModelService {
  private client: ZendeskClient;

  constructor() {
    this.client = new ZendeskClient();
  }

  async assemble(ticketId: number): Promise<AtencionViewModel | null> {
    const ticket = await this.client.obtenerTicket(ticketId);
    if (!ticket) return null;

    const [comments, requester, org, ticketsData] = await Promise.all([
      this.client.obtenerComentarios(ticketId),
      ticket.requester_id ? this.client.obtenerUsuario(ticket.requester_id) : Promise.resolve(null),
      ticket.organization_id ? this.client.obtenerOrganizacion(ticket.organization_id) : Promise.resolve(null),
      ticket.requester_id ? this.client.listarTicketsPorSolicitante(ticket.requester_id) : Promise.resolve({ tickets: [], total: 0 }),
    ]);

    const abiertos = ticketsData.tickets.filter((t) => t.status !== "closed" && t.status !== "solved");
    const ultimosTickets = ticketsData.tickets
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10)
      .map((t) => ({ ticketId: String(t.id), asunto: t.subject, estado: t.status, fecha: t.created_at }));

    return {
      id: String(ticketId),
      canal: "zendesk",
      ticket: {
        id: String(ticket.id),
        ticketOriginalId: String(ticket.id),
        ticketOriginalStatus: ticket.status,
        asunto: ticket.subject,
        descripcion: ticket.description,
        prioridad: ticket.priority,
        tipo: ticket.type,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        tags: ticket.tags,
        url: `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/agent/tickets/${ticket.id}`,
      },
      cliente: {
        id: requester ? String(requester.id) : "",
        nombre: requester?.name ?? "Usuario Zendesk",
        correo: requester?.email ?? "",
        telefono: requester?.phone ?? null,
        empresa: org?.name ?? null,
        rol: requester?.role ?? "end_user",
        fechaCreacion: requester?.created_at ?? "",
        ultimaActividad: ticketsData.tickets.length > 0
          ? ticketsData.tickets.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0].updated_at
          : null,
        totalTickets: ticketsData.total,
        ticketsAbiertos: abiertos.length,
        ultimosTickets,
      },
      comentarios: comments.map((c) => ({
        id: String(c.id),
        contenido: c.body,
        emisor: `Usuario #${c.author_id}`,
        tipo: c.public ? "cliente" as const : "agente" as const,
        timestamp: c.created_at,
        publico: c.public,
        adjuntos: c.attachments.map((a) => ({ id: String(a.id), nombre: a.file_name, url: a.content_url })),
      })),
      totalComentarios: comments.length,
    };
  }
}
