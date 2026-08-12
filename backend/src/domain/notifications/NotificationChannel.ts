export type TipoCanalNotificacion = "inapp" | "email" | "whatsapp" | "push" | "webhook" | "slack" | "teams";
export type EstadoCanalNotificacion = "disponible" | "no_disponible" | "error";

export interface NotificationChannelData {
  id: string;
  tipo: TipoCanalNotificacion;
  nombre: string;
  configuracion: Record<string, unknown>;
  activo: boolean;
  prioridad: number;
}

export class NotificationChannel {
  readonly id: string;
  readonly tipo: TipoCanalNotificacion;
  readonly nombre: string;
  readonly configuracion: Record<string, unknown>;
  readonly activo: boolean;
  readonly prioridad: number;

  constructor(data: NotificationChannelData) {
    this.id = data.id;
    this.tipo = data.tipo;
    this.nombre = data.nombre;
    this.configuracion = data.configuracion;
    this.activo = data.activo;
    this.prioridad = data.prioridad;
  }

  toJSON(): NotificationChannelData {
    return {
      id: this.id,
      tipo: this.tipo,
      nombre: this.nombre,
      configuracion: this.configuracion,
      activo: this.activo,
      prioridad: this.prioridad,
    };
  }
}
