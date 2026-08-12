import { useMemo } from "react";
import { mapAgentsOverview, type AgentOverviewUI } from "../mappers/agentOverviewMapper";
import { MOCK_AGENT_OVERVIEW_DTOS } from "../mocks/agentOverview.mock";
import type { AgentOverviewDTO } from "../dto/agent-overview.dto";

export function useAgentOverview(dtos?: AgentOverviewDTO[]): AgentOverviewUI[] {
  const data = dtos ?? MOCK_AGENT_OVERVIEW_DTOS;
  return useMemo(() => mapAgentsOverview(data), [data]);
}
