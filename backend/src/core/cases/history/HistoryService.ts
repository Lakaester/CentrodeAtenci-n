import type { CaseHistory, CaseStatus } from "../types";

export class HistoryService {
  private entries: CaseHistory[] = [];

  add(caseId: string, action: string, userId: string, comment: string, fromStatus?: CaseStatus, toStatus?: CaseStatus): CaseHistory {
    const entry: CaseHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      caseId,
      action,
      fromStatus: fromStatus ?? null,
      toStatus: toStatus ?? null,
      userId,
      comment,
      createdAt: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  getByCase(caseId: string): CaseHistory[] {
    return this.entries.filter((e) => e.caseId === caseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
