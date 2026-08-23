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

/** Registro REAL de listaInfoLocal (estructura exacta de la API). */
export interface InfoLocalRegistro {
  _id: string;
  storeId: string;
  integracion: string;
  localId: number;
  suscripcion: string;
  minutos_preparacion: string;
  clave_publica: string | null;
  clave_privada: string | null;
  audience: string;
  marca_id: string;
  __v: number;
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
