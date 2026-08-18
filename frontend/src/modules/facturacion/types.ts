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

export type EstadoOperativo =
  | "PENDIENTE"
  | "ASIGNADO"
  | "EN_DIAGNOSTICO"
  | "EN_SOLUCION"
  | "PAUSADO"
  | "RESUELTO"
  | "NO_RESUELTO"
  | "DERIVADO"
  | "CANCELADO";

export interface FacturacionCaso {
  id: string;
  dominio: string;
  ruc: string | null;
  proveedor: string | null;
  unidad_negocio_id: string | null;
  cliente_nombre: string | null;
  estado_operativo: string;
  categoria_id: string | null;
  subcategoria_id: string | null;
  facturas_iniciales: number | null;
  boletas_iniciales: number | null;
  total_inicial: number | null;
  ultimas_facturas: number | null;
  ultimas_boletas: number | null;
  ultimo_total: number | null;
  primera_deteccion: string;
  ultima_deteccion: string;
  asesor_actual: string | null;
  fecha_asignacion: string | null;
  asignado_por: string | null;
  created_at: string;
  updated_at: string;
  categoria_nombre?: string | null;
  subcategoria_nombre?: string | null;
}

export interface CasoSnapshot {
  id: string;
  caso_id: string;
  fecha_snapshot: string;
  facturas: number | null;
  boletas: number | null;
  total: number | null;
  origen: string;
  created_by: string | null;
  created_at: string;
}

export interface CasoAsignacion {
  id: string;
  caso_id: string;
  asesor: string;
  asignado_por: string | null;
  created_at: string;
}

export interface AuditoriaFacturacion {
  id: string;
  entidad: string;
  entidad_id: string | null;
  accion: string;
  asesor: string | null;
  detalle: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  created_at: string;
}

export interface CasoCasoVinculado {
  caso_id: string;
  intervencion_id: string;
  created_at: string;
}

export interface CasoDetalle {
  caso: FacturacionCaso;
  snapshots: CasoSnapshot[];
  asignaciones: CasoAsignacion[];
  intervenciones: CasoCasoVinculado[];
  auditoria: AuditoriaFacturacion[];
}

export interface CategoriaItem {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

export interface SubcategoriaItem {
  id: string;
  nombre: string;
}
