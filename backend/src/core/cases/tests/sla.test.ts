import { describe, it, expect } from "vitest";
import { SLAService } from "../sla/SLAService";

describe("SLAService", () => {
  const sla = new SLAService();

  it("debe calcular SLA para prioridad crítica (4h)", () => {
    const result = sla.calculate("case-1", "critica", new Date().toISOString());
    expect(result.limitHours).toBe(4);
    expect(result.breached).toBe(false);
  });

  it("debe calcular SLA para prioridad alta (8h)", () => {
    const result = sla.calculate("case-1", "alta", new Date().toISOString());
    expect(result.limitHours).toBe(8);
  });

  it("debe calcular SLA para prioridad media (24h)", () => {
    const result = sla.calculate("case-1", "media", new Date().toISOString());
    expect(result.limitHours).toBe(24);
  });

  it("debe calcular SLA para prioridad baja (72h)", () => {
    const result = sla.calculate("case-1", "baja", new Date().toISOString());
    expect(result.limitHours).toBe(72);
  });

  it("debe detectar SLA vencido para ticket creado hace 5 horas (crítica)", () => {
    const past = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
    const result = sla.calculate("case-1", "critica", past);
    expect(result.breached).toBe(true);
  });

  it("debe tener breachAt cuando se vence", () => {
    const past = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
    const result = sla.calculate("case-1", "alta", past);
    expect(result.breachAt).not.toBeNull();
    expect(result.elapsedHours).toBeGreaterThan(8);
  });
});
