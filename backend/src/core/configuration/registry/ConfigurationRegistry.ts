import { SchemaValidator } from "../validators/SchemaValidator";
import { EnvProvider } from "../providers/EnvProvider";
import type { ConfigurationEntry, ConfigurationSchema, ConfigurationVersion, ConfigurationAudit } from "../types";

/**
 * ConfigurationRegistry — Único punto de acceso a configuraciones del sistema.
 * Ningún módulo debe acceder a process.env directamente.
 */
export class ConfigurationRegistry {
  private schemas = new Map<string, ConfigurationSchema>();
  private entries = new Map<string, ConfigurationEntry>();
  private versions: ConfigurationVersion[] = [];
  private audits: ConfigurationAudit[] = [];
  private validator = new SchemaValidator();
  private envProvider = new EnvProvider();

  registerSchema(schema: ConfigurationSchema): void {
    this.schemas.set(schema.key, schema);
  }

  set(key: string, value: unknown, userId = "system"): string | null {
    const schema = this.schemas.get(key);
    if (schema) {
      const error = this.validator.validate(schema, value);
      if (error) return error;
    }

    const oldValue = this.entries.get(key)?.value;
    const entry: ConfigurationEntry = {
      key,
      value,
      type: schema?.type ?? "string",
      description: schema?.description ?? "",
      required: schema?.required ?? false,
      sensitive: schema?.sensitive ?? false,
      source: "registry",
      version: "1.0",
      updatedAt: new Date().toISOString(),
    };
    this.entries.set(key, entry);
    this.versions.push({ id: `v${this.versions.length + 1}`, key, oldValue, newValue: value, changedBy: userId, changedAt: new Date().toISOString() });
    this.audits.push({ id: `aud_${Date.now()}`, key, action: "updated", value, userId, timestamp: new Date().toISOString() });
    return null;
  }

  get(key: string): ConfigurationEntry | undefined {
    return this.entries.get(key) ?? this.envProvider.get(key) ?? undefined;
  }

  getValue<T>(key: string, defaultValue?: T): T | undefined {
    const entry = this.get(key);
    if (!entry) return defaultValue;
    try {
      if (entry.type === "number") return Number(entry.value) as T;
      if (entry.type === "boolean") return (entry.value === "true" || entry.value === true) as T;
      return entry.value as T;
    } catch {
      return entry.value as T;
    }
  }

  delete(key: string, userId = "system"): void {
    const entry = this.entries.get(key);
    if (entry) {
      this.audits.push({ id: `aud_${Date.now()}`, key, action: "deleted", value: entry.value, userId, timestamp: new Date().toISOString() });
      this.entries.delete(key);
    }
  }

  list(): ConfigurationEntry[] {
    const env = this.envProvider.getAll();
    const registered = Array.from(this.entries.values());
    const merged = new Map<string, ConfigurationEntry>();
    for (const e of [...env, ...registered]) merged.set(e.key, e);
    return Array.from(merged.values());
  }

  getHistory(key: string): ConfigurationVersion[] {
    return this.versions.filter((v) => v.key === key).sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  }

  getAudits(): ConfigurationAudit[] {
    return this.audits.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}
