import type { Plugin } from "../types";

export class PluginRegistry {
  private plugins = new Map<string, Plugin>();

  register(plugin: Plugin): void {
    this.plugins.set(plugin.manifest.id, plugin);
    console.log(`[PluginRegistry] Registrado: ${plugin.manifest.name} v${plugin.manifest.version}`);
  }

  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  findEnabled(): Plugin[] {
    return this.list().filter((p) => p.status === "enabled");
  }

  findByCapability(capability: string): Plugin[] {
    return this.list().filter((p) => p.manifest.capabilities.includes(capability));
  }

  exists(id: string): boolean {
    return this.plugins.has(id);
  }

  count(): number {
    return this.plugins.size;
  }
}
