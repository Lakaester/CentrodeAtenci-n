export type Severity = "baja" | "media" | "alta" | "critica";
export type Confidence = "alta" | "media" | "baja";

export interface RuleCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "exists";
  value: unknown;
}

export interface RuleDefinition {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  severidad: Severity;
  condiciones: RuleCondition[];
  recomendaciones: string[];
  explicacion: string;
  confianza: Confidence;
  version: string;
  autor: string;
  fecha: string;
}
