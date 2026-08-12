export type TipoWidget = "metric" | "list" | "status" | "checklist" | "button";

export interface Widget {
  id: string;
  tipo: TipoWidget;
  titulo: string;
  fuente?: string;
  icono?: string;
  orden: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  obligatorio: boolean;
  orden: number;
}

export interface AccesoRapido {
  id: string;
  nombre: string;
  url: string;
  icono: string;
}

export interface WorkspaceConfig {
  id: string;
  categoriaId: string;
  widgets: Widget[];
  checklist: ChecklistItem[];
  accesosRapidos: AccesoRapido[];
  herramientasIds: string[];
}
