/**
 * Utilidades para extraer campos de un pedido de la API de integraciones.
 *
 * La API externa devuelve un objeto genérico. Estos helpers intentan
 * múltiples nombres de propiedad conocidos para encontrar el valor real.
 *
 * NO inventa valores: si no encuentra la propiedad, devuelve fallback.
 */
import type { Pedido } from "../types";

/** Extrae un valor de string de un pedido probando múltiples nombres de propiedad. */
export function campoPedido(p: Pedido, ...claves: string[]): string {
  for (const k of claves) {
    const v = p[k];
    if (v != null && v !== "") {
      return typeof v === "object" ? JSON.stringify(v, null, 2) : String(v);
    }
  }
  return "—";
}

/**
 * Catálogo oficial de estados del Monitor de Integraciones.
 *
 * Evidencia: bundle de producción del Monitor original
 * (https://integraciones.restpe.com/monitor/):
 *
 *   this.estado=[
 *     {id:"1",value:"Confirmado"},
 *     {id:"3",value:"Pendiente"}
 *   ]
 *
 * El mismo mapeo se aplica a `estado` y `estadoConfirmacion`.
 * Cualquier otro valor se conserva como valor crudo (no se traduce).
 */
export const ESTADO_INTEGRACION: Record<string, string> = {
  "1": "Confirmado",
  "3": "Pendiente",
};

/** Traduce un ID de estado/confirmación usando el catálogo oficial. */
function traducirEstado(valor: string): string {
  return ESTADO_INTEGRACION[valor] ?? valor;
}

/** Extrae el ID del pedido (OrderID). */
export function extraerOrderId(p: Pedido): string {
  return campoPedido(p, "orderId", "order_id", "pedido", "id", "numero_pedido", "numPedido");
}

/** Extrae el StoreID. */
export function extraerStoreId(p: Pedido): string {
  return campoPedido(p, "storeId", "store_id", "store", "storeIdLocal", "localId");
}

/** Extrae el nombre de la integración/canal. */
export function extraerIntegracion(p: Pedido): string {
  return campoPedido(p, "integracion", "integration", "canal", "plataforma", "channel");
}

/**
 * Extrae el estado del pedido y lo traduce al catálogo oficial.
 *
 * "1" → "Confirmado"
 * "3" → "Pendiente"
 * otro valor → valor original
 * null/undefined/vacío → "—"
 */
export function extraerEstado(p: Pedido): string {
  const crudo = campoPedido(p, "estado", "status", "orderStatus", "estadoPedido");
  if (crudo === "—") return "—";
  return traducirEstado(crudo);
}

/**
 * Extrae la confirmación del pedido y la traduce al catálogo oficial.
 *
 * "1" → "Confirmado"
 * "3" → "Pendiente"
 * null/undefined/vacío → "No Aplica"
 * otro valor → valor original
 */
export function extraerConfirmacion(p: Pedido): string {
  const crudo = campoPedido(p, "estadoConfirmacion", "confirmacion", "confirmStatus", "confirmacionPedido", "confirm");
  if (crudo === "—") return "No Aplica";
  return traducirEstado(crudo);
}

/** Extrae la fecha del pedido. */
export function extraerFecha(p: Pedido): string {
  return campoPedido(p, "fecha", "fecha_creacion", "createdAt", "date", "fechaPedido", "orderDate", "timestamp");
}

/** Extrae la respuesta JSON del pedido. */
export function extraerRespuesta(p: Pedido): string {
  return campoPedido(p, "json_respuesta", "respuesta", "response", "responseData", "respuestaJson");
}

/**
 * Formatea una fecha ISO/string a formato legible: DD/MM/YYYY HH:MM.
 * Si no puede parsear, devuelve el valor crudo.
 */
export function fmtFechaHora(raw: string): string {
  if (raw === "—" || !raw) return "—";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return raw;
  }
}

/**
 * Extrae la hora de un pedido (HH:MM) para mostrar en vista compacta.
 */
export function extraerHora(p: Pedido): string {
  const raw = extraerFecha(p);
  if (raw === "—" || !raw) return "—";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "—";
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${min}`;
  } catch {
    return "—";
  }
}
