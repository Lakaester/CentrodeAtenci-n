/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
export type TipoFuenteConocimiento =
  | "notebooklm"
  | "manual_pdf"
  | "procedimiento"
  | "video"
  | "faq"
  | "caso_resuelto"
  | "error_conocido"
  | "documentacion_tecnica"
  | "wiki"
  | "macro";

export interface KnowledgeSourceData {
  id: string;
  tipo: TipoFuenteConocimiento;
  nombre: string;
  descripcion: string;
  prioridad: number;
  url?: string;
  icono?: string;
}

export class KnowledgeSource {
  readonly id: string;
  readonly tipo: TipoFuenteConocimiento;
  readonly nombre: string;
  readonly descripcion: string;
  readonly prioridad: number;
  readonly url?: string;
  readonly icono?: string;

  constructor(data: KnowledgeSourceData) {
    this.id = data.id;
    this.tipo = data.tipo;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.prioridad = data.prioridad;
    this.url = data.url;
    this.icono = data.icono;
  }

  toJSON(): KnowledgeSourceData {
    return {
      id: this.id,
      tipo: this.tipo,
      nombre: this.nombre,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      url: this.url,
      icono: this.icono,
    };
  }
}

