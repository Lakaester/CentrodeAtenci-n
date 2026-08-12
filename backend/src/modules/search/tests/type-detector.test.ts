import { describe, it, expect } from "vitest";
import { TypeDetector } from "../engine/TypeDetector";

describe("TypeDetector", () => {
  const detector = new TypeDetector();

  it("debe detectar dominio", () => {
    const result = detector.detect("demo.restaurant.pe");
    expect(result.detectedType).toBe("domain");
  });

  it("debe detectar email", () => {
    const result = detector.detect("user@correo.pe");
    expect(result.detectedType).toBe("email");
  });

  it("debe detectar teléfono", () => {
    const result = detector.detect("+51939140512");
    expect(result.detectedType).toBe("phone");
  });

  it("debe detectar RUC (11 dígitos)", () => {
    const result = detector.detect("20600242009");
    expect(result.detectedType).toBe("ruc");
  });

  it("debe detectar ticket (# prefijo)", () => {
    const result = detector.detect("#32454");
    expect(result.detectedType).toBe("ticket");
  });

  it("debe detectar ticket (sin #)", () => {
    const result = detector.detect("32454");
    expect(result.detectedType).toBe("ticket");
  });

  it("debe detectar local_id (LOC-*)", () => {
    const result = detector.detect("LOC-001");
    expect(result.detectedType).toBe("local_id");
  });

  it("debe detectar device_id (DEV-*)", () => {
    const result = detector.detect("DEV-ABC123");
    expect(result.detectedType).toBe("device_id");
  });

  it("debe devolver unknown para texto genérico", () => {
    const result = detector.detect("texto genérico sin identificar");
    expect(result.detectedType).toBe("unknown");
  });

  it("debe normalizar a minúsculas", () => {
    const result = detector.detect("Demo.Restaurant.Pe");
    expect(result.normalized).toBe("demo.restaurant.pe");
  });
});
