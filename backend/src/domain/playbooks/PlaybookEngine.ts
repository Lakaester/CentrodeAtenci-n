import { Playbook, type CategoriaPlaybook } from "./Playbook";
import { PlaybookFactory } from "./PlaybookFactory";

export interface RecomendarPlaybookParams {
  categoria: string;
  canal?: string;
  producto?: string;
  pais?: string;
}

export class PlaybookEngine {
  private factory: typeof PlaybookFactory;

  constructor() {
    this.factory = PlaybookFactory;
  }

  inicializar(): void {
    this.factory.inicializar();
  }

  obtener(categoria: CategoriaPlaybook): Playbook {
    return this.factory.crear(categoria);
  }

  obtenerTodos(): Playbook[] {
    return this.factory.crearTodos();
  }

  recomendar(params: RecomendarPlaybookParams): Playbook | null {
    const categorias = this.obtenerTodos();
    const candidatas = categorias.filter((p) => {
      const matchCategoria = !params.categoria || p.categoria === params.categoria;
      return matchCategoria;
    });
    if (candidatas.length === 0) return null;
    candidatas.sort((a, b) => a.prioridad - b.prioridad);
    return candidatas[0];
  }

  recomendarPorCategoria(categoria: string): Playbook | null {
    try {
      return this.factory.crear(categoria as CategoriaPlaybook);
    } catch {
      return null;
    }
  }

  progreso(playbook: Playbook): number {
    return playbook.progreso;
  }

  pasosPendientes(playbook: Playbook) {
    return playbook.pasosPendientes;
  }
}
