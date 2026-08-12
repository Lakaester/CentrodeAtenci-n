import { ZendeskClient } from "../zendesk/infrastructure/ZendeskClient";
import { ZendeskMapper } from "../zendesk/application/mapper/ZendeskMapper";

export class ZendeskTicketService {
  private client: ZendeskClient;

  constructor() {
    this.client = new ZendeskClient();
  }

  async obtenerTicket(id: number) {
    const ticket = await this.client.obtenerTicket(id);
    if (!ticket) return null;

    let nombreCliente = "Usuario Zendesk";
    let emailCliente: string | null = null;
    if (ticket.requester_id) {
      try {
        const usuario = await this.client.obtenerUsuario(ticket.requester_id);
        if (usuario) {
          nombreCliente = usuario.name;
          emailCliente = usuario.email;
        }
      } catch {
        // If rate limited, use fallback
      }
    }

    return {
      id: String(ticket.id),
      ticketOriginalId: String(ticket.id),
      ticketOriginalStatus: ticket.status,
      asunto: ticket.subject,
      descripcion: ticket.description,
      prioridad: ticket.priority,
      tipo: ticket.type,
      clienteNombre: nombreCliente,
      clienteEmail: emailCliente,
      requesterId: ticket.requester_id,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      tags: ticket.tags,
      url: `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/agent/tickets/${ticket.id}`,
    };
  }

  async obtenerComentarios(ticketId: number, requesterId?: number) {
    const comments = await this.client.obtenerComentarios(ticketId);
    const authorIds = [...new Set(comments.map((c) => c.author_id))];
    let usuarioMap = new Map<number, { name: string; role: string }>();
    try {
      const usuarios = await this.client.obtenerUsuarios(authorIds);
      usuarioMap = new Map(usuarios.map((u) => [u.id, { name: u.name, role: u.role }]));
    } catch {
      // If rate limited, show generic names
    }

    return comments.map((c) => {
      const autor = usuarioMap.get(c.author_id);
      const esCliente = autor
        ? autor.role === "end-user"
        : c.author_id === requesterId;
      return {
        id: String(c.id),
        contenido: c.body,
        emisor: autor?.name ?? (esCliente ? "Cliente" : "Agente"),
        tipo: esCliente ? "cliente" : "agente",
        timestamp: c.created_at,
        adjuntos: c.attachments.map((a) => ({
          id: String(a.id),
          nombre: a.file_name,
          url: a.content_url,
        })),
      };
    });
  }
}
