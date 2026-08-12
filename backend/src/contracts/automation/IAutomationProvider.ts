import type { AutomationExecution } from "../../domain/automation/AutomationExecution";

export interface IAutomationProvider {
  procesarEvento(trigger: string, payload: Record<string, unknown>): Promise<AutomationExecution[]>;
  obtenerEjecuciones(reglaId?: string): Promise<AutomationExecution[]>;
  validarRegla(reglaId: string): Promise<boolean>;
}
