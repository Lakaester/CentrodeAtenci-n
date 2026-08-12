/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import type { KnowledgeArticle } from "./KnowledgeArticle";
import type { TipoFuenteConocimiento } from "./KnowledgeSource";
import type { NivelConocimiento } from "./KnowledgeArticle";

export interface FiltrosBusquedaConocimiento {
  query?: string;
  categoria?: string;
  subcategoria?: string;
  tags?: string[];
  producto?: string;
  pais?: string;
  fuente?: TipoFuenteConocimiento;
  nivel?: NivelConocimiento;
  casoId?: string;
  limite?: number;
  desde?: number;
}

export interface ResultadoBusquedaConocimiento {
  articulos: KnowledgeArticle[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export class KnowledgeSearch {
  private articulos: KnowledgeArticle[] = [];

  constructor(articulos?: KnowledgeArticle[]) {
    if (articulos) this.articulos = articulos;
  }

  cargar(articulos: KnowledgeArticle[]): void {
    this.articulos = articulos;
  }

  buscar(filtros: FiltrosBusquedaConocimiento): ResultadoBusquedaConocimiento {
    const q = filtros.query?.toLowerCase() ?? "";
    let resultados = this.articulos.filter((a) => {
      if (q && !this.matchQuery(a, q)) return false;
      if (filtros.categoria && a.categoria !== filtros.categoria) return false;
      if (filtros.subcategoria && a.subcategoria !== filtros.subcategoria) return false;
      if (filtros.producto && !a.productos?.includes(filtros.producto)) return false;
      if (filtros.pais && !a.paises?.includes(filtros.pais)) return false;
      if (filtros.fuente && a.fuente !== filtros.fuente) return false;
      if (filtros.nivel && a.nivel !== filtros.nivel) return false;
      if (filtros.tags?.length && !filtros.tags.some((t) => a.tags.includes(t))) return false;
      return true;
    });

    const total = resultados.length;
    const limite = filtros.limite ?? 10;
    const pagina = Math.floor((filtros.desde ?? 0) / limite) + 1;
    const totalPaginas = Math.ceil(total / limite);
    const desde = filtros.desde ?? 0;
    resultados = resultados.slice(desde, desde + limite);

    return { articulos: resultados, total, pagina, totalPaginas };
  }

  buscarPorCategoria(categoria: string): KnowledgeArticle[] {
    return this.articulos.filter((a) => a.categoria === categoria);
  }

  buscarPorTags(tags: string[]): KnowledgeArticle[] {
    return this.articulos.filter((a) => tags.some((t) => a.tags.includes(t)));
  }

  buscarPorProducto(producto: string): KnowledgeArticle[] {
    return this.articulos.filter((a) => a.productos?.includes(producto));
  }

  buscarPorPais(pais: string): KnowledgeArticle[] {
    return this.articulos.filter((a) => a.paises?.includes(pais));
  }

  buscarRelacionados(articuloId: string, max?: number): KnowledgeArticle[] {
    const articulo = this.articulos.find((a) => a.id === articuloId);
    if (!articulo) return [];
    return this.articulos
      .filter((a) => a.id !== articuloId)
      .map((a) => ({
        articulo: a,
        score: this.calcularRelevancia(articulo, a),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, max ?? 5)
      .map((r) => r.articulo);
  }

  private matchQuery(articulo: KnowledgeArticle, q: string): boolean {
    const texto = [
      articulo.titulo,
      articulo.descripcion,
      articulo.contenido,
      ...articulo.tags,
      ...articulo.palabrasClave,
      articulo.categoria,
      articulo.subcategoria,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return texto.includes(q);
  }

  private calcularRelevancia(actual: KnowledgeArticle, candidato: KnowledgeArticle): number {
    let score = 0;
    const tagsActuales = new Set(actual.tags);
    for (const tag of candidato.tags) {
      if (tagsActuales.has(tag)) score += 10;
    }
    if (candidato.categoria === actual.categoria) score += 20;
    if (candidato.nivel === actual.nivel) score += 5;
    return score;
  }
}

