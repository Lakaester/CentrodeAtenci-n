export type PluginStatus = "installed" | "enabled" | "disabled" | "error" | "removed";
export type PluginLifecycleAction = "install" | "enable" | "disable" | "update" | "rollback" | "uninstall";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  permissions: string[];
  dependencies: string[];
  minCoreVersion: string;
  entryPoint: string;
}

export interface Plugin {
  manifest: PluginManifest;
  status: PluginStatus;
  installedAt: string;
  updatedAt: string;
  enabledAt?: string;
  error?: string;
}

export interface PluginCapability {
  pluginId: string;
  name: string;
  description: string;
  version: string;
}

export interface PluginPermission {
  pluginId: string;
  resource: string;
  action: string;
}

export interface PluginHealth {
  pluginId: string;
  status: PluginStatus;
  version: string;
  uptimeMs: number;
  lastError: string | null;
  lastHealthCheck: string;
}

export interface PluginContext {
  pluginId: string;
  config: Record<string, unknown>;
  logger: unknown;
  eventBus: unknown;
}
