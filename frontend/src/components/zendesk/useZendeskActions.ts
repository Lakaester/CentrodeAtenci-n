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
      const res = await api.post(`/zendesk/tickets/${ticketId}/${accion}`, body);
      setResult(res.data.ok ? "ok" : "error");
    } catch {
      setResult("error");
    } finally {
      setLoading(null);
    }
  };

  const internalNote = (body: string) => ejecutar("internal-note", { body });
  const assign = (assigneeId: number) => ejecutar("assign", { assigneeId });
  const changeStatus = (status: string) => ejecutar("status", { status });
  const categorize = (categoria: string, subcategoria: string) => ejecutar("categorize", { categoria, subcategoria });
  const reply = (body: string) => ejecutar("reply", { body });

  return { internalNote, assign, changeStatus, categorize, reply, loading, result };
}
