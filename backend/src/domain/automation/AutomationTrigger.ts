/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
export type TipoTrigger =
  | "caso_creado"
  | "caso_aceptado"
  | "caso_reasignado"
  | "caso_transferido"
  | "caso_resuelto"
  | "caso_cerrado"
  | "cliente_respondio"
  | "sla_iniciado"
  | "sla_vencido"
  | "ticket_dev_creado"
  | "ticket_dev_actualizado"
  | "ticket_dev_cerrado"
  | "categoria_asignada"
  | "subcategoria_asignada"
  | "diagnostico_finalizado"
  | "plugin_ejecutado"
  | "workspace_cargado";

export interface AutomationTriggerData {
  tipo: TipoTrigger;
  nombre: string;
  descripcion: string;
}

export class AutomationTrigger {
  readonly tipo: TipoTrigger;
  readonly nombre: string;
  readonly descripcion: string;

  constructor(data: AutomationTriggerData) {
    this.tipo = data.tipo;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
  }

  toJSON(): AutomationTriggerData {
    return { tipo: this.tipo, nombre: this.nombre, descripcion: this.descripcion };
  }
}

