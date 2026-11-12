import { ZendeskClient } from "../zendesk/infrastructure/ZendeskClient";
import { ZendeskMapper } from "../zendesk/application/mapper/ZendeskMapper";
import { normalizeDomain, isValidDomainFormat } from "../../domain/contacto/normalizacion";
import { normalizarCanal } from "../../services/quejasCasos.service";

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

    // Identificador relacional de hilo: via.source.rel === "follow_up" indica
    // que este ticket responde a un ticket previo (via.source.from.ticket_id).
    // Sin `via.source` la respuesta es incompleta y no debe fijar la relación.
    const relacionVerificada = !!ticket.via?.source;
    const followupsVerificados = Array.isArray(ticket.followup_ids);
    const esFollowUp = ticket.via?.source?.rel === "follow_up";
    const ticketPadreId = esFollowUp ? ticket.via?.source?.from?.ticket_id : null;

    // Dominio y país desde custom fields (mismos ids que AtencionCompletaService).
    const cfMap = new Map((ticket.custom_fields ?? []).map((cf: any) => [cf.id, cf.value]));
    const dominioVal = cfMap.get(40769061038615);
    const paisVal = cfMap.get(1500005211481);
    const categoriaVal = cfMap.get(38744095836311);
    const dominioCrudo = dominioVal && String(dominioVal).trim() ? String(dominioVal).trim() : null;
    // Fuente de verdad del cliente: hostname válido del ticket. Un correo, una
    // URL inválida o un valor centinela no se aceptan como dominio.
    const dominio = dominioCrudo && isValidDomainFormat(dominioCrudo) ? normalizeDomain(dominioCrudo) : null;
    const pais = paisVal && String(paisVal).trim() ? String(paisVal).trim() : null;
    const categoriaZendesk = categoriaVal && String(categoriaVal).trim() ? String(categoriaVal).trim() : null;
    const canalRaw = ticket.via?.channel ?? null;
    const canal = normalizarCanal(canalRaw);

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
      esFollowUp,
      relacionVerificada,
      followupsVerificados,
      ticketPadreId: ticketPadreId != null ? String(ticketPadreId) : null,
      followupIds: (ticket.followup_ids ?? []).map(String),
      dominio,
      pais,
      canal,
      canalRaw,
      categoriaZendesk,
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
