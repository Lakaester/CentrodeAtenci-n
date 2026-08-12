import { getPriorityConfig, getStatusConfig } from "../registry/conversationStatusConfig";
import type { ConversationDTO } from "../dto/conversation.dto";

export interface ConversationUI {
  id: string;
  cliente: string;
  canal: string;
  asesor: string | null;
  estado: string;
  estadoColor: string;
  estadoLabel: string;
  tiempoColaMin: number;
  tiempoColaLabel: string;
  tiempoAtencionMin: number;
  tiempoAtencionLabel: string;
  prioridad: string;
  prioridadOrder: number;
  ultimoMensaje: string;
}

function fmtMin(min: number): string {
  if (min < 1) return "< 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}

export function mapConversation(dto: ConversationDTO): ConversationUI {
  const pc = getPriorityConfig(dto.prioridad);
  const sc = getStatusConfig(dto.estado);

  return {
    id: dto.id,
    cliente: dto.cliente,
    canal: dto.canal,
    asesor: dto.asesor,
    estado: dto.estado,
    estadoColor: sc.color,
    estadoLabel: sc.label,
    tiempoColaMin: dto.tiempoColaMin,
    tiempoColaLabel: fmtMin(dto.tiempoColaMin),
    tiempoAtencionMin: dto.tiempoAtencionMin,
    tiempoAtencionLabel: fmtMin(dto.tiempoAtencionMin),
    prioridad: pc.label,
    prioridadOrder: pc.order,
    ultimoMensaje: dto.ultimoMensaje,
  };
}

export function mapConversations(dtos: ConversationDTO[]): ConversationUI[] {
  return dtos
    .map(mapConversation)
    .sort((a, b) => a.prioridadOrder - b.prioridadOrder || b.tiempoColaMin - a.tiempoColaMin);
}
