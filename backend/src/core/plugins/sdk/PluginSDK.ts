/**
 * PluginSDK — Interfaz pública que todos los Plugins pueden consumir.
 * El Core nunca expone implementaciones concretas, solo contratos.
 */
export interface PluginSDK {
  logger: {
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
  };
  audit: {
    record(accion: string, dominio: string, resultado: string): Promise<void>;
  };
  timeline: {
    add(dominio: string, event: string, detail: string): Promise<void>;
  };
  eventBus: {
    publish(eventType: string, payload: unknown): Promise<void>;
    subscribe(eventType: string, handler: (payload: unknown) => Promise<void>): string;
  };
  customer: {
    resolve(dominio: string): Promise<unknown>;
  };
  decision: {
    evaluate(dominio: string, context: Record<string, unknown>): Promise<unknown>;
  };
  knowledge: {
    search(query: string): Promise<unknown>;
  };
  cases: {
    create(data: unknown): Promise<unknown>;
    get(id: string): Promise<unknown>;
  };
  workflows: {
    startInstance(definitionId: string, context: Record<string, unknown>): Promise<unknown>;
  };
}
