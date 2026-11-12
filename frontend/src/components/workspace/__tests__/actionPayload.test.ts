import { describe, it, expect } from "vitest";
import { buildActionPayload } from "../actionPayload";

describe("buildActionPayload — Fase 1.1.2", () => {
  it("elimina autor en categorize", () => {
    const payload = buildActionPayload({ categoria: "QUEJA", subcategoria: "queja_servicio", autor: "Otro" });
    expect(payload).not.toHaveProperty("autor");
    expect(payload).toMatchObject({ categoria: "QUEJA", subcategoria: "queja_servicio" });
  });

  it("elimina autor en assign/status/internal-note", () => {
    expect(buildActionPayload({ assigneeId: 7, autor: "Otro" })).toEqual({ assigneeId: 7 });
    expect(buildActionPayload({ status: "solved", autor: "Otro" })).toEqual({ status: "solved" });
    expect(buildActionPayload({ body: "x", autor: "Otro" })).toEqual({ body: "x" });
  });

  it("sin body devuelve objeto vacío", () => {
    expect(buildActionPayload()).toEqual({});
  });
});
