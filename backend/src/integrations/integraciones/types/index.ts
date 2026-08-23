/**
 * Tipos de la integración Monitor de Integraciones (Restaurant.pe).
 * Mapean la respuesta REAL de la API:
 *   GET  /datos/listaInfoLocal
 *   POST /datos/busquedaPedidos
 * sobre api.integraciones.restaurant.pe
 *
 * No se transforman ni recalculan valores arbitrarios.
 */

/** Envoltorio genérico de la API de integraciones. */
export interface IntegracionesEnvelope<T = unknown> {
  tipo: number;
  data: T;
  mensajes: string[];
}

/** Registro de locale/devolución de listaInfoLocal. */
export interface InfoLocalRegistro {
  suscripcion: string;
  restaurante: string;
  [k: string]: unknown;
}

/** Resultado de normalizar dominio → integraciones + storeIds. */
export interface IntegracionDominio {
  nombre: string;
  storeIds: string[];
}

export interface DominioIntegracionesResult {
  dominio: string;
  integraciones: IntegracionDominio[];
}

/** Request de busquedaPedidos. */
export interface BusquedaPedidosRequest {
  pagina: number;
  registros: number;
  totalregistros: number;
  suscripciones: string[];
  integraciones: string[];
  storeIds: string[];
  estados: string[];
  fechas: string[];
}

/** Un pedido devuelto por busquedaPedidos. */
export interface Pedido {
  [k: string]: unknown;
}

/** Response de busquedaPedidos. */
export interface BusquedaPedidosData {
  totalRegistros: number;
  pedidos: Pedido[];
}
