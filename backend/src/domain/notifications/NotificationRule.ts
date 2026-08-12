import type { NivelPrioridad } from "./NotificationPriority";

export type TipoReglaNotificacion =
  | "SLA_POR_VENCER"
  | "SLA_VENCIDO"
  | "CLIENTE_HIGH_TOUCH_ESPERANDO"
  | "TICKET_DEV_ACTUALIZADO"
  | "CLIENTE_RESPONDIO"
  | "CASO_REASIGNADO"
  | "CASO_TRANSFERIDO"
  | "CASO_RESUELTO"
  | "NUEVA_ATENCION"
  | "ERROR_DE_INTEGRACION"
  | "PLUGIN_FUERA_DE_SERVICIO"
  | "IA_DETECTO_RIESGO"
  | "INCREMENTO_ANORMAL_CATEGORIA"
  | "SUPERVISOR_REQUERIDO";

export interface NotificationRuleData {
  tipo: TipoReglaNotificacion;
  nombre: string;
  descripcion: string;
  prioridad: NivelPrioridad;
  canales: string[];
  activa: boolean;
  cooldownSegundos: number;
}

export class NotificationRule {
  readonly tipo: TipoReglaNotificacion;
  readonly nombre: string;
  readonly descripcion: string;
  readonly prioridad: NivelPrioridad;
  readonly canales: string[];
  readonly activa: boolean;
  readonly cooldownSegundos: number;

  constructor(data: NotificationRuleData) {
    this.tipo = data.tipo;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.prioridad = data.prioridad;
    this.canales = data.canales;
    this.activa = data.activa;
    this.cooldownSegundos = data.cooldownSegundos;
  }

  toJSON(): NotificationRuleData {
    return {
      tipo: this.tipo,
      nombre: this.nombre,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      canales: this.canales,
      activa: this.activa,
      cooldownSegundos: this.cooldownSegundos,
    };
  }
}
