import { api } from "@/lib/api";
import type { InboxProvider } from "./InboxProvider";
import type { InboxItemFE } from "@/components/zendesk/useZendeskInbox";
import { MetaService } from "../../meta/services/MetaService";
import { metaProvider as metaProviderInstance } from "../../meta/providers";
import { metaToInboxMany } from "../mappers/metaToInbox";
import { zendeskToInboxMany } from "../mappers/zendeskToInbox";
import type { InboxTicketDTO } from "../dto/inbox.dto";

async function fetchZendeskInbox(): Promise<InboxItemFE[]> {
  try {
    const res = await api.get("/zendesk/inbox", { params: { status: "active" } });
    const body = res.data as { ok: boolean; data: { tickets: InboxItemFE[]; total: number } };
    if (!body.ok) return [];
    return body.data.tickets.slice(0, 50);
  } catch {
    return [];
  }
}

function makeMockZendeskTickets(): InboxItemFE[] {
  const names = ["Carlos Mendoza", "Ana Torres", "Pedro García", "Lucía Fernández", "Roberto Sánchez"];
  const subjects = ["Reclamo de facturación", "Problema con el sistema POS", "Solicitud de nueva funcionalidad", "Error en reporte diario", "Configuración de usuario"];
  const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString();
  return names.map((name, i) => ({
    ticketId: String(20000 + i),
    subject: subjects[i],
    status: ["new", "open", "pending", "solved", "closed"][i],
    priority: "normal",
    requesterName: name,
    requesterEmail: `contacto${i}@restaurant.pe`,
    assigneeName: ["María López", "Carlos Ruiz", "Ana Martínez", null, "Sofía Vega"][i],
    createdAt: ago(i * 20 + 5),
    updatedAt: ago(i * 10 + 2),
    tags: [],
    url: "",
  }));
}

const metaService = new MetaService(metaProviderInstance);

function sortByUpdatedAt(ts: InboxTicketDTO[]): InboxTicketDTO[] {
  return ts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export const mergedInboxProvider: InboxProvider = {
  getInbox: async (): Promise<InboxTicketDTO[]> => {
    const [metaTickets, zendeskTickets] = await Promise.all([
      metaService.getTickets().then((r) => r.tickets),
      fetchZendeskInbox(),
    ]);

    const hasZendesk = zendeskTickets.length > 0;
    const finalZendesk = hasZendesk ? zendeskTickets : makeMockZendeskTickets();

    console.info("[MergedInboxProvider] Zendesk:", finalZendesk.length, hasZendesk ? "(real)" : "(mock fallback)");
    console.info("[MergedInboxProvider] Meta:", metaTickets.length);
    console.info("[MergedInboxProvider] Total:", metaTickets.length + finalZendesk.length);

    const inbox: InboxTicketDTO[] = [
      ...zendeskToInboxMany(finalZendesk),
      ...metaToInboxMany(metaTickets),
    ];

    return sortByUpdatedAt(inbox);
  },
};
