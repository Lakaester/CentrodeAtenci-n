import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

export interface TicketComentario {
  id: string;
  contenido: string;
  html?: string | null;
  emisor: string;
  tipo: "cliente" | "agente" | "nota_interna" | "bot" | "sistema";
  timestamp: string;
  adjuntos: { id: string; nombre: string; url: string; content_type?: string; size?: number }[];
  bloques?: ContentBlock[];
}

export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "image"; url: string; alt: string }
  | { type: "link"; url: string; text: string }
  | { type: "code"; content: string }
  | { type: "signature"; content: string }
  | { type: "disclaimer"; content: string }
  | { type: "history"; content: string; lineas?: number };

export interface TicketDetail {
  id: string;
  ticketOriginalId: string;
  ticketOriginalStatus: string;
  asunto: string;
  descripcion: string;
  prioridad: string;
  tipo: string | null;
  clienteNombre: string;
  clienteEmail: string | null;
  dominio: string | null;
  pais: string | null;
  hasPendingReply?: boolean;
  requesterId?: number | null;
  assigneeId?: number | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface CustomerInfo {
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
}

interface AtencionCompletaResponse {
  ticket: TicketDetail;
  comentarios: TicketComentario[];
  total: number;
  metrica: {
    ticketMs: number;
    comentariosMs: number;
    usuariosMs: number;
    parseMs: number;
    totalMs: number;
  };
  clienteCope?: {
    id: string;
    nombre: string;
    correoPrincipal: string;
    correosSecundarios: string[];
    empresa: string | null;
    pais: string | null;
    dominios: string[];
    categorias: string[];
    subcategorias: string[];
    totalTickets: number;
    primerContacto: string;
    ultimoContacto: string;
  };
}

export function useTicketDetail(ticketId: string | null, retryKey?: number) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comentarios, setComentarios] = useState<TicketComentario[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [clienteCope, setClienteCope] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freshKey, setFreshKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
      setComentarios([]);
      setCustomer(null);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setTicket(null);
    setComentarios([]);
    setCustomer(null);
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const res = await api.get(`/zendesk/completa/${ticketId}`, { signal: abort.signal });
        if (abort.signal.aborted) return;

        const body = res.data as any;
        const data = body.data as AtencionCompletaResponse;

        setTicket(data.ticket);
        setComentarios(data.comentarios);

        const ticketOk = data.ticket;
        const customerInfo: CustomerInfo = {
          id: ticketId,
          nombre: ticketOk?.clienteNombre ?? "—",
          correo: ticketOk?.clienteEmail ?? "—",
          telefono: null,
          empresa: null,
          rol: "end-user",
          fechaCreacion: ticketOk?.createdAt ?? "",
          ultimaActividad: ticketOk?.updatedAt ?? null,
          totalTickets: 0,
          ticketsAbiertos: 0,
        };
        setCustomer(customerInfo);
        setClienteCope(data.clienteCope ?? null);
        setLoading(false);
      } catch (err: any) {
        if (err?.name === "CanceledError" || abort.signal.aborted) return;
        setError(err?.message ?? "Error al cargar el ticket");
        setLoading(false);
      }
    };

    fetchData();

    // Refetch when user returns to the tab (visibility change)
    const onVisible = () => {
      if (document.visibilityState === "visible" && !abort.signal.aborted) {
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      abort.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ticketId, freshKey, retryKey]);

  const refetch = () => setFreshKey((k) => k + 1);

  return { ticket, comentarios, customer, clienteCope, loading, error, refetch };
}
