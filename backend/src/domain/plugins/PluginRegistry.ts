/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import type { Plugin } from "./Plugin";
import type { PluginCategoria } from "./PluginTypes";

export class PluginRegistry {
  private static instancia: PluginRegistry;
  private plugins: Map<string, Plugin> = new Map();

  private constructor() {}

  static obtener(): PluginRegistry {
    if (!PluginRegistry.instancia) {
      PluginRegistry.instancia = new PluginRegistry();
    }
    return PluginRegistry.instancia;
  }

  registrar(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} ya estÃ¡ registrado. Se omitirÃ¡.`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
  }

  obtenerPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  listarPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  buscarPorCategoria(categoria: PluginCategoria): Plugin[] {
    return this.listarPlugins().filter((p) => p.categoria === categoria);
  }

  buscarPorNombre(termino: string): Plugin[] {
    const q = termino.toLowerCase();
    return this.listarPlugins().filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q),
    );
  }

  eliminar(id: string): boolean {
    return this.plugins.delete(id);
  }

  limpiar(): void {
    this.plugins.clear();
  }

  get cantidad(): number {
    return this.plugins.size;
  }
}

