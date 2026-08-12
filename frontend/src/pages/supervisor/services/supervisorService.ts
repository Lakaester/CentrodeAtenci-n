import { api } from "@/lib/api";
import { filtersToParams } from "@/lib/filters";
import type { DashboardFilters } from "@/lib/filters";
import type { AgentOverviewDTO } from "../dto/agent-overview.dto";
import type { ConversationDTO } from "../dto/conversation.dto";
import type { PerformanceDTO } from "../dto/performance.dto";
import type { SupervisorActionDTO } from "../dto/supervisor-action.dto";

export interface SupervisorResponse {
  agentes: AgentOverviewDTO[];
  conversaciones: ConversationDTO[];
  performance: PerformanceDTO;
  acciones: SupervisorActionDTO[];
}

function isSupervisorResponse(raw: unknown): raw is SupervisorResponse {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return Array.isArray(r.agentes) && Array.isArray(r.conversaciones) && typeof r.performance === "object" && r.performance !== null && Array.isArray(r.acciones);
}

export async function fetchSupervisor(filters: DashboardFilters): Promise<SupervisorResponse> {
  const params = filtersToParams(filters);
  const { data } = await api.get("/dashboard/supervisor", { params });
  const payload = data?.data;
  if (!isSupervisorResponse(payload)) {
    throw new Error("Respuesta inválida del servidor");
  }
  return payload;
}
