import { useQuery } from "@tanstack/react-query";
import * as integracionesService from "../services/integracionesService";
import type { PedidoFiltros } from "../types";

const KEY = ["integraciones"];

/**
 * Hook para obtener las integraciones de un dominio.
 * Se ejecuta automáticamente cuando dominio tiene valor.
 */
export function useIntegraciones(dominio: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "dominio", dominio],
    queryFn: () => integracionesService.obtenerIntegraciones(dominio!),
    enabled: Boolean(dominio),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/**
 * Hook para buscar pedidos de integraciones.
 * NO se ejecuta automáticamente. Requiere que activado sea true
 * (solo después de pulsar "Buscar pedidos").
 */
export function useBusquedaPedidos(filtros: PedidoFiltros | null, dominio: string | null | undefined, activado: boolean) {
  return useQuery({
    queryKey: [...KEY, "pedidos", filtros, dominio],
    queryFn: () => integracionesService.buscarPedidos(filtros!, dominio!),
    enabled: activado && Boolean(filtros && filtros.suscripciones.length > 0 && dominio),
    staleTime: 30_000,
    retry: 1,
  });
}
