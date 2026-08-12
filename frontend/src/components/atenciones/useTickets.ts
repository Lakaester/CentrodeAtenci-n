import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface TicketDTO {
  id: string;
  channel: string;
  status: string;
  priority: string;
  priorityScore: number;
  clienteId: string;
  clienteNombre: string;
  clienteDominio: string;
  pais?: string;
  asesorId?: string;
  asesorNombre?: string;
  asunto: string;
  categoriaFinal?: string;
  subcategoriaFinal?: string;
  slaPorcentaje: number;
  slaVencido: boolean;
  tags: string[];
  noLeido: number;
  ultimoMensaje?: string;
  ultimoMensajeEn?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketFilters {
  status?: string;
  channel?: string;
  asesorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useTickets(filters?: TicketFilters) {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.get("/tickets", { params: filters })
      .then((res) => {
        if (!cancelled) {
          setTickets(res.data.data ?? []);
          setTotal(res.data.total ?? 0);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setTickets([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [JSON.stringify(filters)]);

  return { tickets, total, loading, error };
}
