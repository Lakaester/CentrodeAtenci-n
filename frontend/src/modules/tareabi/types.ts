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
  tarea_comentario?: string;
  tarea_dev: string;
  tarea_fechainicio: string;
  tarea_fechafin: string | null;
  ticketbi_id: string;
  [k: string]: unknown;
}
