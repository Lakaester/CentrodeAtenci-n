import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface CustomerDataFE {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  empresa: string | null;
  rol: string;
  idioma: string | null;
  zonaHoraria: string | null;
  fechaCreacion: string;
  ultimaActividad: string | null;
  tags: string[];
  totalTickets: number;
  ticketsAbiertos: number;
}

export function useZendeskCustomer(usuarioId: string | null) {
  const [data, setData] = useState<CustomerDataFE | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!usuarioId) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    api.get(`/zendesk/users/${usuarioId}`)
      .then((res) => { if (!cancelled) setData(res.data.data ?? null); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [usuarioId]);

  return { data, loading };
}
