import type { KnowledgeArticle } from "../../domain/knowledge/KnowledgeArticle";
import type { FiltrosBusquedaConocimiento, ResultadoBusquedaConocimiento } from "../../domain/knowledge/KnowledgeSearch";

export interface IKnowledgeProvider {
  buscar(filtros: FiltrosBusquedaConocimiento): Promise<ResultadoBusquedaConocimiento>;
  obtenerArticulo(id: string): Promise<KnowledgeArticle | null>;
  obtenerRecomendados(categoria?: string): Promise<KnowledgeArticle[]>;
  buscarRelacionados(articuloId: string): Promise<KnowledgeArticle[]>;
}
