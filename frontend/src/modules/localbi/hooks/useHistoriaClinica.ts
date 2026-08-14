import { useQuery } from "@tanstack/react-query";
import { localbiService, type LocalbiApiResult } from "../services/LocalbiService";
import type { LocalbiHistoriaClinica } from "../types/localbi";

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
