export type ConversationPriority = "alta" | "media" | "baja";
export type ConversationStatus =
  | "esperando-respuesta"
  | "en-curso"
  | "pendiente-asignacion"
  | "pausada"
  | "finalizada";

export interface ConversationDTO {
  id: string;
  cliente: string;
  canal: string;
  asesor: string | null;
  estado: ConversationStatus;
  tiempoColaMin: number;
  tiempoAtencionMin: number;
  prioridad: ConversationPriority;
  ultimoMensaje: string;
}
