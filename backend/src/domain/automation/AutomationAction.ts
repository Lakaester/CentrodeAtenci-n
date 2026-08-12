/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
export type TipoAccionAutomation =
  | "CREAR_NOTIFICACION"
  | "CAMBIAR_ESTADO"
  | "ASIGNAR_ASESOR"
  | "CARGAR_PLAYBOOK"
  | "ABRIR_WORKSPACE"
  | "EJECUTAR_PLUGIN"
  | "CREAR_TIMELINE"
  | "REGISTRAR_AUDITORIA"
  | "INVOCAR_IA"
  | "CREAR_TICKET_DEV"
  | "EJECUTAR_WEBHOOK"
  | "ENVIAR_EMAIL"
  | "ENVIAR_WHATSAPP";

export interface AutomationActionData {
  tipo: TipoAccionAutomation;
  parametros: Record<string, unknown>;
  orden: number;
  descripcion: string;
}

export class AutomationAction {
  readonly tipo: TipoAccionAutomation;
  readonly parametros: Record<string, unknown>;
  readonly orden: number;
  readonly descripcion: string;

  constructor(data: AutomationActionData) {
    this.tipo = data.tipo;
    this.parametros = data.parametros;
    this.orden = data.orden;
    this.descripcion = data.descripcion;
  }

  toJSON(): AutomationActionData {
    return { tipo: this.tipo, parametros: this.parametros, orden: this.orden, descripcion: this.descripcion };
  }
}

