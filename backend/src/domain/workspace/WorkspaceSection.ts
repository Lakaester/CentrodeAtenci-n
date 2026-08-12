import { WorkspaceWidget, type WidgetData } from "./WorkspaceWidget";

export type TipoSeccion =
  | "cliente"
  | "diagnostico"
  | "historial"
  | "herramientas"
  | "checklist"
  | "ia"
  | "dev"
  | "notas"
  | "plugins"
  | "playbooks"
  | "metricas"
  | "personalizado";

export interface SectionData {
  id: string;
  tipo: TipoSeccion;
  titulo: string;
  descripcion?: string;
  orden: number;
  widgets: WidgetData[];
  colapsable: boolean;
  abiertoPorDefecto: boolean;
}

export class WorkspaceSection {
  readonly id: string;
  readonly tipo: TipoSeccion;
  readonly titulo: string;
  readonly descripcion?: string;
  readonly orden: number;
  readonly widgets: WorkspaceWidget[];
  readonly colapsable: boolean;
  readonly abiertoPorDefecto: boolean;

  constructor(data: SectionData) {
    this.id = data.id;
    this.tipo = data.tipo;
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.orden = data.orden;
    this.widgets = data.widgets.map((w) => new WorkspaceWidget(w));
    this.colapsable = data.colapsable;
    this.abiertoPorDefecto = data.abiertoPorDefecto;
  }

  toJSON(): SectionData {
    return {
      id: this.id,
      tipo: this.tipo,
      titulo: this.titulo,
      descripcion: this.descripcion,
      orden: this.orden,
      widgets: this.widgets.map((w) => w.toJSON()),
      colapsable: this.colapsable,
      abiertoPorDefecto: this.abiertoPorDefecto,
    };
  }
}
