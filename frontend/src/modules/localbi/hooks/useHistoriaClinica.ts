import { useQuery } from "@tanstack/react-query";
import { localbiService, type LocalbiApiResult } from "../services/LocalbiService";
import type { LocalbiHistoriaClinica, ActividadDominio, SoporteOnlineResult, HistoriaLocal } from "../types/localbi";

export function useHistoriaClinica(unidadNegocio: string | null) {
  const query = useQuery({
    queryKey: ["localbi", "historia", unidadNegocio],
    queryFn: async (): Promise<LocalbiApiResult<LocalbiHistoriaClinica>> => {
      return localbiService.obtenerHistoria(unidadNegocio as string);
    },
    enabled: Boolean(unidadNegocio),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Historia Clínica de un LOCAL específico (por localbi_id). */
export function useHistoriaLocal(unidadNegocio: string | null, localbiId: string | null) {
  const query = useQuery({
    queryKey: ["localbi", "historia-local", unidadNegocio, localbiId],
    queryFn: async (): Promise<HistoriaLocal> => {
      return localbiService.historiaLocal(unidadNegocio as string, localbiId as string);
    },
    enabled: Boolean(unidadNegocio && localbiId),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
export function useActividadCliente(dominios: string[]) {
  const claves = [...new Set(dominios.map((d) => d.trim().toLowerCase()).filter(Boolean))].sort();
  const query = useQuery({
    queryKey: ["localbi", "actividad", claves],
    queryFn: async (): Promise<ActividadDominio[]> => {
      return localbiService.actividad(claves);
    },
    enabled: claves.length > 0,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Soporte en Línea (public.incidencias) para la lista de dominios de un cliente, con período. */
export function useSoporteOnline(dominios: string[], periodo?: string) {
  const claves = [...new Set(dominios.map((d) => d.trim().toLowerCase()).filter(Boolean))].sort();
  const query = useQuery({
    queryKey: ["localbi", "soporte", claves, periodo ?? "todo"],
    queryFn: async (): Promise<SoporteOnlineResult> => {
      return localbiService.soporte(claves, periodo);
    },
    enabled: claves.length > 0,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Resumen de actividad por localbi_id (Nivel 1) para una lista de locales. */
export function useActividadLocal(localbiIds: string[]) {
  const claves = [...new Set(localbiIds.map((s) => s.trim()).filter(Boolean))].sort();
  const query = useQuery({
    queryKey: ["localbi", "actividad-local", claves],
    queryFn: async (): Promise<Record<string, { total: number; ultima_atencion: string | null }>> => {
      return localbiService.actividadLocal(claves);
    },
    enabled: claves.length > 0,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
