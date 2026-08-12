import { describe, it, expect } from "vitest";
import { DiskSpaceRule } from "../rules/DiskSpaceRule";

describe("DiskSpaceRule", () => {
  const rule = new DiskSpaceRule();

  it("debe activarse con disco >= 90%", () => {
    const finding = rule.evaluate({ diskUsagePercent: 95 });
    expect(finding).not.toBeNull();
    expect(finding!.ruleId).toBe("ENV-001");
    expect(finding!.severidad).toBe("alta");
  });

  it("debe activarse exactamente en 90%", () => {
    const finding = rule.evaluate({ diskUsagePercent: 90 });
    expect(finding).not.toBeNull();
  });

  it("no debe activarse con disco < 90%", () => {
    const finding = rule.evaluate({ diskUsagePercent: 50 });
    expect(finding).toBeNull();
  });

  it("no debe activarse sin el campo requerido", () => {
    const finding = rule.evaluate({});
    expect(finding).toBeNull();
  });

  it("debe incluir evidencias en el hallazgo", () => {
    const finding = rule.evaluate({ diskUsagePercent: 95 });
    expect(finding!.evidencias).toHaveProperty("diskUsagePercent");
    expect(finding!.evidencias.diskUsagePercent).toBe(95);
  });

  it("debe tener definición completa", () => {
    const def = rule.getDefinition();
    expect(def.id).toBe("ENV-001");
    expect(def.recomendaciones.length).toBeGreaterThan(0);
    expect(def.confianza).toBe("alta");
    expect(def.version).toBe("1.0.0");
  });
});
