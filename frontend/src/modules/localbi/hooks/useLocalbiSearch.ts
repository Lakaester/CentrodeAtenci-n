import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { localbiService, type LocalbiApiResult } from "../services/LocalbiService";
import type { LocalbiBusquedaSalida } from "../types/localbi";

export function useLocalbiSearch() {
  const [busqueda, setBusqueda] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(busqueda);
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const query = useQuery({
    queryKey: ["localbi", "search", debounced, pagina],
    queryFn: async (): Promise<LocalbiApiResult<LocalbiBusquedaSalida>> => {
      return localbiService.buscarUnidades(debounced, pagina, 50);
    },
    enabled: true,
    staleTime: 60 * 1000,
    retry: 0,
  });

  return {
    busqueda,
    setBusqueda,
    pagina,
    setPagina,
    result: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
