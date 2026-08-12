export type TipoPlantillaNotificacion = "asesor" | "supervisor" | "administrador";

export interface NotificationTemplateData {
  id: string;
  tipo: TipoPlantillaNotificacion;
  asunto: string;
  cuerpo: string;
  variable: string[];
  canales: string[];
}

export class NotificationTemplate {
  readonly id: string;
  readonly tipo: TipoPlantillaNotificacion;
  readonly asunto: string;
  readonly cuerpo: string;
  readonly variable: string[];
  readonly canales: string[];

  constructor(data: NotificationTemplateData) {
    this.id = data.id;
    this.tipo = data.tipo;
    this.asunto = data.asunto;
    this.cuerpo = data.cuerpo;
    this.variable = data.variable;
    this.canales = data.canales;
  }

  renderizar(variables: Record<string, string>): { asunto: string; cuerpo: string } {
    let asunto = this.asunto;
    let cuerpo = this.cuerpo;
    for (const [key, value] of Object.entries(variables)) {
      asunto = asunto.replace(`{{${key}}}`, value);
      cuerpo = cuerpo.replace(`{{${key}}}`, value);
    }
    return { asunto, cuerpo };
  }

  toJSON(): NotificationTemplateData {
    return {
      id: this.id,
      tipo: this.tipo,
      asunto: this.asunto,
      cuerpo: this.cuerpo,
      variable: this.variable,
      canales: this.canales,
    };
  }
}
