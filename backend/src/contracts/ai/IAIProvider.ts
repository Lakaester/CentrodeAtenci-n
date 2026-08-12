import type { AIRequest } from "../../domain/ai/AIRequest";
import type { AIResponse } from "../../domain/ai/AIResponse";

export interface IAIProvider {
  readonly id: string;
  readonly nombre: string;
  readonly modelo: string;
  readonly disponible: boolean;

  ejecutar(request: AIRequest): Promise<AIResponse>;
  validarDisponibilidad(): Promise<boolean>;
}
