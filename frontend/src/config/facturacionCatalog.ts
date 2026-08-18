export const CAUSAS_FACTURACION = [
  "CDT vencido",
  "Error de cálculo",
  "Error de descuento",
  "Error de impuesto",
  "Error de certificado",
  "Error de configuración",
  "Error de conexión",
  "Error de documento",
  "Error de envío",
  "Otro",
] as const;

export type CausaFacturacion = (typeof CAUSAS_FACTURACION)[number];

export const ACCIONES_FACTURACION = [
  "revisión",
  "diagnóstico",
  "configuración",
  "corrección",
  "reenvío",
  "validación",
  "derivación",
] as const;

export type AccionFacturacion = (typeof ACCIONES_FACTURACION)[number];

export const RESULTADOS_FACTURACION = [
  "RESUELTO",
  "NO_RESUELTO",
  "DERIVADO",
  "PENDIENTE",
] as const;

export type ResultadoFacturacion = (typeof RESULTADOS_FACTURACION)[number];

export const MOTIVOS_PAUSA = [
  "esperando cliente",
  "esperando sistema",
  "esperando tercero",
  "otra atención prioritaria",
  "otro",
] as const;

export type MotivoPausa = (typeof MOTIVOS_PAUSA)[number];

/**
 * Máquina de estados operativos del caso (espejo del backend).
 * El backend sigue siendo la autoridad; esto solo sirve para mostrar
 * las transiciones válidas al asesor en la UI.
 */
export const TRANSICIONES_ESTADO_OPERATIVO: Record<string, string[]> = {
  PENDIENTE: ["ASIGNADO"],
  ASIGNADO: ["EN_DIAGNOSTICO", "PAUSADO", "CANCELADO"],
  EN_DIAGNOSTICO: ["EN_SOLUCION", "PAUSADO", "DERIVADO", "CANCELADO"],
  EN_SOLUCION: ["PAUSADO", "DERIVADO", "NO_RESUELTO", "RESUELTO"],
  PAUSADO: ["EN_DIAGNOSTICO", "EN_SOLUCION", "CANCELADO"],
  NO_RESUELTO: ["ASIGNADO", "EN_DIAGNOSTICO"],
  DERIVADO: ["EN_DIAGNOSTICO", "RESUELTO", "NO_RESUELTO"],
  RESUELTO: [],
  CANCELADO: [],
};

export const ESTADOS_OPERATIVOS = Object.keys(TRANSICIONES_ESTADO_OPERATIVO);

export interface DiagnosticoFacturacion {
  asesor: string;
  atencionRelacionada: string;
  ruc: string;
  dominio: string;
  proveedor: string;
  causa: CausaFacturacion | string;
  accion: string;
  resultado: string;
  inicio: string;
  pausa: string;
  continuacion: string;
  resolucion: string;
  tiempoTotal: number;
  tiempoActivo: number;
}
