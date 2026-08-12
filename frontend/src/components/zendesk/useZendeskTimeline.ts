import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface TimelineItemFE {
  ticketId: string;
  asunto: string;
  estado: string;
  prioridad: string;
  fecha: string;
  canal: string;
}

export function useZendeskTimeline(usuarioId: string | null) {
  const [data, setData] = useState<TimelineItemFE[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!usuarioId) { setData([]); return; }
    let cancelled = false;
    setLoading(true);
    api.get(`/zendesk/users/${usuarioId}/timeline`)
      .then((res) => { if (!cancelled) setData(res.data.data ?? []); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [usuarioId]);

  return { data, loading };
}
