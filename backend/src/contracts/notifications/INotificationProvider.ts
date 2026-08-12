import type { Notification } from "../../domain/notifications/Notification";
import type { NivelPrioridad } from "../../domain/notifications/NotificationPriority";

export interface INotificationProvider {
  enviar(notificacion: Notification): Promise<boolean>;
  enviarMultiples(notificaciones: Notification[]): Promise<number>;
  obtenerEstado(id: string): Promise<string>;
  obtenerNoLeidas(usuarioId: string): Promise<Notification[]>;
  marcarLeida(id: string): Promise<void>;
}

export interface EnviarNotificacion {
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: NivelPrioridad;
  destinatarioId?: string;
  origen: string;
  casoId?: string;
}
