import type { AgentDTO } from "../dto/agent.dto";

export interface AgentUI {
  id: string;
  nombre: string;
  estado: string;
  estadoColor: string;
  estadoLabel: string;
  canal: string;
  carga: number;
  conversacionesActivas: number;
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  disponible: { label: "Disponible", color: "text-success bg-success-5" },
  ocupado: { label: "Ocupado", color: "text-danger bg-danger-5" },
  pausa: { label: "En pausa", color: "text-warning bg-warning-5" },
  offline: { label: "Offline", color: "text-black-25 bg-black-5" },
};

export function mapAgent(dto: AgentDTO): AgentUI {
  const cfg = ESTADO_CONFIG[dto.estado] ?? { label: dto.estado, color: "text-black-45 bg-black-5" };
  return {
    id: dto.id,
    nombre: dto.nombre,
    estado: dto.estado,
    estadoColor: cfg.color,
    estadoLabel: cfg.label,
    canal: dto.canal,
    carga: dto.carga,
    conversacionesActivas: dto.conversacionesActivas,
  };
}

export function mapAgents(dtos: AgentDTO[]): AgentUI[] {
  return dtos.map(mapAgent);
}
