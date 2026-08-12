import { PluginRegistry } from "../registry/PluginRegistry";
import type { Plugin, PluginLifecycleAction, PluginManifest } from "../types";

const VALID_TRANSITIONS: Record<string, string[]> = {
  installed: ["enabled", "removed"],
  enabled: ["disabled", "removed"],
  disabled: ["enabled", "removed"],
  error: ["disabled", "removed"],
  removed: [],
};

export class LifecycleManager {
  constructor(private registry: PluginRegistry) {}

  install(manifest: PluginManifest): Plugin {
    const plugin: Plugin = {
      manifest,
      status: "installed",
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.registry.register(plugin);
    return plugin;
  }

  enable(pluginId: string): Plugin | null {
    return this.transition(pluginId, "enabled");
  }

  disable(pluginId: string): Plugin | null {
    return this.transition(pluginId, "disabled");
  }

  remove(pluginId: string): Plugin | null {
    return this.transition(pluginId, "removed");
  }

  private transition(pluginId: string, targetStatus: string): Plugin | null {
    const plugin = this.registry.get(pluginId);
    if (!plugin) return null;
    const allowed = VALID_TRANSITIONS[plugin.status] ?? [];
    if (!allowed.includes(targetStatus)) return null;
    plugin.status = targetStatus as any;
    plugin.updatedAt = new Date().toISOString();
    if (targetStatus === "enabled") plugin.enabledAt = new Date().toISOString();
    return plugin;
  }
}
