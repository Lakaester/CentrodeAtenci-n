export interface TareabiCambio {
  campo: string;
  anterior: string;
  nuevo: string;
}

export interface TareabiHistorialEntrada {
  fecha: string | null;
  persona: string | null;
  accion: string | null;
  cambios: TareabiCambio[];
}

export interface TareabiTareaLog {
  tareabi_id: string;
  tarea_estado: string | null;
  tarea_comentario: string | null;
  responsable: string | null;
  referencia: string | null;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  historial: TareabiHistorialEntrada[];
}

export interface TareabiTicketLog {
  ticketbi_id: string;
  ticket_estado_actual: string | null;
  tareas: TareabiTareaLog[];
}

export interface TareabiDetalleTarea {
  tareabi_id: string;
  tarea_estado: string;
  tarea_comentario?: string | null;
  tarea_dev: string;
  tarea_fechainicio: string | null;
  tarea_fechafin: string | null;
  ticketbi_id: string | null;
  tarea_referencia?: string | null;
  tarea_descripcion?: string | null;
  tarea_proyecto?: string | null;
  tarea_categoria?: string | null;
  tarea_tipo?: string | null;
  tarea_etapa?: string | null;
  tarea_prioridad?: string | null;
  tarea_sprint?: string | null;
  tarea_fechasolicitud?: string | null;
  tarea_fechaentrega?: string | null;
  localbi_id?: string | null;
  tarea_personaregistronombre?: string | null;
  [k: string]: unknown;
}
