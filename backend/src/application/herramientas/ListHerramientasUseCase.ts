import type { Herramienta } from "../../domain/herramientas/types";

export interface HerramientaFilters {
  tipo?: string;
  estado?: string;
  categoria?: string;
  tipoAtencion?: string;
  search?: string;
}

export class ListHerramientasUseCase {
  constructor(private herramientas: Map<string, Herramienta>) {}

  execute(filters?: HerramientaFilters): Herramienta[] {
    let resultado = Array.from(this.herramientas.values());
    if (filters?.tipo) resultado = resultado.filter((h) => h.tipo === filters.tipo);
    if (filters?.estado) resultado = resultado.filter((h) => h.estado === filters.estado);
    if (filters?.categoria) resultado = resultado.filter((h) => h.categoria === filters.categoria);
    if (filters?.tipoAtencion) resultado = resultado.filter((h) => h.tiposAtencion.includes(filters.tipoAtencion!));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      resultado = resultado.filter((h) => h.nombre.toLowerCase().includes(q) || h.descripcion.toLowerCase().includes(q));
    }
    return resultado.sort((a, b) => a.orden - b.orden);
  }
}
