export type EstadoOperativoCOPE = "ACTIVA" | "RECIENTE" | "ARCHIVADA";

export const ESTADOS_OPERATIVOS: EstadoOperativoCOPE[] = ["ACTIVA", "RECIENTE", "ARCHIVADA"];

export function esVisibleEnBandeja(estado: EstadoOperativoCOPE): boolean {
  return estado === "ACTIVA" || estado === "RECIENTE";
}
