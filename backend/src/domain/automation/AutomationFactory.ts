/** @deprecated Usar la implementaci�n en src/core/ en su lugar. Este archivo se eliminar� en M2. */
import { AutomationRule, type AutomationRuleData } from "./AutomationRule";
import { AutomationExecution, type AutomationExecutionData } from "./AutomationExecution";
import { AutomationAction, type AutomationActionData, type TipoAccionAutomation } from "./AutomationAction";
import { AutomationCondition, type AutomationConditionData, type TipoCondicionAutomation, type OperadorCondicion } from "./AutomationCondition";
import { AutomationTrigger, type AutomationTriggerData, type TipoTrigger } from "./AutomationTrigger";

export class AutomationFactory {
  static crearRegla(data: AutomationRuleData): AutomationRule {
    return new AutomationRule(data);
  }

  static crearEjecucion(data: AutomationExecutionData): AutomationExecution {
    return new AutomationExecution(data);
  }

  static crearTrigger(tipo: TipoTrigger, nombre: string, descripcion: string): AutomationTrigger {
    return new AutomationTrigger({ tipo, nombre, descripcion });
  }

  static crearCondicion(tipo: TipoCondicionAutomation, operador: OperadorCondicion, valor?: unknown, etiqueta?: string): AutomationCondition {
    return new AutomationCondition({ tipo, operador, valor, etiqueta });
  }

  static crearAccion(tipo: TipoAccionAutomation, parametros: Record<string, unknown>, orden: number, descripcion: string): AutomationAction {
    return new AutomationAction({ tipo, parametros, orden, descripcion });
  }

  static crearReglasPorDefecto(): AutomationRule[] {
    const reglas: AutomationRuleData[] = [
      {
        id: "auto_sla_alta", nombre: "Alertar SLA alto", descripcion: "Cuando el SLA supera el 85%, crear notificación crítica",
        activa: true, prioridad: 1,
        triggers: [{ tipo: "sla_vencido" as TipoTrigger, nombre: "SLA vencido", descripcion: "El SLA ha vencido" }],
        condiciones: [{ tipo: "SLA" as TipoCondicionAutomation, operador: "mayor_que" as OperadorCondicion, valor: 85, etiqueta: "SLA > 85%" }],
        acciones: [
          { tipo: "CREAR_NOTIFICACION" as TipoAccionAutomation, parametros: { prioridad: "critica" }, orden: 1, descripcion: "Notificar SLA crítico" },
          { tipo: "REGISTRAR_AUDITORIA" as TipoAccionAutomation, parametros: {}, orden: 2, descripcion: "Registrar en auditoría" },
        ],
      },
      {
        id: "auto_high_touch", nombre: "Asignar High Touch", descripcion: "Cuando un cliente High Touch crea un caso, asignar al asesor con menor carga",
        activa: true, prioridad: 2,
        triggers: [{ tipo: "caso_creado" as TipoTrigger, nombre: "Caso creado", descripcion: "Se creó un nuevo caso" }],
        condiciones: [{ tipo: "CLIENTE_HIGH_TOUCH" as TipoCondicionAutomation, operador: "existe" as OperadorCondicion, etiqueta: "Cliente High Touch" }],
        acciones: [
          { tipo: "CREAR_NOTIFICACION" as TipoAccionAutomation, parametros: { prioridad: "alta" }, orden: 1, descripcion: "Notificar caso High Touch" },
          { tipo: "CARGAR_PLAYBOOK" as TipoAccionAutomation, parametros: { playbook: "high_touch" }, orden: 2, descripcion: "Cargar playbook prioritario" },
        ],
      },
      {
        id: "auto_cliente_responde", nombre: "Cliente respondió", descripcion: "Cuando el cliente responde, notificar al asesor y registrar timeline",
        activa: true, prioridad: 3,
        triggers: [{ tipo: "cliente_respondio" as TipoTrigger, nombre: "Cliente respondió", descripcion: "El cliente envió un mensaje" }],
        condiciones: [],
        acciones: [
          { tipo: "CREAR_NOTIFICACION" as TipoAccionAutomation, parametros: { prioridad: "alta" }, orden: 1, descripcion: "Notificar al asesor" },
          { tipo: "CREAR_TIMELINE" as TipoAccionAutomation, parametros: {}, orden: 2, descripcion: "Registrar en timeline" },
        ],
      },
    ];
    return reglas.map((r) => new AutomationRule(r));
  }
}

