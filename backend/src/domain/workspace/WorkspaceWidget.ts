export type TamanoWidget = "xs" | "sm" | "md" | "lg" | "xl" | "full";

export type TipoWidget =
  | "metric"
  | "list"
  | "status"
  | "checklist"
  | "button"
  | "chart"
  | "timeline"
  | "card"
  | "table"
  | "plugin";

export interface WidgetData {
  id: string;
  nombre: string;
  icono: string;
  tipo: TipoWidget;
  orden: number;
  tamano: TamanoWidget;
  prioridad: number;
  permisos?: string[];
  pluginId?: string;
  datosRequeridos?: string[];
  titulo?: string;
  descripcion?: string;
  fuente?: string;
}

export class WorkspaceWidget {
  readonly id: string;
  readonly nombre: string;
  readonly icono: string;
  readonly tipo: TipoWidget;
  readonly orden: number;
  readonly tamano: TamanoWidget;
  readonly prioridad: number;
  readonly permisos?: string[];
  readonly pluginId?: string;
  readonly datosRequeridos?: string[];
  readonly titulo?: string;
  readonly descripcion?: string;
  readonly fuente?: string;

  constructor(data: WidgetData) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.icono = data.icono;
    this.tipo = data.tipo;
    this.orden = data.orden;
    this.tamano = data.tamano;
    this.prioridad = data.prioridad;
    this.permisos = data.permisos;
    this.pluginId = data.pluginId;
    this.datosRequeridos = data.datosRequeridos;
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.fuente = data.fuente;
  }

  toJSON(): WidgetData {
    return {
      id: this.id,
      nombre: this.nombre,
      icono: this.icono,
      tipo: this.tipo,
      orden: this.orden,
      tamano: this.tamano,
      prioridad: this.prioridad,
      permisos: this.permisos,
      pluginId: this.pluginId,
      datosRequeridos: this.datosRequeridos,
      titulo: this.titulo,
      descripcion: this.descripcion,
      fuente: this.fuente,
    };
  }
}
