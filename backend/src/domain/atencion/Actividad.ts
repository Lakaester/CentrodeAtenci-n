export type TipoActividad =
  | "identificacion"
  | "diagnostico"
  | "consulta"
  | "gestion"
  | "comunicacion"
  | "clasificacion"
  | "cierre";

export type SubtipoActividad =
  | "cliente_identificado"
  | "dominio_validado"
  | "diagnostico_iniciado"
  | "hipotesis_agregada"
  | "diagnostico_finalizado"
  | "herramienta_consultada"
  | "restafact_consultado"
  | "dashboard_fe_consultado"
  | "sunat_consultado"
  | "notebooklm_consultado"
  | "gestion_iniciada"
  | "ticket_dev_creado"
  | "transferencia"
  | "mensaje_enviado"
  | "mensaje_recibido"
  | "nota_interna"
  | "categoria_asignada"
  | "subcategoria_asignada"
  | "atencion_finalizada"
  | "resultado_registrado"
  | "archivo_adjunto"
  | "playbook_ejecutado"
  | "sistema";

export type OrigenActividad = "cliente" | "agente" | "sistema" | "automatico" | "integracion";

export type ResultadoActividad = "ok" | "error" | "pendiente" | "informacion_no_disponible";

export interface ActividadData {
  id: string;
  tipo: TipoActividad;
  subtipo: SubtipoActividad;
  fecha: string;
  autor: string;
  autorId?: string;
  descripcion: string;
  origen: OrigenActividad;
  resultado: ResultadoActividad;
  observaciones?: string;
  metadata?: Record<string, unknown>;
}

export class Actividad {
  readonly id: string;
  readonly tipo: TipoActividad;
  readonly subtipo: SubtipoActividad;
  readonly fecha: string;
  readonly autor: string;
  readonly autorId?: string;
  readonly descripcion: string;
  readonly origen: OrigenActividad;
  readonly resultado: ResultadoActividad;
  readonly observaciones?: string;
  readonly metadata?: Record<string, unknown>;

  constructor(data: ActividadData) {
    this.id = data.id;
    this.tipo = data.tipo;
    this.subtipo = data.subtipo;
    this.fecha = data.fecha;
    this.autor = data.autor;
    this.autorId = data.autorId;
    this.descripcion = data.descripcion;
    this.origen = data.origen;
    this.resultado = data.resultado;
    this.observaciones = data.observaciones;
    this.metadata = data.metadata;
  }

  toJSON(): ActividadData {
    return {
      id: this.id,
      tipo: this.tipo,
      subtipo: this.subtipo,
      fecha: this.fecha,
      autor: this.autor,
      autorId: this.autorId,
      descripcion: this.descripcion,
      origen: this.origen,
      resultado: this.resultado,
      observaciones: this.observaciones,
      metadata: this.metadata,
    };
  }
}
