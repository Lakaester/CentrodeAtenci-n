import type { AIRequest } from "./AIRequest";
import type { AIResponse } from "./AIResponse";

export abstract class AIProvider {
  abstract readonly id: string;
  abstract readonly nombre: string;
  abstract readonly modelo: string;
  abstract readonly disponible: boolean;

  abstract ejecutar(request: AIRequest): Promise<AIResponse>;

  abstract validarDisponibilidad(): Promise<boolean>;

  abstract obtenerTemperatura(): number;
}
