import { Notification, type NotificationData, type EstadoNotificacion } from "./Notification";
import { NotificationRule } from "./NotificationRule";
import { NotificationChannel } from "./NotificationChannel";
import { NotificationTemplate } from "./NotificationTemplate";
import { NotificationFactory } from "./NotificationFactory";
import type { NivelPrioridad } from "./NotificationPriority";

export interface EnviarNotificacionParams {
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: NivelPrioridad;
  destinatarioId?: string;
  destinatarioEmail?: string;
  destinatarioRol?: string;
  origen: string;
  casoId?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationEngine {
  private notificaciones: Notification[] = [];
  private reglas: NotificationRule[] = [];
  private canales: NotificationChannel[] = [];
  private plantillas: NotificationTemplate[] = [];
  private cooldowns: Map<string, number> = new Map();

  inicializar(): void {
    this.reglas = NotificationFactory.crearReglasPorDefecto();
    this.canales = NotificationFactory.crearCanalesPorDefecto();
    this.plantillas = NotificationFactory.crearPlantillasPorDefecto();
  }

  notificar(params: EnviarNotificacionParams): Notification {
    const notif = new Notification({
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      titulo: params.titulo,
      descripcion: params.descripcion,
      tipo: params.tipo,
      prioridad: params.prioridad,
      destinatarioId: params.destinatarioId,
      destinatarioEmail: params.destinatarioEmail,
      destinatarioRol: params.destinatarioRol,
      origen: params.origen,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      metadata: params.metadata,
      casoId: params.casoId,
    });

    this.notificaciones.push(notif);
    return notif;
  }

  evaluarReglas(contexto: { tipo: string; metadata?: Record<string, unknown> }): Notification[] {
    const generadas: Notification[] = [];
    for (const regla of this.reglas) {
      if (!regla.activa) continue;
      if (this.enCooldown(regla.tipo)) continue;
      if (!this.coincideRegla(regla, contexto)) continue;

      const prioridad = regla.prioridad;
      const destino = regla.canales[0] ?? "inapp";

      const notif = this.notificar({
        titulo: regla.nombre,
        descripcion: regla.descripcion,
        tipo: contexto.tipo,
        prioridad,
        origen: "NotificationEngine",
        metadata: contexto.metadata,
      });
      generadas.push(notif);
      this.registrarCooldown(regla.tipo, regla.cooldownSegundos);
    }
    return generadas;
  }

  obtenerNotificaciones(filtros?: { estado?: EstadoNotificacion; destinatarioId?: string; prioridad?: NivelPrioridad; limite?: number }): Notification[] {
    let resultados = [...this.notificaciones];
    if (filtros?.estado) resultados = resultados.filter((n) => n.estado === filtros.estado);
    if (filtros?.destinatarioId) resultados = resultados.filter((n) => n.destinatarioId === filtros.destinatarioId);
    if (filtros?.prioridad) resultados = resultados.filter((n) => n.prioridad === filtros.prioridad);
    resultados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    if (filtros?.limite) resultados = resultados.slice(0, filtros.limite);
    return resultados;
  }

  obtenerNoLeidas(): Notification[] {
    return this.notificaciones.filter((n) => n.estado === "pendiente" || n.estado === "enviada");
  }

  marcarLeida(id: string): void {
    const notif = this.notificaciones.find((n) => n.id === id);
    if (notif) notif.marcarLeida();
  }

  obtenerReglas(): NotificationRule[] {
    return this.reglas;
  }

  obtenerCanales(): NotificationChannel[] {
    return this.canales;
  }

  obtenerPlantillas(): NotificationTemplate[] {
    return this.plantillas;
  }

  private coincideRegla(regla: NotificationRule, contexto: { tipo: string }): boolean {
    const mapa: Record<string, string[]> = {
      sla_por_vencer: ["SLA_POR_VENCER"],
      sla_vencido: ["SLA_VENCIDO"],
      cliente_respondio: ["CLIENTE_RESPONDIO"],
      caso_reasignado: ["CASO_REASIGNADO", "CASO_TRANSFERIDO"],
      caso_resuelto: ["CASO_RESUELTO"],
      error_integracion: ["ERROR_DE_INTEGRACION"],
    };
    const tiposMapeados = mapa[contexto.tipo] ?? [];
    return tiposMapeados.includes(regla.tipo) || contexto.tipo === regla.tipo.toLowerCase();
  }

  private enCooldown(tipo: string): boolean {
    const hasta = this.cooldowns.get(tipo);
    if (!hasta) return false;
    return Date.now() < hasta;
  }

  private registrarCooldown(tipo: string, segundos: number): void {
    if (segundos > 0) {
      this.cooldowns.set(tipo, Date.now() + segundos * 1000);
    }
  }
}
