/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import type { Plugin } from "./Plugin";
import { PluginRegistry } from "./PluginRegistry";
import type { PluginCategoria, PluginAccion, PluginContextData, PluginResultado } from "./PluginTypes";

export class PluginManager {
  private registry: PluginRegistry;

  constructor() {
    this.registry = PluginRegistry.obtener();
  }

  registrar(plugin: Plugin): void {
    this.registry.registrar(plugin);
  }

  listar(): Plugin[] {
    return this.registry.listarPlugins();
  }

  buscar(id: string): Plugin | undefined {
    return this.registry.obtenerPlugin(id);
  }

  buscarPorCategoria(categoria: PluginCategoria): Plugin[] {
    return this.registry.buscarPorCategoria(categoria);
  }

  buscarPorTexto(termino: string): Plugin[] {
    return this.registry.buscarPorNombre(termino);
  }

  async obtenerPluginsDisponibles(): Promise<Plugin[]> {
    const plugins = this.registry.listarPlugins();
    const disponibles: Plugin[] = [];
    for (const p of plugins) {
      if (await p.disponible()) {
        disponibles.push(p);
      }
    }
    return disponibles;
  }

  async obtenerPluginsPorCategoria(categoria: PluginCategoria): Promise<Plugin[]> {
    const plugins = this.registry.buscarPorCategoria(categoria);
    const disponibles: Plugin[] = [];
    for (const p of plugins) {
      if (await p.disponible()) {
        disponibles.push(p);
      }
    }
    return disponibles;
  }

  async obtenerPluginsPorPlaybook(playbookId: string): Promise<Plugin[]> {
    // TODO: Obtener herramientas asociadas al playbook
    return [];
  }

  async ejecutarPlugin(pluginId: string, accionId: string, contexto: PluginContextData, parametros?: Record<string, unknown>): Promise<PluginResultado> {
    const plugin = this.registry.obtenerPlugin(pluginId);
    if (!plugin) {
      return { exito: false, error: `Plugin ${pluginId} no encontrado` };
    }
    return plugin.ejecutar(accionId, contexto, parametros);
  }

  async abrirPlugin(pluginId: string, contexto: PluginContextData): Promise<PluginResultado> {
    const plugin = this.registry.obtenerPlugin(pluginId);
    if (!plugin) {
      return { exito: false, error: `Plugin ${pluginId} no encontrado` };
    }
    return plugin.abrir(contexto);
  }
}

