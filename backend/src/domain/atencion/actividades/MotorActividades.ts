import { Actividad, type ActividadData, type TipoActividad, type SubtipoActividad, type OrigenActividad, type ResultadoActividad } from "../Actividad";

export interface RegistrarActividadParams {
  tipo: TipoActividad;
  subtipo: SubtipoActividad;
  autor: string;
  autorId?: string;
  descripcion: string;
  origen: OrigenActividad;
  resultado?: ResultadoActividad;
  observaciones?: string;
  metadata?: Record<string, unknown>;
}

export type TimelineEntry = ActividadData;

export class MotorActividades {
  static registrar(params: RegistrarActividadParams): Actividad {
    return new Actividad({
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tipo: params.tipo,
      subtipo: params.subtipo,
      fecha: new Date().toISOString(),
      autor: params.autor,
      autorId: params.autorId,
      descripcion: params.descripcion,
      origen: params.origen,
      resultado: params.resultado ?? "ok",
      observaciones: params.observaciones,
      metadata: params.metadata,
    });
  }

  static construirTimeline(actividades: Actividad[]): TimelineEntry[] {
    return [...actividades]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((a) => a.toJSON());
  }

  static identificarCliente(autor: string, dominio: string, autorId?: string): Actividad {
    return MotorActividades.registrar({
      tipo: "identificacion",
      subtipo: "cliente_identificado",
      autor,
      autorId,
      descripcion: `Cliente identificado: ${dominio}`,
      origen: "sistema",
      resultado: "ok",
    });
  }

  static diagnosticar(autor: string, descripcion: string, autorId?: string): Actividad {
    return MotorActividades.registrar({
      tipo: "diagnostico",
      subtipo: "diagnostico_iniciado",
      autor,
      autorId,
      descripcion,
      origen: "agente",
      resultado: "ok",
    });
  }

  static consultarHerramienta(autor: string, herramienta: string, autorId?: string): Actividad {
    const sub: Record<string, SubtipoActividad> = {
      restafact: "restafact_consultado",
      dashboard_fe: "dashboard_fe_consultado",
      sunat: "sunat_consultado",
      notebooklm: "notebooklm_consultado",
    };
    return MotorActividades.registrar({
      tipo: "consulta",
      subtipo: sub[herramienta] ?? "herramienta_consultada",
      autor,
      autorId,
      descripcion: `Herramienta consultada: ${herramienta}`,
      origen: "agente",
      resultado: "informacion_no_disponible",
      observaciones: "Integración pendiente de implementar",
    });
  }

  static gestionar(autor: string, descripcion: string, autorId?: string): Actividad {
    return MotorActividades.registrar({
      tipo: "gestion",
      subtipo: "gestion_iniciada",
      autor,
      autorId,
      descripcion,
      origen: "agente",
      resultado: "pendiente",
    });
  }

  static comunicar(autor: string, descripcion: string, origen: OrigenActividad = "agente", autorId?: string): Actividad {
    return MotorActividades.registrar({
      tipo: "comunicacion",
      subtipo: origen === "cliente" ? "mensaje_recibido" : "mensaje_enviado",
      autor,
      autorId,
      descripcion,
      origen,
      resultado: "ok",
    });
  }

  static clasificar(autor: string, categoria: string, subcategoria?: string, autorId?: string): Actividad {
    return MotorActividades.registrar({
      tipo: "clasificacion",
      subtipo: subcategoria ? "subcategoria_asignada" : "categoria_asignada",
      autor,
      autorId,
      descripcion: `Categoría: ${categoria}${subcategoria ? ` · ${subcategoria}` : ""}`,
      origen: "agente",
      resultado: "ok",
    });
  }

  static cerrar(autor: string, resultado: ResultadoActividad, resumen: string, autorId?: string): Actividad {
    return MotorActividades.registrar({
      tipo: "cierre",
      subtipo: "atencion_finalizada",
      autor,
      autorId,
      descripcion: resumen,
      origen: "agente",
      resultado,
      observaciones: "Atención finalizada por el asesor",
    });
  }
}
