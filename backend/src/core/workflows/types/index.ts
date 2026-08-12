export type StepType = "manual" | "automatic" | "conditional" | "parallel" | "approval" | "wait" | "notification" | "validation";
export type WorkflowStatus = "draft" | "active" | "paused" | "completed" | "failed" | "archived";
export type InstanceStatus = "running" | "paused" | "completed" | "failed" | "abandoned";

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  status: WorkflowStatus;
  steps: WorkflowStepDef[];
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepDef {
  id: string;
  name: string;
  type: StepType;
  order: number;
  config: Record<string, unknown>;
  conditions?: string[];
  nextOnSuccess?: string;
  nextOnFailure?: string;
  timeout?: number;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: InstanceStatus;
  currentStepId: string | null;
  context: Record<string, unknown>;
  caseId?: string;
  dominio?: string;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  instanceId: string;
  stepId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt: string;
  completedAt?: string;
  error?: string;
  result?: unknown;
}

export interface WorkflowMetrics {
  definitionId: string;
  totalExecutions: number;
  completed: number;
  failed: number;
  abandoned: number;
  avgDurationMs: number;
  lastExecution: string | null;
}
