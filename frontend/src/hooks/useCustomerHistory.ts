import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

export interface HistoryItem {
  id: string;
  asunto: string;
  estado: string;
  prioridad: string;
  canal: string;
  categoria: string | null;
  fecha: string;
}

export interface CustomerHistory {
  total: number;
  porCanal: Record<string, number>;
  primeraAtencion: string | null;
  ultimaAtencion: string | null;
  tiempoPromedioResolucion: number | null;
  tickets: HistoryItem[];
  usuario: { nombre: string; correo: string } | null;
}

export function useCustomerHistory(requesterId: string | null) {
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!requesterId) {
      setHistory(null);
      setLoading(false);
      return;
    }

    if (fetchedRef.current === requesterId) return; // cached
    fetchedRef.current = requesterId;

    setLoading(true);
    api.get(`/zendesk/history/${requesterId}`)
      .then((res) => setHistory(res.data?.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requesterId]);

  return { history, loading };
}
