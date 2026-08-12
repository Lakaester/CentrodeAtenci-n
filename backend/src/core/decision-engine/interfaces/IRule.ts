import type { DecisionFinding, DecisionResult } from "../models";
import type { RuleDefinition } from "../types";

export interface IRule {
  getDefinition(): RuleDefinition;
  evaluate(context: Record<string, unknown>): DecisionFinding | null;
}

export interface IRuleEngine {
  register(rule: IRule): void;
  evaluate(dominio: string, context: Record<string, unknown>): Promise<DecisionResult>;
}
