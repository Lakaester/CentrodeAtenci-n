export type HealthLevel = "green" | "yellow" | "red";

export interface HealthScoreResult {
  level: HealthLevel;
  score: number;
  factors: { name: string; ok: boolean }[];
}

export function calculateHealthScore(params: {
  hasActiveLicense: boolean;
  isLatestVersion: boolean;
  hasFolios: boolean;
  recentActivity: boolean;
}): HealthScoreResult {
  const factors = [
    { name: "Licencia activa", ok: params.hasActiveLicense },
    { name: "Versión actualizada", ok: params.isLatestVersion },
    { name: "Folios disponibles", ok: params.hasFolios },
    { name: "Actividad reciente", ok: params.recentActivity },
  ];

  const okCount = factors.filter((f) => f.ok).length;
  const score = Math.round((okCount / factors.length) * 100);

  const level: HealthLevel = score >= 75 ? "green" : score >= 50 ? "yellow" : "red";

  return { level, score, factors };
}
