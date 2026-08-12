/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import { AutomationTrigger, type AutomationTriggerData } from "./AutomationTrigger";
import { AutomationCondition, type AutomationConditionData } from "./AutomationCondition";
import { AutomationAction, type AutomationActionData } from "./AutomationAction";

export interface AutomationRuleData {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  prioridad: number;
  triggers: AutomationTriggerData[];
  condiciones: AutomationConditionData[];
  acciones: AutomationActionData[];
}

export class AutomationRule {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly activa: boolean;
  readonly prioridad: number;
  readonly triggers: AutomationTrigger[];
  readonly condiciones: AutomationCondition[];
  readonly acciones: AutomationAction[];

  constructor(data: AutomationRuleData) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.activa = data.activa;
    this.prioridad = data.prioridad;
    this.triggers = data.triggers.map((t) => new AutomationTrigger(t));
    this.condiciones = data.condiciones.map((c) => new AutomationCondition(c));
    this.acciones = data.acciones.map((a) => new AutomationAction(a));
  }

  toJSON(): AutomationRuleData {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      activa: this.activa,
      prioridad: this.prioridad,
      triggers: this.triggers.map((t) => t.toJSON()),
      condiciones: this.condiciones.map((c) => c.toJSON()),
      acciones: this.acciones.map((a) => a.toJSON()),
    };
  }
}

