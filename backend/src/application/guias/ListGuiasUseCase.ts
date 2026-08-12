import type { GuiaResolucion } from "../../domain/guias/types";

export interface GuiaFilters {
  tipoAtencion?: string;
  estado?: string;
  responsable?: string;
  search?: string;
}

export class ListGuiasUseCase {
  constructor(private guias: Map<string, GuiaResolucion>) {}

  execute(filters?: GuiaFilters): GuiaResolucion[] {
    let resultado = Array.from(this.guias.values());
    if (filters?.tipoAtencion) resultado = resultado.filter((g) => g.tipoAtencion === filters.tipoAtencion);
    if (filters?.estado) resultado = resultado.filter((g) => g.estado === filters.estado);
    if (filters?.responsable) resultado = resultado.filter((g) => g.responsable === filters.responsable);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      resultado = resultado.filter((g) => g.titulo.toLowerCase().includes(q) || g.descripcion.toLowerCase().includes(q) || g.etiquetas.some((e) => e.toLowerCase().includes(q)));
    }
    return resultado.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}
