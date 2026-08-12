import { useState } from "react";
import { api } from "@/lib/api";

export function useZendeskActions(ticketId: string | null) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const ejecutar = async (accion: string, body: Record<string, unknown>) => {
    if (!ticketId) return;
    setLoading(accion);
    setResult(null);
    try {
      const res = await api.post(`/api/zendesk/tickets/${ticketId}/${accion}`, body);
      setResult(res.data.ok ? "ok" : "error");
    } catch {
      setResult("error");
    } finally {
      setLoading(null);
    }
  };

  const internalNote = (body: string, autor: string) => ejecutar("internal-note", { body, autor });
  const assign = (assigneeId: number, autor: string) => ejecutar("assign", { assigneeId, autor });
  const changeStatus = (status: string, autor: string) => ejecutar("status", { status, autor });
  const categorize = (categoria: string, subcategoria: string, autor: string) => ejecutar("categorize", { categoria, subcategoria, autor });
  const reply = (body: string, autor: string) => ejecutar("reply", { body, autor });

  return { internalNote, assign, changeStatus, categorize, reply, loading, result };
}
