import type { TipoEventoTimeline, CategoriaEvento } from "./TimelineTypes";

export interface TimelineEventData {
  id: string;
  /** @deprecated Usar atencionId */
  casoId: string;
  atencionId: string;
  tipo: TipoEventoTimeline;
  categoria: CategoriaEvento;
  titulo: string;
  descripcion: string;
  usuario: string;
  usuarioId?: string;
  fecha: string;
  metadata?: Record<string, unknown>;
}

export class TimelineEvent {
  readonly id: string;
  readonly casoId: string;
  readonly atencionId: string;
  readonly tipo: TipoEventoTimeline;
  readonly categoria: CategoriaEvento;
  readonly titulo: string;
  readonly descripcion: string;
  readonly usuario: string;
  readonly usuarioId?: string;
  readonly fecha: string;
  readonly metadata?: Record<string, unknown>;

  constructor(data: TimelineEventData) {
    this.id = data.id;
    this.casoId = data.casoId;
    this.atencionId = data.atencionId;
    this.tipo = data.tipo;
    this.categoria = data.categoria;
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.usuario = data.usuario;
    this.usuarioId = data.usuarioId;
    this.fecha = data.fecha;
    this.metadata = data.metadata;
  }

  toJSON(): TimelineEventData {
    return {
      id: this.id,
      casoId: this.casoId,
      atencionId: this.atencionId,
      tipo: this.tipo,
      categoria: this.categoria,
      titulo: this.titulo,
      descripcion: this.descripcion,
      usuario: this.usuario,
      usuarioId: this.usuarioId,
      fecha: this.fecha,
      metadata: this.metadata,
    };
  }
}

export const TITULOS_POR_TIPO: Record<string, { titulo: string; descripcion: (detalle?: string) => string }> = {
  /* CLIENTE */
  cliente_escribio: { titulo: "Cliente escribió", descripcion: (d) => d ?? "El cliente envió un mensaje" },
  cliente_respondio: { titulo: "Cliente respondió", descripcion: (d) => d ?? "El cliente respondió a la solicitud" },
  cliente_envio_archivo: { titulo: "Cliente envió archivo", descripcion: (d) => d ?? "El cliente adjuntó un archivo" },
  cliente_leyo_respuesta: { titulo: "Cliente leyó respuesta", descripcion: (d) => d ?? "El cliente leyó el mensaje del asesor" },
  /* ASESOR */
  caso_aceptado: { titulo: "Caso aceptado", descripcion: (d) => d ?? "El asesor aceptó el caso" },
  mensaje_enviado: { titulo: "Mensaje enviado", descripcion: (d) => d ?? "El asesor envió un mensaje" },
  categoria_asignada: { titulo: "Categoría asignada", descripcion: (d) => d ?? `Categoría: ${d}` },
  subcategoria_asignada: { titulo: "Subcategoría asignada", descripcion: (d) => d ?? `Subcategoría: ${d}` },
  caso_resuelto: { titulo: "Caso resuelto", descripcion: (d) => d ?? "El asesor marcó el caso como resuelto" },
  caso_cerrado: { titulo: "Caso cerrado", descripcion: (d) => d ?? "El asesor cerró el caso" },
  caso_transferido: { titulo: "Caso transferido", descripcion: (d) => d ?? `Transferido a: ${d}` },
  caso_reasignado: { titulo: "Caso reasignado", descripcion: (d) => d ?? `Reasignado a: ${d}` },
  nota_interna: { titulo: "Nota interna", descripcion: (d) => d ?? "El asesor agregó una nota interna" },
  /* SISTEMA */
  caso_creado: { titulo: "Caso creado", descripcion: (d) => d ?? "El caso fue creado automáticamente" },
  sla_iniciado: { titulo: "SLA iniciado", descripcion: (d) => d ?? `SLA iniciado: ${d}` },
  sla_vencido: { titulo: "SLA vencido", descripcion: (d) => d ?? "El SLA del caso ha vencido" },
  playbook_iniciado: { titulo: "Playbook iniciado", descripcion: (d) => d ?? `Playbook: ${d}` },
  diagnostico_iniciado: { titulo: "Diagnóstico iniciado", descripcion: (d) => d ?? "Iniciando diagnóstico automático" },
  diagnostico_completado: { titulo: "Diagnóstico completado", descripcion: (d) => d ?? d ?? "Diagnóstico finalizado" },
  workspace_actualizado: { titulo: "Workspace actualizado", descripcion: (d) => d ?? "Workspace adaptativo actualizado" },
  macro_utilizada: { titulo: "Macro utilizada", descripcion: (d) => d ?? `Macro ejecutada: ${d}` },
  /* HERRAMIENTA */
  dominio_abierto: { titulo: "Dominio abierto", descripcion: (d) => d ?? "Dominio del cliente consultado" },
  microservice_abierto: { titulo: "Microservice abierto", descripcion: (d) => d ?? "Microservice interno consultado" },
  restafact_abierto: { titulo: "Restafact abierto", descripcion: (d) => d ?? "Restafact consultado" },
  monitor_integraciones_abierto: { titulo: "Monitor abierto", descripcion: (d) => d ?? "Monitor de integraciones consultado" },
  dashboard_fe_abierto: { titulo: "Dashboard FE abierto", descripcion: (d) => d ?? "Dashboard de facturación consultado" },
  dashboard_chile_abierto: { titulo: "Dashboard Chile abierto", descripcion: (d) => d ?? "Dashboard Chile consultado" },
  notebooklm_abierto: { titulo: "NotebookLM abierto", descripcion: (d) => d ?? "NotebookLM utilizado" },
  postman_abierto: { titulo: "Postman abierto", descripcion: (d) => d ?? "Postman abierto" },
  /* DESARROLLO */
  ticket_dev_creado: { titulo: "Ticket DEV creado", descripcion: (d) => d ?? `DEV creado: ${d}` },
  ticket_dev_actualizado: { titulo: "Ticket DEV actualizado", descripcion: (d) => d ?? `DEV actualizado: ${d}` },
  ticket_dev_cerrado: { titulo: "Ticket DEV cerrado", descripcion: (d) => d ?? `DEV cerrado: ${d}` },
};
