import type { WorkflowStepDef, WorkflowExecution } from "../types";

export class StepExecutor {
  async execute(step: WorkflowStepDef, context: Record<string, unknown>): Promise<WorkflowExecution> {
    const exec: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      instanceId: context.instanceId as string ?? "",
      stepId: step.id,
      status: "running",
      startedAt: new Date().toISOString(),
    };

    try {
      switch (step.type) {
        case "manual":
          exec.status = "pending";
          break;
        case "automatic":
          exec.status = "completed";
          break;
        case "notification":
          exec.status = "completed";
          break;
        case "wait":
          exec.status = "pending";
          break;
        case "approval":
          exec.status = "pending";
          break;
        case "validation":
          exec.status = "completed";
          break;
        default:
          exec.status = "completed";
      }
      exec.completedAt = new Date().toISOString();
    } catch (err: unknown) {
      exec.status = "failed";
      exec.error = err instanceof Error ? err.message : String(err);
    }

    return exec;
  }
}
