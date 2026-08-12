import type { EventType } from "../types";

interface EventMeta {
  type: EventType;
  description: string;
  version: string;
  severity: "info" | "warning" | "error";
  provider?: string;
}

const EVENTS: EventMeta[] = [
  { type: "WorkspaceOpened", description: "Workspace de cliente abierto", version: "1.0", severity: "info" },
  { type: "WorkspaceClosed", description: "Workspace de cliente cerrado", version: "1.0", severity: "info" },
  { type: "CustomerFound", description: "Cliente encontrado en búsqueda", version: "1.0", severity: "info" },
  { type: "CustomerNotFound", description: "Cliente no encontrado", version: "1.0", severity: "warning" },
  { type: "LogsRequested", description: "Logs solicitados por el asesor", version: "1.0", severity: "info", provider: "printer" },
  { type: "FeatureFlagsRequested", description: "Feature flags consultados", version: "1.0", severity: "info", provider: "printer" },
  { type: "DecisionGenerated", description: "Diagnóstico generado por Decision Engine", version: "1.0", severity: "info" },
  { type: "RuleMatched", description: "Regla del Decision Engine coincidió", version: "1.0", severity: "info" },
  { type: "ProviderError", description: "Error en provider externo", version: "1.0", severity: "error" },
  { type: "ConfigurationChanged", description: "Configuración modificada", version: "1.0", severity: "warning" },
];

export class EventRegistry {
  private events = new Map<string, EventMeta>();

  constructor() {
    for (const ev of EVENTS) this.events.set(ev.type, ev);
  }

  register(meta: EventMeta): void {
    this.events.set(meta.type, meta);
  }

  get(type: string): EventMeta | undefined {
    return this.events.get(type);
  }

  list(): EventMeta[] {
    return Array.from(this.events.values());
  }
}
