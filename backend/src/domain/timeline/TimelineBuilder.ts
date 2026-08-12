import { TimelineEvent, type TimelineEventData } from "./TimelineEvent";
import { TITULOS_POR_TIPO } from "./TimelineEvent";
import { CATEGORIA_POR_TIPO, type TipoEventoTimeline } from "./TimelineTypes";

export interface ConstruirEventoParams {
  atencionId: string;
  tipo: TipoEventoTimeline;
  usuario: string;
  usuarioId?: string;
  detalle?: string;
  metadata?: Record<string, unknown>;
}

export class TimelineBuilder {
  private eventos: TimelineEventData[] = [];

  static crearEvento(params: ConstruirEventoParams): TimelineEvent {
    const config = TITULOS_POR_TIPO[params.tipo];
    const categoria = CATEGORIA_POR_TIPO[params.tipo] ?? "SISTEMA";

    const data: TimelineEventData = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      casoId: params.atencionId,
      atencionId: params.atencionId,
      tipo: params.tipo,
      categoria,
      titulo: config?.titulo ?? params.tipo,
      descripcion: config?.descripcion(params.detalle) ?? params.detalle ?? "",
      usuario: params.usuario,
      usuarioId: params.usuarioId,
      fecha: new Date().toISOString(),
      metadata: params.metadata,
    };

    return new TimelineEvent(data);
  }

  agregar(evento: TimelineEvent): TimelineBuilder {
    this.eventos.push(evento.toJSON());
    return this;
  }

  construir(): TimelineEvent[] {
    return this.eventos.map((d) => new TimelineEvent(d));
  }

  limpiar(): void {
    this.eventos = [];
  }

  /* ── Métodos de ayuda para eventos comunes ── */

  casoCreado(atencionId: string, usuario: string, detalle?: string): TimelineEvent {
    return TimelineBuilder.crearEvento({ atencionId, tipo: "caso_creado", usuario, detalle });
  }

  casoAceptado(atencionId: string, usuario: string, usuarioId?: string): TimelineEvent {
    return TimelineBuilder.crearEvento({ atencionId, tipo: "caso_aceptado", usuario, usuarioId });
  }

  clienteRespondio(atencionId: string, usuario: string, detalle?: string): TimelineEvent {
    return TimelineBuilder.crearEvento({ atencionId, tipo: "cliente_respondio", usuario, detalle });
  }

  casoResuelto(atencionId: string, usuario: string, detalle?: string): TimelineEvent {
    return TimelineBuilder.crearEvento({ atencionId, tipo: "caso_resuelto", usuario, detalle });
  }

  categoriaAsignada(atencionId: string, usuario: string, categoria: string): TimelineEvent {
    return TimelineBuilder.crearEvento({ atencionId, tipo: "categoria_asignada", usuario, detalle: categoria });
  }

  herramientaAbierta(atencionId: string, usuario: string, herramienta: string): TimelineEvent {
    const mapa: Record<string, TipoEventoTimeline> = {
      dominio: "dominio_abierto",
      microservice: "microservice_abierto",
      restafact: "restafact_abierto",
      monitor: "monitor_integraciones_abierto",
      dashboard_fe: "dashboard_fe_abierto",
      dashboard_chile: "dashboard_chile_abierto",
      notebooklm: "notebooklm_abierto",
      postman: "postman_abierto",
    };
    const tipo = mapa[herramienta] ?? "dominio_abierto";
    return TimelineBuilder.crearEvento({ casoId, tipo, usuario, detalle: herramienta });
  }
}
