export type NivelPrioridad = "baja" | "media" | "alta" | "critica";

export interface NotificationPriorityData {
  nivel: NivelPrioridad;
  orden: number;
  color: string;
  icono: string;
  timeoutSegundos: number;
}

export class NotificationPriority {
  static readonly BAJA: NotificationPriorityData = { nivel: "baja", orden: 1, color: "text-sky-600", icono: "Info", timeoutSegundos: 3600 };
  static readonly MEDIA: NotificationPriorityData = { nivel: "media", orden: 2, color: "text-amber-600", icono: "AlertCircle", timeoutSegundos: 1800 };
  static readonly ALTA: NotificationPriorityData = { nivel: "alta", orden: 3, color: "text-rose-500", icono: "AlertTriangle", timeoutSegundos: 600 };
  static readonly CRITICA: NotificationPriorityData = { nivel: "critica", orden: 4, color: "text-red-600", icono: "Bell", timeoutSegundos: 120 };

  static obtener(nivel: NivelPrioridad): NotificationPriorityData {
    const mapa: Record<NivelPrioridad, NotificationPriorityData> = {
      baja: NotificationPriority.BAJA,
      media: NotificationPriority.MEDIA,
      alta: NotificationPriority.ALTA,
      critica: NotificationPriority.CRITICA,
    };
    return mapa[nivel];
  }
}
