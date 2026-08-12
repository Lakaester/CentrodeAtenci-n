import type { IRule } from "../interfaces/IRule";
import type { DecisionFinding } from "../models";
import type { RuleDefinition, RuleCondition } from "../types";

export abstract class BaseRule implements IRule {
  abstract getDefinition(): RuleDefinition;

  evaluate(context: Record<string, unknown>): DecisionFinding | null {
    const def = this.getDefinition();
    for (const cond of def.condiciones) {
      if (!this.testCondition(cond, context)) return null;
    }
    return {
      ruleId: def.id,
      nombre: def.nombre,
      descripcion: def.descripcion,
      severidad: def.severidad,
      explicacion: def.explicacion,
      evidencias: this.collectEvidence(context),
    };
  }

  private testCondition(cond: RuleCondition, ctx: Record<string, unknown>): boolean {
    const val = ctx[cond.field];
    switch (cond.operator) {
      case "eq": return val === cond.value;
      case "neq": return val !== cond.value;
      case "gt": return typeof val === "number" && val > (cond.value as number);
      case "gte": return typeof val === "number" && val >= (cond.value as number);
      case "lt": return typeof val === "number" && val < (cond.value as number);
      case "lte": return typeof val === "number" && val <= (cond.value as number);
      case "contains": return typeof val === "string" && val.includes(String(cond.value));
      case "exists": return val !== undefined && val !== null;
      default: return false;
    }
  }

  private collectEvidence(ctx: Record<string, unknown>): Record<string, unknown> {
    const evidence: Record<string, unknown> = {};
    for (const cond of this.getDefinition().condiciones) {
      evidence[cond.field] = ctx[cond.field];
    }
    return evidence;
  }
}
