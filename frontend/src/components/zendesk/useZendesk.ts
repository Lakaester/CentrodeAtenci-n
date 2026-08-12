import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface ZendeskTicketFE {
  id: string;
  ticketOriginalId: string;
  ticketOriginalStatus: string;
  asunto: string;
  descripcion?: string;
  prioridad?: string;
  tipo?: string;
  clienteId?: string;
  clienteNombre: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  pais?: string;
  dominio?: string;
  categoria?: string;
  subcategoria?: string;
  etiquetas?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ZendeskMensajeFE {
  id: string;
  contenido: string;
  emisor: string;
  tipo: "cliente" | "agente" | "sistema";
  timestamp: string;
}

export interface ZendeskConversacionFE {
  ticketId: string;
  mensajes: ZendeskMensajeFE[];
  total: number;
}

export interface ZendeskClienteFE {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface ZendeskBandejaFE {
  tickets: ZendeskTicketFE[];
  total: number;
  pagina: number;
}

export function useZendeskBandeja(tipo: "unassigned" | "mine") {
  const [data, setData] = useState<ZendeskBandejaFE | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tipo === "unassigned" ? "/atenciones/zendesk/unassigned" : "/atenciones/zendesk/my";
      const res = await api.get(endpoint);
      setData(res.data.data ?? null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => { cargar(); }, [cargar]);

  return { data, loading, error, recargar: cargar };
}

export function useZendeskTicket(id: string | null) {
  const [ticket, setTicket] = useState<ZendeskTicketFE | null>(null);
  const [conversacion, setConversacion] = useState<ZendeskMensajeFE[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setTicket(null); setConversacion([]); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(`/zendesk/tickets/${id}`),
      api.get(`/zendesk/tickets/${id}/comments`),
    ])
      .then(([tRes, cRes]) => {
        if (!cancelled) {
          setTicket(tRes.data.data ?? null);
          setConversacion(cRes.data.data?.mensajes ?? []);
          setError(null);
        }
      })
      .catch((err: any) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { ticket, conversacion, loading, error };
}
