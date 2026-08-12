import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface AdjuntoFE { id: string; nombre: string; url: string }

export interface AtencionVM {
  id: string;
  canal: string;
  ticket: {
    id: string;
    ticketOriginalId: string;
    ticketOriginalStatus: string;
    asunto: string;
    descripcion: string;
    prioridad: string;
    tipo: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    url: string;
  };
  cliente: {
    id: string;
    nombre: string;
    correo: string;
    telefono: string | null;
    empresa: string | null;
    rol: string;
    fechaCreacion: string;
    ultimaActividad: string | null;
    totalTickets: number;
    ticketsAbiertos: number;
    ultimosTickets: { ticketId: string; asunto: string; estado: string; fecha: string }[];
  };
  comentarios: {
    id: string;
    contenido: string;
    emisor: string;
    tipo: "cliente" | "agente" | "sistema";
    timestamp: string;
    publico: boolean;
    adjuntos: AdjuntoFE[];
  }[];
  totalComentarios: number;
}

export function useAtencionViewModel(ticketId: string | null) {
  const [data, setData] = useState<AtencionVM | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    api.get(`/zendesk/atenciones/${ticketId}`)
      .then((res) => { if (!cancelled) { setData(res.data.data ?? null); setError(null); } })
      .catch((err: any) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticketId]);

  return { data, loading, error };
}
