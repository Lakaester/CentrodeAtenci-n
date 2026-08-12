import type { RuleDefinition, Severity, Confidence } from "../types";

export interface DecisionFinding {
  ruleId: string;
  nombre: string;
  descripcion: string;
  severidad: Severity;
  explicacion: string;
  evidencias: Record<string, unknown>;
}

export interface DecisionRisk {
  finding: DecisionFinding;
  impacto: string;
  probabilidad: "baja" | "media" | "alta";
}

export interface DecisionRecommendation {
  findingId: string;
  accion: string;
  prioridad: "inmediata" | programada | "informativa";
}

export interface DecisionResult {
  id: string;
  timestamp: string;
  dominio: string;
  totalReglas: number;
  reglasAplicadas: number;
  hallazgos: DecisionFinding[];
  riesgos: DecisionRisk[];
  recomendaciones: DecisionRecommendation[];
  confianza: Confidence;
  reglas: RuleDefinition[];
}
