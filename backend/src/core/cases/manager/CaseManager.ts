import { CaseRegistry } from "../registry/CaseRegistry";
import { WorkflowEngine } from "../workflow/WorkflowEngine";
import { HistoryService } from "../history/HistoryService";
import { SLAService } from "../sla/SLAService";
import type { Case, CaseStatus } from "../types";

export class CaseManager {
  registry = new CaseRegistry();
  workflow = new WorkflowEngine();
  history = new HistoryService();
  sla = new SLAService();

  create(data: Omit<Case, "id" | "createdAt" | "updatedAt" | "resolvedAt" | "closedAt">): Case {
    const c: Case = {
      ...data,
      id: `case_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      closedAt: null,
    };
    this.registry.register(c);
    this.history.add(c.id, "created", data.assignedTo ?? "system", "Caso creado", null, "nuevo");
    return c;
  }

  transition(caseId: string, toStatus: CaseStatus, userId: string, comment: string): Case | null {
    const c = this.registry.get(caseId);
    if (!c) return null;
    const from = c.status;
    const result = this.workflow.transition(c, toStatus);
    if (!result) return null;
    this.history.add(caseId, "transition", userId, comment, from, toStatus);
    return result;
  }

  get(id: string): Case | undefined {
    return this.registry.get(id);
  }

  list(): Case[] {
    return this.registry.list();
  }

  search(query: string): Case[] {
    return this.registry.search(query);
  }

  getSLA(caseId: string): ReturnType<SLAService["calculate"]> | null {
    const c = this.registry.get(caseId);
    if (!c) return null;
    return this.sla.calculate(caseId, c.priority, c.createdAt);
  }

  getHistory(caseId: string) {
    return this.history.getByCase(caseId);
  }

  getStats() {
    const all = this.registry.list();
    const statusCount: Record<string, number> = {};
    for (const c of all) {
      statusCount[c.status] = (statusCount[c.status] ?? 0) + 1;
    }
    return { total: all.length, byStatus: statusCount };
  }
}
