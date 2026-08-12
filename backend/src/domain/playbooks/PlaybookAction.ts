export type TipoAccionPlaybook =
  | "ABRIR_PLUGIN"
  | "MOSTRAR_WIDGET"
  | "SUGERIR_MACRO"
  | "ABRIR_NOTEBOOK"
  | "ABRIR_DOMINIO"
  | "ABRIR_DASHBOARD"
  | "ABRIR_TICKET_DEV"
  | "ENVIAR_MENSAJE"
  | "CONSULTAR_API"
  | "EJECUTAR_SCRIPT"
  | "NOTIFICAR"
  | "VALIDAR"
  | "REGISTRAR_TIMELINE";

export interface PlaybookActionData {
  tipo: TipoAccionPlaybook;
  parametros: Record<string, unknown>;
  pluginId?: string;
  tooltip?: string;
}

export class PlaybookAction {
  readonly tipo: TipoAccionPlaybook;
  readonly parametros: Record<string, unknown>;
  readonly pluginId?: string;
  readonly tooltip?: string;

  constructor(data: PlaybookActionData) {
    this.tipo = data.tipo;
    this.parametros = data.parametros;
    this.pluginId = data.pluginId;
    this.tooltip = data.tooltip;
  }

  toJSON(): PlaybookActionData {
    return {
      tipo: this.tipo,
      parametros: this.parametros,
      pluginId: this.pluginId,
      tooltip: this.tooltip,
    };
  }
}
