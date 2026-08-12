export type HealthLevel = "green" | "yellow" | "red";

export interface HealthFactor {
  name: string;
  weight: number;
  ok: boolean;
  details?: string;
}

export interface HealthResult {
  level: HealthLevel;
  score: number;
  factors: HealthFactor[];
}

export function calculateHealth(factors: HealthFactor[]): HealthResult {
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const weightedOk = factors.reduce((s, f) => s + (f.ok ? f.weight : 0), 0);
  const score = totalWeight > 0 ? Math.round((weightedOk / totalWeight) * 100) : 0;
  const level: HealthLevel = score >= 75 ? "green" : score >= 40 ? "yellow" : "red";
  return { level, score, factors };
}
