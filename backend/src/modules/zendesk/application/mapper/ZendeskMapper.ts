/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
/**
 * ZendeskMapper â€” Anti Corruption Layer.
 * Traduce modelos internos de Zendesk a DTOs de frontera de COPE.
 * NingÃºn modelo Zendesk cruza esta frontera.
 */
import type { ZendeskTicket, ZendeskUser, ZendeskComment } from "../../domain/ZendeskTypes";
import type { TicketZendeskDTO, MensajeZendeskDTO, ClienteZendeskDTO, BandejaZendeskDTO, ConversacionZendeskDTO } from "../dto/ZendeskDTOs";

export class ZendeskMapper {
  static ticketToDTO(ticket: ZendeskTicket, usuario?: ZendeskUser): TicketZendeskDTO {
    const catField = ticket.custom_fields?.find((f: any) => f.id === 360000000001);
    const subField = ticket.custom_fields?.find((f: any) => f.id === 360000000002);
    return {
      id: String(ticket.id),
      ticketOriginalId: String(ticket.id),
      ticketOriginalStatus: ticket.status,
      asunto: ticket.subject,
      descripcion: ticket.description,
      prioridad: ticket.priority,
      tipo: ticket.type,
      clienteId: usuario ? String(usuario.id) : undefined,
      clienteNombre: usuario?.name ?? "Usuario Zendesk",
      clienteEmail: usuario?.email,
      clienteTelefono: usuario?.phone,
      pais: usuario?.organization_id ? `Org #${usuario.organization_id}` : undefined,
      dominio: undefined,
      categoria: catField?.value as string | undefined,
      subcategoria: subField?.value as string | undefined,
      etiquetas: ticket.tags,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  }

  static commentToDTO(comment: ZendeskComment, usuarios: Map<number, ZendeskUser>): MensajeZendeskDTO {
    const autor = usuarios.get(comment.author_id);
    return {
      id: String(comment.id),
      contenido: comment.body,
      emisor: autor?.name ?? `Usuario #${comment.author_id}`,
      tipo: comment.public ? "cliente" : "agente",
      timestamp: comment.created_at,
    };
  }

  static userToDTO(usuario: ZendeskUser): ClienteZendeskDTO {
    return {
      id: String(usuario.id),
      nombre: usuario.name,
      email: usuario.email,
      telefono: usuario.phone,
    };
  }

  static ticketsToBandejaDTO(tickets: ZendeskTicket[], usuarios: Map<number, ZendeskUser>, total: number, pagina: number): BandejaZendeskDTO {
    return {
      tickets: tickets.map((t) => {
        const user = t.requester_id ? usuarios.get(t.requester_id) : undefined;
        return this.ticketToDTO(t, user);
      }),
      total,
      pagina,
    };
  }

  static commentsToConversacionDTO(ticketId: string, comments: ZendeskComment[], usuarios: Map<number, ZendeskUser>): ConversacionZendeskDTO {
    return {
      ticketId,
      mensajes: comments.map((c) => this.commentToDTO(c, usuarios)),
      total: comments.length,
    };
  }
}

