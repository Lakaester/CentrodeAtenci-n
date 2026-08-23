import { useQuery } from "@tanstack/react-query";
import * as integracionesService from "../services/integracionesService";
import type { PedidoFiltros } from "../types";

const KEY = ["integraciones"];

/**
 * Hook para obtener las integraciones de un dominio.
 * Se ejecuta solo cuando dominio tiene valor.
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
 * Se ejecuta solo cuando hay al menos una suscripción en los filtros.
 */
export function useBusquedaPedidos(filtros: PedidoFiltros | null) {
  return useQuery({
    queryKey: [...KEY, "pedidos", filtros],
    queryFn: () => integracionesService.buscarPedidos(filtros!),
    enabled: Boolean(filtros && filtros.suscripciones.length > 0),
    staleTime: 30_000,
    retry: 1,
  });
}
