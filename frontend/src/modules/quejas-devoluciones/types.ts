export type QdTipo = "devolucion" | "queja";

export interface QdCaso {
  id: string;
  tipo: QdTipo;
  numero: string;
  ticket_id: string | null;
  ticket_padre_id: string | null;
  dominio: string | null;
  pais: string | null;
  asesor: string | null;
  estado: string | null;
  resultado: string | null;
  monto_pagado: number | null;
  tipo_monto: string | null;
  area: string | null;
  motivo: string | null;
  porcentaje: number | null;
  monto_devuelto: number | null;
  clasificacion: string | null;
  producto: string | null;
  observacion: string | null;
  origen: string | null;               // MANUAL | CATEGORIZACION
  eliminado: boolean;
  eliminado_at: string | null;
  eliminado_por: string | null;
  created_at: string;
  updated_at: string;
  total_interacciones?: number | null;
}

export interface QdInteraccion {
  id: string;
  caso_id: string;
  ticket_id: string;
  tipo_relacion: string;
  created_by: string | null;
  created_at: string;
}

export interface QdAuditoriaItem {
  id: string;
  caso_id: string;
  usuario: string | null;
  accion: string;
  campo: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  created_at: string;
}

export interface QdDetalle {
  caso: QdCaso;
  interacciones: QdInteraccion[];
  auditoria: QdAuditoriaItem[];
}

export interface QdCatalogoItem {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}
