import { VALID_TRANSITIONS, type CaseStatus, type Case } from "../types";

export class WorkflowEngine {
  canTransition(from: CaseStatus, to: CaseStatus): boolean {
    const allowed = VALID_TRANSITIONS[from];
    return allowed?.includes(to) ?? false;
  }

  transition(caseItem: Case, to: CaseStatus): Case | null {
    if (!this.canTransition(caseItem.status, to)) return null;
    caseItem.status = to;
    caseItem.updatedAt = new Date().toISOString();
    if (to === "resuelto") caseItem.resolvedAt = new Date().toISOString();
    if (to === "cerrado") caseItem.closedAt = new Date().toISOString();
    return caseItem;
  }

  getAvailableTransitions(status: CaseStatus): CaseStatus[] {
    return VALID_TRANSITIONS[status] ?? [];
  }
}
