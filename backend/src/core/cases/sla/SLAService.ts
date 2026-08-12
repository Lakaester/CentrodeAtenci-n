import type { CaseSLA } from "../types";

const PRIORITY_LIMITS: Record<string, number> = {
  critica: 4,
  alta: 8,
  media: 24,
  baja: 72,
};

export class SLAService {
  calculate(caseId: string, priority: string, createdAt: string): CaseSLA {
    const limitHours = PRIORITY_LIMITS[priority] ?? 72;
    const elapsedHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    const breached = elapsedHours > limitHours;

    const breachAt = new Date(new Date(createdAt).getTime() + limitHours * 3600000).toISOString();

    return { caseId, priority, limitHours, elapsedHours: Math.round(elapsedHours * 10) / 10, breached, breachAt };
  }
}
