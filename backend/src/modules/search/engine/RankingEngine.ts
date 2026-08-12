import type { SearchResult } from "../types";

interface RankRule {
  name: string;
  apply(result: SearchResult): number;
}

const RULES: RankRule[] = [
  { name: "type-match", apply: (r) => (r.type !== "unknown" ? 30 : 0) },
  { name: "has-data", apply: (r) => (Object.keys(r.data).length > 0 ? 20 : 0) },
  { name: "source-memory", apply: (r) => (r.source === "customer-memory" ? 25 : 0) },
  { name: "source-zendesk", apply: (r) => (r.source === "zendesk" ? 15 : 0) },
];

export class RankingEngine {
  rank(results: SearchResult[]): SearchResult[] {
    for (const r of results) {
      r.score = RULES.reduce((sum, rule) => sum + rule.apply(r), 0);
    }
    return results.sort((a, b) => b.score - a.score);
  }
}
