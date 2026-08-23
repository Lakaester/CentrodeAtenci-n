/** Tipos del módulo Monitor de Integraciones (frontend). */

export interface IntegracionItem {
  nombre: string;
  storeIds: string[];
}

export interface DominioIntegraciones {
  dominio: string;
  integraciones: IntegracionItem[];
}

export interface PedidoFiltros {
  suscripciones: string[];
  integraciones: string[];
  storeIds: string[];
  estados: string[];
  fechas: string[];
  pagina: number;
  registros: number;
}

export interface Pedido {
  [k: string]: unknown;
}

export interface BusquedaPedidosResult {
  totalRegistros: number;
  pedidos: Pedido[];
}
