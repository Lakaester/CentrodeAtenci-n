import type { ConfigurationEntry } from "../types";

/**
 * EnvProvider — Lee configuraciones desde variables de entorno (process.env).
 * Es el provider por defecto. Los módulos del core no deben acceder a process.env directamente.
 */
export class EnvProvider {
  get(key: string): ConfigurationEntry | null {
    const value = process.env[key];
    if (value === undefined) return null;
    return {
      key,
      value,
      type: "string",
      description: `Variable de entorno: ${key}`,
      required: false,
      sensitive: key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("key"),
      source: "env",
      version: "1.0",
      updatedAt: new Date().toISOString(),
    };
  }

  getAll(): ConfigurationEntry[] {
    return Object.entries(process.env)
      .filter(([_, v]) => v !== undefined)
      .map(([key, value]) => ({
        key,
        value,
        type: "string",
        description: `Variable de entorno: ${key}`,
        required: false,
        sensitive: key.toLowerCase().includes("token") || key.toLowerCase().includes("secret"),
        source: "env",
        version: "1.0",
        updatedAt: new Date().toISOString(),
      }));
  }
}
