import { useMemo } from "react";
import { mapAgents, type AgentUI } from "../mappers/agentMapper";
import { MOCK_AGENT_DTOS } from "../mocks/agents.mock";
import type { AgentDTO } from "../dto/agent.dto";

export function useAgents(dtos?: AgentDTO[]): AgentUI[] {
  const data = dtos ?? MOCK_AGENT_DTOS;
  return useMemo(() => mapAgents(data), [data]);
}
