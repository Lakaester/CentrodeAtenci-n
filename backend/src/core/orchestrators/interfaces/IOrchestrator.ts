import type { CustomerContext } from "../../customer/types";
import type { DiagnosisResult } from "../types";

export interface IOrchestrator {
  getName(): string;
  getDescription(): string;
  canHandle(context: CustomerContext, problem: string): boolean;
  execute(context: CustomerContext, params: unknown): Promise<DiagnosisResult>;
}
