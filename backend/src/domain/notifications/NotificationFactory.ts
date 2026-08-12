import { Notification, type NotificationData } from "./Notification";
import { NotificationRule, type NotificationRuleData, type TipoReglaNotificacion } from "./NotificationRule";
import { NotificationChannel, type NotificationChannelData } from "./NotificationChannel";
import { NotificationTemplate, type NotificationTemplateData } from "./NotificationTemplate";
import type { NivelPrioridad } from "./NotificationPriority";

export class NotificationFactory {
  static crearNotificacion(data: NotificationData): Notification {
    return new Notification(data);
  }

  static crearRegla(data: NotificationRuleData): NotificationRule {
    return new NotificationRule(data);
  }

  static crearCanal(data: NotificationChannelData): NotificationChannel {
    return new NotificationChannel(data);
  }

  static crearPlantilla(data: NotificationTemplateData): NotificationTemplate {
    return new NotificationTemplate(data);
  }

  static crearReglasPorDefecto(): NotificationRule[] {
    const reglas: { tipo: TipoReglaNotificacion; nombre: string; descripcion: string; prioridad: NivelPrioridad; canales: string[]; cooldownSegundos: number }[] = [
      { tipo: "SLA_POR_VENCER", nombre: "SLA por vencer", descripcion: "El SLA del caso está próximo a vencer", prioridad: "alta", canales: ["inapp", "email"], cooldownSegundos: 600 },
      { tipo: "SLA_VENCIDO", nombre: "SLA vencido", descripcion: "El SLA del caso ha vencido", prioridad: "critica", canales: ["inapp", "email", "push"], cooldownSegundos: 300 },
      { tipo: "CLIENTE_HIGH_TOUCH_ESPERANDO", nombre: "High Touch esperando", descripcion: "Cliente High Touch esperando atención", prioridad: "alta", canales: ["inapp"], cooldownSegundos: 120 },
      { tipo: "CLIENTE_RESPONDIO", nombre: "Cliente respondió", descripcion: "El cliente ha respondido al mensaje", prioridad: "alta", canales: ["inapp", "push"], cooldownSegundos: 60 },
      { tipo: "CASO_REASIGNADO", nombre: "Caso reasignado", descripcion: "Se le ha asignado un nuevo caso", prioridad: "media", canales: ["inapp"], cooldownSegundos: 0 },
      { tipo: "CASO_RESUELTO", nombre: "Caso resuelto", descripcion: "El caso ha sido marcado como resuelto", prioridad: "media", canales: ["inapp"], cooldownSegundos: 0 },
      { tipo: "ERROR_DE_INTEGRACION", nombre: "Error de integración", descripcion: "Una integración externa reportó un error", prioridad: "alta", canales: ["inapp", "slack"], cooldownSegundos: 300 },
      { tipo: "SUPERVISOR_REQUERIDO", nombre: "Supervisor requerido", descripcion: "Se requiere intervención de un supervisor", prioridad: "critica", canales: ["inapp", "email", "slack"], cooldownSegundos: 120 },
    ];
    return reglas.map((r) => new NotificationRule({ ...r, activa: true }));
  }

  static crearCanalesPorDefecto(): NotificationChannel[] {
    const data: NotificationChannelData[] = [
      { id: "ch_inapp", tipo: "inapp", nombre: "Notificación en App", configuracion: {}, activo: true, prioridad: 1 },
      { id: "ch_email", tipo: "email", nombre: "Correo electrónico", configuracion: { host: "", port: 587 }, activo: false, prioridad: 2 },
      { id: "ch_whatsapp", tipo: "whatsapp", nombre: "WhatsApp", configuracion: { apiKey: "" }, activo: false, prioridad: 3 },
      { id: "ch_push", tipo: "push", nombre: "Push notification", configuracion: {}, activo: false, prioridad: 4 },
      { id: "ch_slack", tipo: "slack", nombre: "Slack", configuracion: { webhookUrl: "" }, activo: false, prioridad: 5 },
    ];
    return data.map((c) => new NotificationChannel(c));
  }

  static crearPlantillasPorDefecto(): NotificationTemplate[] {
    const data: NotificationTemplateData[] = [
      { id: "tmpl_asesor_sla", tipo: "asesor", asunto: "⚠ SLA por vencer: {{cliente}}", cuerpo: "El caso de {{cliente}} tiene el SLA al {{porcentaje}}%. Atender con prioridad.", variable: ["cliente", "porcentaje"], canales: ["inapp", "email"] },
      { id: "tmpl_supervisor_escalado", tipo: "supervisor", asunto: "🚨 Escalado requerido: {{casoId}}", cuerpo: "El asesor {{asesor}} ha solicitado escalado para el caso {{casoId}} del cliente {{cliente}}.", variable: ["casoId", "asesor", "cliente"], canales: ["inapp", "slack"] },
      { id: "tmpl_admin_error", tipo: "administrador", asunto: "🔴 Error de integración: {{integracion}}", cuerpo: "La integración {{integracion}} ha fallado. Último error: {{error}}.", variable: ["integracion", "error"], canales: ["inapp", "email", "slack"] },
    ];
    return data.map((t) => new NotificationTemplate(t));
  }
}
