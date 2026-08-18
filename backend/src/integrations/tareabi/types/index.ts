/**
 * Tipos de la integración Tareabi (tareas/desarrollo).
 * Mapean la respuesta REAL de la API pública:
 *   GET/POST /public/rest/tareabi/*  sobre microservices.restaurant.pe/backendrestaurantpe
 * No se transforman ni recalculan valores arbitrarios.
 */

export interface TareabiEnvelope<T = unknown> {
  tipo: string;             // "1" success, "2" warning, "3" error
  mensajes: string[];
  data: T;
  logs?: unknown[];
  inicio?: string;
  fin?: string;
  node?: string;
  diff?: number;
}

/** Detalle de una tarea (GET /tareabi/{id}). */
export interface TareabiDetalle {
  tareabi_id: string;
  tarea_sprint: string;
  tarea_proyecto: string;
  tarea_cliente: string;
  tarea_prioridad: string;
  tarea_origen: string;
  tarea_tipo: string;
  tarea_fechasolicitud: string;
  tarea_fechaentrega: string;
  tarea_descripcion: string;
  tarea_referencia: string;
  tarea_dev: string;
  tarea_peso: string;
  tarea_estado: string;
  tarea_comentario?: string;
  tarea_porrevisar: string;
  tarea_localbi_id: string;
  ticketbi_id: string;
  localbi_id: string;
  tarea_fechainicio: string;
  tarea_fechafin: string | null;
  tarea_tiemporendimiento: string;
  tarea_categoria: string;
  tarea_etapa: string;
  tarea_etapaerror: string;
  tarea_estadoproduccion: string;
  tarea_validocliente: string;
  tarea_fase: string;
  tarea_personaregistronombre?: string;
  tarea_usuariologueado?: string;
}

/** Entrada de log (tarea o ticket). */
export interface TareabiLogEntry {
  logtabla_id: string;
  personabi_id: string;
  logtabla_tipo: string;
  logtabla_proceso: string;
  logtabla_fecharegistro: string;
  logtabla_edited?: string;              // JSON {campo:{oldvalue,newvalue}}
  logtabla_valororiginal?: string;       // JSON completo previo
  logtabla_valoractual?: string;         // JSON completo posterior
  logtabla_tablaalterada?: string;
  logtabla_idregistroalterado?: string;
  personabi?: {
    personabi_id: string;
    personabi_nombres?: string;
    personabi_apellidos?: string;
    personabi_cargo?: string;
  };
}

export interface TareabiLogs {
  logsTarea: TareabiLogEntry[];
  logsTicket: TareabiLogEntry[];
}

export interface TareabiDatosEstaticos {
  estadoList?: Array<{ id: string; value: string }>;
  estadosFinalesList?: Array<{ id: string; value: string }>;
  proyectoList?: Array<{ id: string; value: string }>;
  tipoList?: Array<{ id: string; value: string }>;
  devList?: Array<{ id: string; value: string }>;
  [k: string]: unknown;
}

/** DTO normalizado para el frontend (estado + comentario + historial). */
export interface TareabiTicketLogDTO {
  ticketbi_id: string;
  ticket_estado_actual: string | null;
  tareas: Array<{
    tareabi_id: string;
    tarea_estado: string | null;
    tarea_comentario: string | null;
    responsable: string | null;
    historial: Array<{
      fecha: string | null;
      persona: string | null;
      accion: string | null;
      cambios: Array<{ campo: string; anterior: string; nuevo: string }>;
    }>;
  }>;
}
