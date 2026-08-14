import { randomUUID } from "crypto";

export type IntervencionStatus =
  | "EN_DIAGNOSTICO"
  | "PAUSADA"
  | "RESUELTA"
  | "NO_RESUELTA"
  | "DERIVADA"
  | "CANCELADA";

export interface IntervencionRow {
  id: string;
  asesor: string;
  unidad_negocio_id: string | null;
  cliente_nombre: string | null;
  ruc: string | null;
  dominio: string;
  proveedor: string | null;
  facturas_pendientes: number | null;
  boletas_pendientes: number | null;
  causa: string | null;
  resultado: string | null;
  observacion: string | null;
  estado_id: string | null;
  subcategoria_id: string | null;
  mensaje_error: string | null;
  status: string;
  started_at: Date;
  finished_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PausaRow {
  id: string;
  intervencion_id: string;
  started_at: Date;
  finished_at: Date | null;
  motivo: string | null;
}

export interface ActividadRow {
  id: string;
  intervencion_id: string;
  tipo: string;
  detalle: string | null;
  created_at: Date;
}

export const genId = (): string => randomUUID();

/**
 * Calcula las duraciones de una intervención desde timestamps.
 * fuente de verdad = backend. El frontend solo representa.
 */
export function calcularDuraciones(
  startedAt: Date,
  finishedAt: Date | null,
  pausas: PausaRow[],
): { duracionBrutaMs: number; duracionPausadaMs: number; duracionEfectivaMs: number } {
  const fin = finishedAt ?? new Date();
  const duracionBrutaMs = Math.max(0, fin.getTime() - startedAt.getTime());

  let duracionPausadaMs = 0;
  for (const p of pausas) {
    const finPausa = p.finished_at ?? new Date();
    duracionPausadaMs += Math.max(0, finPausa.getTime() - p.started_at.getTime());
  }

  return {
    duracionBrutaMs,
    duracionPausadaMs,
    duracionEfectivaMs: Math.max(0, duracionBrutaMs - duracionPausadaMs),
  };
}
