import type { Herramienta } from "../domain/herramientas/types";

class HerramientasStore {
  private herramientas: Map<string, Herramienta> = new Map();

  getMap(): Map<string, Herramienta> {
    return this.herramientas;
  }

  getPorTipoAtencion(tipoAtencion: string): Herramienta[] {
    return Array.from(this.herramientas.values())
      .filter((h) => h.tiposAtencion.includes(tipoAtencion) && h.estado === "activo" && h.visible)
      .sort((a, b) => a.orden - b.orden);
  }

  getNombresPorTipo(tipoAtencion: string): string[] {
    return this.getPorTipoAtencion(tipoAtencion).map((h) => h.nombre);
  }
}

export const herramientasStore = new HerramientasStore();
