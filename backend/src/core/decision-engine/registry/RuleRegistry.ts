import type { IRule } from "../interfaces/IRule";

export class RuleRegistry {
  private rules = new Map<string, IRule>();

  register(rule: IRule): void {
    this.rules.set(rule.getDefinition().id, rule);
    console.log(`[RuleRegistry] Registrada: ${rule.getDefinition().id} — ${rule.getDefinition().nombre}`);
  }

  get(id: string): IRule | undefined {
    return this.rules.get(id);
  }

  list(): IRule[] {
    return Array.from(this.rules.values());
  }

  count(): number {
    return this.rules.size;
  }
}
