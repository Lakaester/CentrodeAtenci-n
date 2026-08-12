import { PluginRegistry } from "../registry/PluginRegistry";
import { LifecycleManager } from "../lifecycle/LifecycleManager";
import { CapabilityResolver } from "../capabilities/CapabilityResolver";
import type { PluginManifest, PluginHealth } from "../types";

export class PluginManager {
  registry = new PluginRegistry();
  lifecycle: LifecycleManager;
  capabilities: CapabilityResolver;

  constructor() {
    this.lifecycle = new LifecycleManager(this.registry);
    this.capabilities = new CapabilityResolver(this.registry);
  }

  install(manifest: PluginManifest) {
    return this.lifecycle.install(manifest);
  }

  enable(pluginId: string) {
    return this.lifecycle.enable(pluginId);
  }

  disable(pluginId: string) {
    return this.lifecycle.disable(pluginId);
  }

  remove(pluginId: string) {
    return this.lifecycle.remove(pluginId);
  }

  getPlugin(id: string) {
    return this.registry.get(id);
  }

  listPlugins() {
    return this.registry.list();
  }

  getHealth(pluginId: string): PluginHealth | null {
    const plugin = this.registry.get(pluginId);
    if (!plugin) return null;
    return {
      pluginId,
      status: plugin.status,
      version: plugin.manifest.version,
      uptimeMs: plugin.enabledAt ? Date.now() - new Date(plugin.enabledAt).getTime() : 0,
      lastError: plugin.error ?? null,
      lastHealthCheck: new Date().toISOString(),
    };
  }

  getStats() {
    const all = this.registry.list();
    return {
      total: all.length,
      enabled: all.filter((p) => p.status === "enabled").length,
      disabled: all.filter((p) => p.status === "disabled").length,
      error: all.filter((p) => p.status === "error").length,
    };
  }
}
