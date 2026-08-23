import { api } from "@/lib/api";
import type { DominioIntegraciones, PedidoFiltros, BusquedaPedidosResult } from "../types";

/** Obtiene las integraciones de un dominio. */
export async function obtenerIntegraciones(dominio: string): Promise<DominioIntegraciones> {
  const res = await api.get(`/integraciones/dominio/${encodeURIComponent(dominio)}`);
  return res.data?.data ?? { dominio, integraciones: [] };
}

/** Busca pedidos con los filtros proporcionados. Incluye dominio para validación backend. */
export async function buscarPedidos(filtros: PedidoFiltros, dominio: string): Promise<BusquedaPedidosResult> {
  const res = await api.post("/integraciones/pedidos", { ...filtros, dominio });
  return res.data?.data ?? { totalRegistros: 0, pedidos: [] };
}
