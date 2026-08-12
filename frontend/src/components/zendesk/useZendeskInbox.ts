import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface InboxItemFE {
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
  estadoOperativo?: string;
  hasPendingReply?: boolean;
}

export interface InboxResponse {
  tickets: InboxItemFE[];
  total: number;
}

const LIMITE = 50;

type StatusParam = "active" | "all" | "new" | "open" | "pending" | "hold" | "sin filtrar";

async function fetchInbox(status?: StatusParam): Promise<InboxResponse> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const res = await api.get("/zendesk/inbox", { params });
  const body = res.data as { ok: boolean; data: InboxResponse };
  if (!body.ok) throw new Error("Error al obtener la bandeja Zendesk");
  return {
    tickets: body.data.tickets.slice(0, LIMITE),
    total: Math.min(body.data.total, LIMITE),
  };
}

export function useZendeskInbox(status?: StatusParam) {
  return useQuery({
    queryKey: ["zendesk", "inbox", status ?? "active"],
    queryFn: () => fetchInbox(status),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export type InboxQueryResult = ReturnType<typeof useZendeskInbox>;
