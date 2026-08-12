import { ZendeskClient } from "../zendesk/infrastructure/ZendeskClient";
import { VisibilityEngine } from "../../domain/visibility/VisibilityEngine";

export interface InboxItem {
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  requesterName: string;
  requesterEmail: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  url: string;
  estadoOperativo: string;
  hasPendingReply: boolean;
}

export class ZendeskInboxService {
  private client: ZendeskClient;
  private visibility: VisibilityEngine;

  constructor() {
    this.client = new ZendeskClient();
    this.visibility = new VisibilityEngine();
  }

  async obtenerInbox(): Promise<{ tickets: InboxItem[]; total: number }> {
    const result = await this.client.searchTickets("type:ticket status<closed", 100);

    const userIds = [...new Set(result.tickets.map((t) => t.requester_id))];
    const usuarios = await this.client.obtenerUsuarios(userIds);
    const usuarioMap = new Map(usuarios.map((u) => [u.id, u]));

    const conVisibilidad = this.visibility.visiblesEnBandeja(
      result.tickets.map((t) => ({
        id: String(t.id),
        canal: "zendesk",
        estadoCanal: t.status,
        ultimaActividad: t.updated_at,
        createdAt: t.created_at,
      })),
    );

    const visiblesMap = new Map(conVisibilidad.map((v) => [v.id, v]));

    const tickets: InboxItem[] = result.tickets
      .filter((t) => visiblesMap.has(String(t.id)))
      .map((t) => {
        const reqUser = t.requester_id ? usuarioMap.get(t.requester_id) : null;
        const assignee = t.assignee_id ? usuarioMap.get(t.assignee_id) : null;
        const vis = visiblesMap.get(String(t.id))!;

        // Indicate if the last public message was from the client (advisor needs to reply).
        // Logic: status === "open" && lastPublicComment.author === "cliente"
        // For inbox (search API) we don't have comment data, so we estimate:
        // - new: client just created ticket, no agent has replied → seguro
        // - open + no assignee: no agent has engaged yet → probable
        // - open + has assignee: agent may have replied → asumimos que no
        const hasPendingReply = t.status === "new" || (t.status === "open" && !t.assignee_id);

        return {
          ticketId: String(t.id),
          subject: t.subject,
          status: t.status,
          priority: t.priority ?? "normal",
          requesterName: reqUser?.name ?? "Usuario Zendesk",
          requesterEmail: reqUser?.email ?? null,
          assigneeName: assignee?.name ?? null,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          tags: t.tags,
          url: `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/agent/tickets/${t.id}`,
          estadoOperativo: vis.estadoOperativo,
          hasPendingReply,
        };
      });

    return { tickets, total: tickets.length };
  }
}
