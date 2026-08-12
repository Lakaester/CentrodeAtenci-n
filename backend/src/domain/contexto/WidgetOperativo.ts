export type WidgetTipo = "metric" | "status" | "list" | "action" | "chart" | "embed" | "info";

export type WidgetAccion =
  | "reenviar_comprobantes"
  | "renovar_cdt"
  | "abrir_dashboard_fe"
  | "abrir_restafact"
  | "abrir_sunat"
  | "abrir_dominio"
  | "abrir_microservice"
  | "abrir_notebooklm"
  | "abrir_monitor";

export interface WidgetAccionDef {
  id: WidgetAccion;
  label: string;
  icono: string;
  disponible: boolean;
}

export interface WidgetOperativoDef {
  id: string;
  tipo: WidgetTipo;
  titulo: string;
  descripcion: string;
  icono?: string;
  acciones?: WidgetAccionDef[];
  orden: number;
  seccion: string;
  datosDisponibles: boolean;
  mensajeNoDisponible?: string;
}

export class WidgetOperativo {
  readonly id: string;
  readonly tipo: WidgetTipo;
  readonly titulo: string;
  readonly descripcion: string;
  readonly icono?: string;
  readonly acciones: WidgetAccionDef[];
  readonly orden: number;
  readonly seccion: string;
  readonly datosDisponibles: boolean;
  readonly mensajeNoDisponible?: string;

  constructor(data: WidgetOperativoDef) {
    this.id = data.id;
    this.tipo = data.tipo;
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.icono = data.icono;
    this.acciones = data.acciones ?? [];
    this.orden = data.orden;
    this.seccion = data.seccion;
    this.datosDisponibles = data.datosDisponibles;
    this.mensajeNoDisponible = data.mensajeNoDisponible;
  }

  toJSON(): WidgetOperativoDef {
    return {
      id: this.id,
      tipo: this.tipo,
      titulo: this.titulo,
      descripcion: this.descripcion,
      icono: this.icono,
      acciones: this.acciones,
      orden: this.orden,
      seccion: this.seccion,
      datosDisponibles: this.datosDisponibles,
      mensajeNoDisponible: this.mensajeNoDisponible,
    };
  }
}
