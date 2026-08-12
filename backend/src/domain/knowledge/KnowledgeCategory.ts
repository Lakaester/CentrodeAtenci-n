/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
export interface KnowledgeCategoryData {
  id: string;
  nombre: string;
  descripcion: string;
  icono?: string;
  padreId?: string;
}

export class KnowledgeCategory {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly icono?: string;
  readonly padreId?: string;

  constructor(data: KnowledgeCategoryData) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.icono = data.icono;
    this.padreId = data.padreId;
  }

  toJSON(): KnowledgeCategoryData {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      icono: this.icono,
      padreId: this.padreId,
    };
  }
}

