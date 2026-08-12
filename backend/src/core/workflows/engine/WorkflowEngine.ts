import { WorkflowRegistry } from "../registry/WorkflowRegistry";
import { StepExecutor } from "../executors/StepExecutor";
import type { WorkflowDefinition, WorkflowInstance, WorkflowExecution, WorkflowMetrics, InstanceStatus } from "../types";

export class WorkflowEngine {
  registry = new WorkflowRegistry();
  executor = new StepExecutor();
  private instances = new Map<string, WorkflowInstance>();
  private executions: WorkflowExecution[] = [];

  createDefinition(def: WorkflowDefinition): void {
    this.registry.register(def);
  }

  startInstance(definitionId: string, context: Record<string, unknown> = {}): WorkflowInstance | null {
    const def = this.registry.get(definitionId);
    if (!def) return null;
    const instance: WorkflowInstance = {
      id: `wf_${Date.now()}`,
      definitionId,
      status: "running",
      currentStepId: def.steps[0]?.id ?? null,
      context,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.instances.set(instance.id, instance);
    return instance;
  }

  async executeNextStep(instanceId: string): Promise<WorkflowExecution | null> {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.currentStepId) return null;
    const def = this.registry.get(instance.definitionId);
    if (!def) return null;
    const step = def.steps.find((s) => s.id === instance.currentStepId);
    if (!step) return null;

    const exec = await this.executor.execute(step, { ...instance.context, instanceId });
    this.executions.push(exec);

    if (exec.status === "completed" || exec.status === "pending") {
      const nextId = step.nextOnSuccess;
      instance.currentStepId = nextId ?? this.getNextStep(def, step);
      if (!instance.currentStepId) {
        instance.status = "completed";
        instance.completedAt = new Date().toISOString();
      }
    } else {
      instance.currentStepId = step.nextOnFailure ?? instance.currentStepId;
      if (exec.status === "failed") instance.status = "failed";
    }
    instance.updatedAt = new Date().toISOString();
    return exec;
  }

  private getNextStep(def: WorkflowDefinition, current: typeof def.steps[0]) {
    const idx = def.steps.findIndex((s) => s.id === current.id);
    return idx >= 0 && idx < def.steps.length - 1 ? def.steps[idx + 1].id : null;
  }

  getInstance(id: string): WorkflowInstance | undefined {
    return this.instances.get(id);
  }

  listInstances(): WorkflowInstance[] {
    return Array.from(this.instances.values());
  }

  getMetrics(definitionId: string): WorkflowMetrics {
    const related = this.executions.filter((e) => {
      const inst = this.instances.get(e.instanceId);
      return inst?.definitionId === definitionId;
    });
    const completed = related.filter((e) => e.status === "completed");
    const durations = completed
      .filter((e) => e.completedAt && e.startedAt)
      .map((e) => new Date(e.completedAt!).getTime() - new Date(e.startedAt).getTime());
    return {
      definitionId,
      totalExecutions: related.length,
      completed: completed.length,
      failed: related.filter((e) => e.status === "failed").length,
      abandoned: related.filter((e) => e.status === "skipped").length,
      avgDurationMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      lastExecution: completed[completed.length - 1]?.completedAt ?? null,
    };
  }
}
