/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import { KnowledgeArticle } from "./KnowledgeArticle";
import { KnowledgeSource } from "./KnowledgeSource";
import { KnowledgeCategory } from "./KnowledgeCategory";
import { KnowledgeSearch, type FiltrosBusquedaConocimiento, type ResultadoBusquedaConocimiento } from "./KnowledgeSearch";
import { KnowledgeFactory } from "./KnowledgeFactory";

export class KnowledgeEngine {
  private search: KnowledgeSearch;
  private fuentes: KnowledgeSource[] = [];
  private categorias: KnowledgeCategory[] = [];

  constructor() {
    this.search = new KnowledgeSearch();
  }

  inicializar(): void {
    this.fuentes = KnowledgeFactory.crearFuentesPorDefecto();
    this.categorias = KnowledgeFactory.crearCategoriasPorDefecto();
    const articulos = KnowledgeFactory.crearArticulosMock();
    this.search.cargar(articulos);
  }

  buscar(filtros: FiltrosBusquedaConocimiento): ResultadoBusquedaConocimiento {
    return this.search.buscar(filtros);
  }

  buscarPorCategoria(categoria: string): KnowledgeArticle[] {
    return this.search.buscarPorCategoria(categoria);
  }

  buscarRelacionados(articuloId: string, max?: number): KnowledgeArticle[] {
    return this.search.buscarRelacionados(articuloId, max);
  }

  obtenerFuentes(): KnowledgeSource[] {
    return this.fuentes;
  }

  obtenerCategorias(): KnowledgeCategory[] {
    return this.categorias;
  }

  obtenerRecomendados(categoria?: string): KnowledgeArticle[] {
    if (categoria) return this.search.buscarPorCategoria(categoria);
    return [];
  }

  cargarArticulos(articulos: KnowledgeArticle[]): void {
    this.search.cargar(articulos);
  }
}

