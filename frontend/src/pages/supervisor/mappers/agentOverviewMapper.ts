import { getAgentStatusConfig } from "../registry/agentStatusConfig";
import type { AgentOverviewDTO } from "../dto/agent-overview.dto";

export interface AgentOverviewUI {
  id: string;
  nombre: string;
  estado: string;
  estadoLabel: string;
  estadoColor: string;
  canalPrincipal: string;
  conversacionesActivas: number;
  slaPromedioPct: number;
  slaLabel: string;
  ocupacionPct: number;
  ocupacionBarColor: string;
  ultimaActividadLabel: string;
  priority: number;
}

function formatUltimaActividad(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff < 60) return `Hace ${diff} min`;
  const h = Math.floor(diff / 60);
  return `Hace ${h}h ${diff % 60}m`;
}

export function mapAgentOverview(dto: AgentOverviewDTO): AgentOverviewUI {
  const cfg = getAgentStatusConfig(dto.estado);
  const barColor = dto.ocupacionPct > 80 ? "bg-danger-50" : dto.ocupacionPct > 50 ? "bg-warning-50" : "bg-success-50";

  return {
    id: dto.id,
    nombre: dto.nombre,
    estado: dto.estado,
    estadoLabel: cfg.label,
    estadoColor: cfg.color,
    canalPrincipal: dto.canalPrincipal,
    conversacionesActivas: dto.conversacionesActivas,
    slaPromedioPct: dto.slaPromedioPct,
    slaLabel: `${Math.round(dto.slaPromedioPct)}%`,
    ocupacionPct: dto.ocupacionPct,
    ocupacionBarColor: barColor,
    ultimaActividadLabel: formatUltimaActividad(dto.ultimaActividad),
    priority: cfg.priority,
  };
}

export function mapAgentsOverview(dtos: AgentOverviewDTO[]): AgentOverviewUI[] {
  return dtos.map(mapAgentOverview).sort((a, b) => b.ocupacionPct - a.ocupacionPct);
}
