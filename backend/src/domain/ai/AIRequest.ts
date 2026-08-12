import type { TipoTareaIA } from "./AITask";
import type { AIContext } from "./AIContext";

export type AIProviderId = "openai" | "claude" | "gemini" | "local" | "mock";

export interface AIRequestData {
  tarea: TipoTareaIA;
  contexto: AIContext;
  proveedor?: AIProviderId;
  temperatura?: number;
  idioma?: string;
  metadata?: Record<string, unknown>;
  maxTokens?: number;
  prompt?: string;
}

export class AIRequest {
  readonly tarea: TipoTareaIA;
  readonly contexto: AIContext;
  readonly proveedor: AIProviderId;
  readonly temperatura: number;
  readonly idioma: string;
  readonly metadata?: Record<string, unknown>;
  readonly maxTokens: number;
  readonly prompt?: string;

  constructor(data: AIRequestData) {
    this.tarea = data.tarea;
    this.contexto = data.contexto;
    this.proveedor = data.proveedor ?? "mock";
    this.temperatura = data.temperatura ?? 0.3;
    this.idioma = data.idioma ?? "es";
    this.metadata = data.metadata;
    this.maxTokens = data.maxTokens ?? 1000;
    this.prompt = data.prompt;
  }

  toJSON(): AIRequestData {
    return {
      tarea: this.tarea,
      contexto: this.contexto,
      proveedor: this.proveedor,
      temperatura: this.temperatura,
      idioma: this.idioma,
      metadata: this.metadata,
      maxTokens: this.maxTokens,
      prompt: this.prompt,
    };
  }
}
