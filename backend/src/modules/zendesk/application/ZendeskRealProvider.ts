/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
import type { ZendeskProvider } from "./ZendeskProvider";
import { ZendeskClient } from "../infrastructure/ZendeskClient";
import { ZendeskMapper } from "./mapper/ZendeskMapper";
import type { BandejaZendeskDTO, TicketZendeskDTO, ConversacionZendeskDTO, ClienteZendeskDTO } from "./dto/ZendeskDTOs";

export class ZendeskRealProvider implements ZendeskProvider {
  private client: ZendeskClient;

  constructor() {
    this.client = new ZendeskClient();
  }

  async getUnassignedTickets(page?: number): Promise<BandejaZendeskDTO> {
    const result = await this.client.listarTickets({ status: "new", page });
    const usuarios = await this.cargarUsuarios(result.tickets.map((t) => t.requester_id));
    return ZendeskMapper.ticketsToBandejaDTO(result.tickets, usuarios, result.total, page ?? 1);
  }

  async getMyTickets(page?: number): Promise<BandejaZendeskDTO> {
    const result = await this.client.listarTickets({ status: "open,pending", page });
    const usuarios = await this.cargarUsuarios(result.tickets.map((t) => t.requester_id));
    return ZendeskMapper.ticketsToBandejaDTO(result.tickets, usuarios, result.total, page ?? 1);
  }

  async getRecentlyUpdated(page?: number): Promise<BandejaZendeskDTO> {
    const result = await this.client.listarTickets({ status: "new,open,pending,solved", page });
    const ordenados = result.tickets.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const usuarios = await this.cargarUsuarios(ordenados.map((t) => t.requester_id));
    return ZendeskMapper.ticketsToBandejaDTO(ordenados, usuarios, result.total, page ?? 1);
  }

  async getTicket(id: number): Promise<TicketZendeskDTO | null> {
    const ticket = await this.client.obtenerTicket(id);
    if (!ticket) return null;
    const usuario = ticket.requester_id ? await this.client.obtenerUsuario(ticket.requester_id) : undefined;
    return ZendeskMapper.ticketToDTO(ticket, usuario ?? undefined);
  }

  async getConversation(ticketId: number): Promise<ConversacionZendeskDTO> {
    const comments = await this.client.obtenerComentarios(ticketId);
    const authorIds = [...new Set(comments.map((c) => c.author_id))];
    const usuarios = await this.client.obtenerUsuarios(authorIds);
    const usuarioMap = new Map(usuarios.map((u) => [u.id, u]));
    return ZendeskMapper.commentsToConversacionDTO(String(ticketId), comments, usuarioMap);
  }

  async getUser(userId: number): Promise<ClienteZendeskDTO | null> {
    const user = await this.client.obtenerUsuario(userId);
    if (!user) return null;
    return ZendeskMapper.userToDTO(user);
  }

  async getTicketFields(): Promise<{ id: number; title: string; type: string }[]> {
    return this.client.obtenerCamposPersonalizados();
  }

  private async cargarUsuarios(ids: number[]): Promise<Map<number, import("../domain/ZendeskTypes").ZendeskUser>> {
    if (ids.length === 0) return new Map();
    const unicos = [...new Set(ids)];
    const usuarios = await this.client.obtenerUsuarios(unicos);
    return new Map(usuarios.map((u) => [u.id, u]));
  }
}

