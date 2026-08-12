import { WidgetOperativo, type WidgetOperativoDef } from "./WidgetOperativo";

export type CategoriaHomologada = string;

export interface TipoAtencionDef {
  id: string;
  nombre: string;
  descripcion: string;
  categorias: CategoriaHomologada[];
  widgets: WidgetOperativoDef[];
  herramientas: string[];
  guia?: {
    objetivo: string;
    pasos: string[];
    buenasPracticas: string[];
  };
}

export class TipoAtencion {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly categorias: CategoriaHomologada[];
  private _widgets: WidgetOperativo[];
  readonly herramientas: string[];
  readonly guia?: {
    objetivo: string;
    pasos: string[];
    buenasPracticas: string[];
  };

  constructor(data: TipoAtencionDef) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.categorias = data.categorias;
    this._widgets = data.widgets.map((w) => new WidgetOperativo(w));
    this.herramientas = data.herramientas;
    this.guia = data.guia;
  }

  get widgets(): WidgetOperativo[] {
    return [...this._widgets];
  }

  coincideCon(categoria: string, subcategoria?: string): boolean {
    return this.categorias.some(
      (c) => categoria.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(categoria.toLowerCase()),
    );
  }

  toJSON(): TipoAtencionDef {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      categorias: this.categorias,
      widgets: this._widgets.map((w) => w.toJSON()),
      herramientas: this.herramientas,
      guia: this.guia,
    };
  }
}
