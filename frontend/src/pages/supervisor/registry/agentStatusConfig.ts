import type { AgentStatus } from "../dto/agent-overview.dto";

export interface AgentStatusEntry {
  color: string;
  label: string;
  priority: number;
}

export const AGENT_STATUS_CONFIG: Record<AgentStatus, AgentStatusEntry> = {
  disponible: { color: "text-success bg-success-5 border-emerald-200", label: "Disponible", priority: 0 },
  ocupado: { color: "text-danger bg-danger-5 border-rose-200", label: "Ocupado", priority: 1 },
  pausa: { color: "text-warning bg-warning-5 border-amber-200", label: "En pausa", priority: 2 },
  offline: { color: "text-black-25 bg-black-5 border-black-10", label: "Offline", priority: 3 },
};

export function getAgentStatusConfig(status: AgentStatus): AgentStatusEntry {
  return AGENT_STATUS_CONFIG[status] ?? AGENT_STATUS_CONFIG.offline;
}
