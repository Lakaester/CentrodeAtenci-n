import { PluginRegistry } from "../registry/PluginRegistry";

export class CapabilityResolver {
  constructor(private registry: PluginRegistry) {}

  resolve(capability: string): string[] {
    return this.registry
      .findByCapability(capability)
      .filter((p) => p.status === "enabled")
      .map((p) => p.manifest.id);
  }

  hasCapability(pluginId: string, capability: string): boolean {
    const plugin = this.registry.get(pluginId);
    return plugin?.manifest.capabilities.includes(capability) ?? false;
  }

  listCapabilities(): { capability: string; plugins: string[] }[] {
    const capMap = new Map<string, string[]>();
    for (const p of this.registry.findEnabled()) {
      for (const cap of p.manifest.capabilities) {
        const list = capMap.get(cap) ?? [];
        list.push(p.manifest.id);
        capMap.set(cap, list);
      }
    }
    return Array.from(capMap.entries()).map(([capability, plugins]) => ({ capability, plugins }));
  }
}
