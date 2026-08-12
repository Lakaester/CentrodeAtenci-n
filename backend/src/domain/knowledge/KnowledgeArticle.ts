/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import type { TipoFuenteConocimiento } from "./KnowledgeSource";

export type NivelConocimiento = "principiante" | "intermedio" | "avanzado";

export interface KnowledgeArticleData {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  tags: string[];
  palabrasClave: string[];
  nivel: NivelConocimiento;
  autor: string;
  fecha: string;
  ultimaActualizacion: string;
  fuente: TipoFuenteConocimiento;
  url?: string;
  tiempoLectura?: string;
  productos?: string[];
  paises?: string[];
  contenido?: string;
}

export class KnowledgeArticle {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly categoria: string;
  readonly subcategoria?: string;
  readonly tags: string[];
  readonly palabrasClave: string[];
  readonly nivel: NivelConocimiento;
  readonly autor: string;
  readonly fecha: string;
  readonly ultimaActualizacion: string;
  readonly fuente: TipoFuenteConocimiento;
  readonly url?: string;
  readonly tiempoLectura?: string;
  readonly productos?: string[];
  readonly paises?: string[];
  readonly contenido?: string;

  constructor(data: KnowledgeArticleData) {
    this.id = data.id;
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.categoria = data.categoria;
    this.subcategoria = data.subcategoria;
    this.tags = data.tags;
    this.palabrasClave = data.palabrasClave;
    this.nivel = data.nivel;
    this.autor = data.autor;
    this.fecha = data.fecha;
    this.ultimaActualizacion = data.ultimaActualizacion;
    this.fuente = data.fuente;
    this.url = data.url;
    this.tiempoLectura = data.tiempoLectura;
    this.productos = data.productos;
    this.paises = data.paises;
    this.contenido = data.contenido;
  }

  toJSON(): KnowledgeArticleData {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      categoria: this.categoria,
      subcategoria: this.subcategoria,
      tags: this.tags,
      palabrasClave: this.palabrasClave,
      nivel: this.nivel,
      autor: this.autor,
      fecha: this.fecha,
      ultimaActualizacion: this.ultimaActualizacion,
      fuente: this.fuente,
      url: this.url,
      tiempoLectura: this.tiempoLectura,
      productos: this.productos,
      paises: this.paises,
      contenido: this.contenido,
    };
  }
}

