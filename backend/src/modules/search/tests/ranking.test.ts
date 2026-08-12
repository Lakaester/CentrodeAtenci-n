import { describe, it, expect } from "vitest";
import { RankingEngine } from "../engine/RankingEngine";
import type { SearchResult } from "../types";

describe("RankingEngine", () => {
  const engine = new RankingEngine();

  const mockResult = (overrides: Partial<SearchResult>): SearchResult => ({
    id: "1",
    type: "domain",
    label: "test",
    description: "test",
    score: 0,
    data: {},
    source: "customer-memory",
    ...overrides,
  });

  it("debe dar mayor puntaje a resultados con tipo detectado", () => {
    const results = [
      mockResult({ id: "1", type: "domain" }),
      mockResult({ id: "2", type: "unknown" }),
    ];
    const ranked = engine.rank(results);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("debe dar mayor puntaje a resultados con datos completos", () => {
    const results = [
      mockResult({ id: "1", data: { dominio: "test.pe" } }),
      mockResult({ id: "2", data: {} }),
    ];
    const ranked = engine.rank(results);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("debe dar mayor puntaje a resultados de customer-memory", () => {
    const results = [
      mockResult({ id: "1", source: "customer-memory" }),
      mockResult({ id: "2", source: "zendesk" }),
    ];
    const ranked = engine.rank(results);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
});
