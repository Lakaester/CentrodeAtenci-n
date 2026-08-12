export type EstadoGuia = "borrador" | "en_revision" | "publicada" | "obsoleta";
export type TipoAtencionGuia = string;

export interface CausaGuia {
  titulo: string;
  descripcion: string;
  prioridad: "alta" | "media" | "baja";
}

export interface PasoGuia {
  titulo: string;
  descripcion: string;
  orden: number;
}

export interface VersionGuia {
  version: string;
  estado: EstadoGuia;
  creadoEn: string;
  creadoPor: string;
  cambios: string;
}

export interface GuiaResolucion {
  id: string;
  titulo: string;
  descripcion: string;
  tipoAtencion: TipoAtencionGuia;
  responsable: string;
  etiquetas: string[];
  objetivo: string;
  informacionNecesaria: string[];
  posiblesCausas: CausaGuia[];
  procesoRecomendado: PasoGuia[];
  herramientas: string[];
  buenasPracticas: string;
  criteriosResolucion: string[];
  documentos: string[];
  workspaces: string[];
  estado: EstadoGuia;
  version: string;
  versiones: VersionGuia[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
