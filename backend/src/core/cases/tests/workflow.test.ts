import { describe, it, expect } from "vitest";
import { WorkflowEngine } from "../workflow/WorkflowEngine";
import { VALID_TRANSITIONS } from "../types";
import type { Case, CaseStatus } from "../types";

function createCase(status: CaseStatus): Case {
  return {
    id: "test-1",
    title: "Test",
    description: "Test case",
    status,
    dominio: "test.pe",
    assignedTo: null,
    watchers: [],
    priority: "media",
    tags: [],
    ticketId: null,
    provider: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    closedAt: null,
  };
}

describe("WorkflowEngine", () => {
  const engine = new WorkflowEngine();

  describe("canTransition", () => {
    it("nuevo → en_analisis debe ser válida", () => {
      expect(engine.canTransition("nuevo", "en_analisis")).toBe(true);
    });

    it("nuevo → resuelto debe ser inválida", () => {
      expect(engine.canTransition("nuevo", "resuelto")).toBe(false);
    });

    it("resuelto → cerrado debe ser válida", () => {
      expect(engine.canTransition("resuelto", "cerrado")).toBe(true);
    });

    it("resuelto → reabierto debe ser válida", () => {
      expect(engine.canTransition("resuelto", "reabierto")).toBe(true);
    });

    it("cerrado → reabierto debe ser válida", () => {
      expect(engine.canTransition("cerrado", "reabierto")).toBe(true);
    });

    it("nuevo → cerrado debe ser inválida (salto directo)", () => {
      expect(engine.canTransition("nuevo", "cerrado")).toBe(false);
    });
  });

  describe("transition", () => {
    it("debe cambiar el estado correctamente", () => {
      const c = createCase("nuevo");
      const result = engine.transition(c, "en_analisis");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("en_analisis");
    });

    it("debe registrar resolvedAt al pasar a resuelto", () => {
      const c = createCase("validacion");
      const result = engine.transition(c, "resuelto");
      expect(result).not.toBeNull();
      expect(result!.resolvedAt).not.toBeNull();
    });

    it("debe registrar closedAt al pasar a cerrado", () => {
      const c = createCase("resuelto");
      const result = engine.transition(c, "cerrado");
      expect(result).not.toBeNull();
      expect(result!.closedAt).not.toBeNull();
    });

    it("debe retornar null para transición inválida", () => {
      const c = createCase("nuevo");
      const result = engine.transition(c, "cerrado");
      expect(result).toBeNull();
    });
  });

  describe("transiciones completas (end-to-end)", () => {
    it("debe recorrer el flujo completo nuevo → cerrado", () => {
      const c = createCase("nuevo");
      const steps: CaseStatus[] = ["en_analisis", "diagnosticado", "implementando", "validacion", "resuelto", "cerrado"];
      let current = c;
      for (const step of steps) {
        const result = engine.transition(current, step);
        expect(result, `Fallo en transición → ${step}`).not.toBeNull();
        current = result!;
      }
      expect(current.status).toBe("cerrado");
    });

    it("debe permitir reapertura desde cerrado", () => {
      const c = createCase("cerrado");
      const result = engine.transition(c, "reabierto");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("reabierto");
    });

    it("debe tener 10 estados definidos en VALID_TRANSITIONS", () => {
      const estados = Object.keys(VALID_TRANSITIONS);
      expect(estados).toHaveLength(10);
    });
  });
});
