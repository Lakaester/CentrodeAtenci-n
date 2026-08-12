export type ConfigValueType = "string" | "number" | "boolean" | "json" | "secret";

export interface ConfigurationEntry {
  key: string;
  value: unknown;
  type: ConfigValueType;
  description: string;
  required: boolean;
  sensitive: boolean;
  source: string;
  version: string;
  updatedAt: string;
}

export interface ConfigurationSchema {
  key: string;
  type: ConfigValueType;
  description: string;
  required: boolean;
  sensitive: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
}

export interface ConfigurationVersion {
  id: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  changedAt: string;
}

export interface ConfigurationAudit {
  id: string;
  key: string;
  action: "created" | "updated" | "deleted";
  value: unknown;
  userId: string;
  timestamp: string;
}
