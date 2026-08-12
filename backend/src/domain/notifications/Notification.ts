import type { NivelPrioridad } from "./NotificationPriority";

export type EstadoNotificacion = "pendiente" | "enviada" | "entregada" | "leida" | "fallida" | "cancelada";

export interface NotificationData {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: NivelPrioridad;
  destinatarioId?: string;
  destinatarioEmail?: string;
  destinatarioRol?: string;
  origen: string;
  fecha: string;
  estado: EstadoNotificacion;
  metadata?: Record<string, unknown>;
  casoId?: string;
  leidaEn?: string;
}

export class Notification {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly tipo: string;
  readonly prioridad: NivelPrioridad;
  readonly destinatarioId?: string;
  readonly destinatarioEmail?: string;
  readonly destinatarioRol?: string;
  readonly origen: string;
  readonly fecha: string;
  readonly estado: EstadoNotificacion;
  readonly metadata?: Record<string, unknown>;
  readonly casoId?: string;
  leidaEn?: string;

  constructor(data: NotificationData) {
    this.id = data.id;
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.tipo = data.tipo;
    this.prioridad = data.prioridad;
    this.destinatarioId = data.destinatarioId;
    this.destinatarioEmail = data.destinatarioEmail;
    this.destinatarioRol = data.destinatarioRol;
    this.origen = data.origen;
    this.fecha = data.fecha;
    this.estado = data.estado;
    this.metadata = data.metadata;
    this.casoId = data.casoId;
    this.leidaEn = data.leidaEn;
  }

  marcarLeida(): void {
    this.leidaEn = new Date().toISOString();
  }

  toJSON(): NotificationData {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      tipo: this.tipo,
      prioridad: this.prioridad,
      destinatarioId: this.destinatarioId,
      destinatarioEmail: this.destinatarioEmail,
      destinatarioRol: this.destinatarioRol,
      origen: this.origen,
      fecha: this.fecha,
      estado: this.estado,
      metadata: this.metadata,
      casoId: this.casoId,
      leidaEn: this.leidaEn,
    };
  }
}
