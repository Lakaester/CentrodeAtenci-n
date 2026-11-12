import { describe, it, expect } from "vitest";
import { interpretarRespuestaCategoria, mensajeMotivo, toneClasses } from "../categoryResult";

describe("interpretarRespuestaCategoria", () => {
  it("creado → success con caso", () => {
    const r = interpretarRespuestaCategoria({
      creado: true,
      reutilizado: false,
      caso: { id: "c1", numero: "DEV-34576", tipo: "devolucion" },
      expedientePendiente: false,
    });
    expect(r.kind).toBe("creado");
    if (r.kind === "creado") {
      expect(r.caso).toEqual({ id: "c1", numero: "DEV-34576", tipo: "devolucion" });
      expect(r.message).toContain("DEV-34576");
    }
  });

  it("reutilizado → success con caso", () => {
    const r = interpretarRespuestaCategoria({
      creado: false,
      reutilizado: true,
      caso: { id: "c1", numero: "DEV-33967", tipo: "devolucion" },
    });
    expect(r.kind).toBe("reutilizado");
    if (r.kind === "reutilizado") expect(r.caso.numero).toBe("DEV-33967");
  });

  it("pendiente por canal → warning", () => {
    const r = interpretarRespuestaCategoria({ caso: null, motivo: "PENDIENTE_CANAL", expedientePendiente: true });
    expect(r.kind).toBe("pendiente");
    if (r.kind === "pendiente") {
      expect(r.motivo).toBe("PENDIENTE_CANAL");
      expect(r.message).toContain("canal real");
    }
  });

  it("pendiente por dominio → warning", () => {
    const r = interpretarRespuestaCategoria({ caso: null, motivo: "PENDIENTE_DOMINIO", expedientePendiente: true });
    expect(r.kind).toBe("pendiente");
    if (r.kind === "pendiente") expect(r.message).toContain("dominio");
  });

  it("pendiente por permiso QyD → warning", () => {
    const r = interpretarRespuestaCategoria({ caso: null, motivo: "SIN_PERMISO_QYD", expedientePendiente: true });
    expect(r.kind).toBe("pendiente");
    if (r.kind === "pendiente") expect(r.message).toContain("permiso");
  });

  it("no elegible → neutral", () => {
    const r = interpretarRespuestaCategoria({ caso: null, motivo: "NO_ELEGIBLE", expedientePendiente: false });
    expect(r.kind).toBe("no_elegible");
  });

  it("sin caso y sin motivo → guardado", () => {
    const r = interpretarRespuestaCategoria({ caso: null, expedientePendiente: false });
    expect(r.kind).toBe("guardado");
  });

  it("mensajeMotivo cubre los motivos conocidos", () => {
    expect(mensajeMotivo("PENDIENTE_CANAL")).toContain("canal");
    expect(mensajeMotivo("CANAL_NO_SOPORTADO")).toContain("canal");
    expect(mensajeMotivo("PENDIENTE_DOMINIO")).toContain("dominio");
    expect(mensajeMotivo("PENDIENTE_RELACION")).toContain("raíz");
    expect(mensajeMotivo("PENDIENTE_ATENCION")).toContain("datos locales");
    expect(mensajeMotivo("PENDIENTE_FECHA")).toContain("fecha");
    expect(mensajeMotivo("OTRO")).toContain("pendiente");
  });

  it("toneClasses mapea tonos", () => {
    expect(toneClasses("success")).toContain("success");
    expect(toneClasses("warning")).toContain("warning");
    expect(toneClasses("error")).toContain("danger");
    expect(toneClasses("neutral")).toContain("black");
  });
});
