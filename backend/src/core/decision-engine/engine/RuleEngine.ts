import { RuleRegistry } from "../registry/RuleRegistry";
import type { IRuleEngine } from "../interfaces/IRule";
import type { DecisionResult, DecisionFinding, DecisionRisk, DecisionRecommendation } from "../models";

export class RuleEngine implements IRuleEngine {
  private registry: RuleRegistry;

  constructor(registry: RuleRegistry) {
    this.registry = registry;
  }

  register(rule: IRule): void {
    this.registry.register(rule);
  }

  async evaluate(dominio: string, context: Record<string, unknown>): Promise<DecisionResult> {
    const rules = this.registry.list();
    const hallazgos: DecisionFinding[] = [];
    const reglasAplicadas: typeof rules = [];

    for (const rule of rules) {
      const finding = rule.evaluate(context);
      if (finding) {
        hallazgos.push(finding);
        reglasAplicadas.push(rule);
      }
    }

    const riesgos: DecisionRisk[] = hallazgos.map((f) => ({
      finding: f,
      impacto: f.severidad === "critica" ? "Alto" : f.severidad === "alta" ? "Medio" : "Bajo",
      probabilidad: f.severidad === "critica" ? "alta" : f.severidad === "alta" ? "media" : "baja",
    }));

    const recomendaciones: DecisionRecommendation[] = hallazgos.map((f) => ({
      findingId: f.ruleId,
      accion: f.explicacion,
      prioridad: f.severidad === "critica" || f.severidad === "alta" ? "inmediata" : "programada",
    }));

    const confianza = hallazgos.length > 0 ? "alta" : "media";

    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      dominio,
      totalReglas: rules.length,
      reglasAplicadas: hallazgos.length,
      hallazgos,
      riesgos,
      recomendaciones,
      confianza,
      reglas: reglasAplicadas.map((r) => r.getDefinition()),
    };
  }
}
