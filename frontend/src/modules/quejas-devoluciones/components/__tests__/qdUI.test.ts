import { describe, expect, it } from "vitest";
import { fechaCasoSolicitud, fmtFecha } from "../qdUI";

describe("fecha visible de QyD", () => {
  it("muestra la fecha de origen cuando existe", () => {
    expect(fechaCasoSolicitud({ fecha_solicitud: "2026-07-15", created_at: "2026-11-10T10:00:00Z" }))
      .not.toBe("—");
  });

  it("cae a created_at cuando fecha_solicitud es null (no muestra guion)", () => {
    const visible = fechaCasoSolicitud({ fecha_solicitud: null, created_at: "2026-07-15T12:00:00Z" });
    expect(visible).not.toBe("—");
    expect(visible).toContain("2026");
  });

  it("solo muestra guion si tampoco existe created_at", () => {
    expect(fechaCasoSolicitud({ fecha_solicitud: null, created_at: null })).toBe("—");
    expect(fmtFecha(null)).toBe("—");
  });
});
