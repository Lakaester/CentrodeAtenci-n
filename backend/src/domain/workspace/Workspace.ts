import { WorkspaceSection, type SectionData } from "./WorkspaceSection";
import type { WorkspacePlugin } from "./WorkspaceContext";

export interface WorkspaceHeader {
  titulo: string;
  descripcion?: string;
  icono?: string;
  color?: string;
}

export interface AccionRapida {
  id: string;
  nombre: string;
  icono: string;
  pluginId?: string;
  url?: string;
}

export interface WorkspaceData {
  id: string;
  categoriaId: string;
  header: WorkspaceHeader;
  secciones: SectionData[];
  accionesRapidas: AccionRapida[];
  plugins: WorkspacePlugin[];
}

export class Workspace {
  readonly id: string;
  readonly categoriaId: string;
  readonly header: WorkspaceHeader;
  readonly secciones: WorkspaceSection[];
  readonly accionesRapidas: AccionRapida[];
  readonly plugins: WorkspacePlugin[];

  constructor(data: WorkspaceData) {
    this.id = data.id;
    this.categoriaId = data.categoriaId;
    this.header = data.header;
    this.secciones = data.secciones.map((s) => new WorkspaceSection(s));
    this.accionesRapidas = data.accionesRapidas;
    this.plugins = data.plugins;
  }

  obtenerSeccion(tipo: string): WorkspaceSection | undefined {
    return this.secciones.find((s) => s.tipo === tipo);
  }

  obtenerWidgetsPorPlugin(pluginId: string): WorkspaceSection[] {
    return this.secciones.filter((s) => s.widgets.some((w) => w.pluginId === pluginId));
  }

  toJSON(): WorkspaceData {
    return {
      id: this.id,
      categoriaId: this.categoriaId,
      header: this.header,
      secciones: this.secciones.map((s) => s.toJSON()),
      accionesRapidas: this.accionesRapidas,
      plugins: this.plugins,
    };
  }
}
