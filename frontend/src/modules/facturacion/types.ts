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
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PausaRow {
  id: string;
  intervencion_id: string;
  started_at: string;
  finished_at: string | null;
  motivo: string | null;
}

export interface ActividadRow {
  id: string;
  intervencion_id: string;
  tipo: string;
  detalle: string | null;
  created_at: string;
}

export interface IntervencionDetalle {
  intervencion: IntervencionRow;
  pausas: PausaRow[];
  actividades: ActividadRow[];
  duraciones: {
    duracionBrutaMs: number;
    duracionPausadaMs: number;
    duracionEfectivaMs: number;
  };
}
