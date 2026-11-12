import { describe, it, expect } from "vitest";
import { identidadDe } from "../identidad";

function req(auth: any) {
  return { auth } as any;
}

describe("identidadDe — Fase 1.1.2", () => {
  it("incluye id, nombre, apellido, correo, nombre completo y etiqueta", () => {
    const i = identidadDe(req({ id: "usr-1", nombre: "Ana", apellido: "Perez", correo: "ana@cope.pe" }));
    expect(i).toEqual({
      id: "usr-1",
      nombre: "Ana",
      apellido: "Perez",
      correo: "ana@cope.pe",
      nombreCompleto: "Ana Perez",
      etiqueta: "Ana Perez (usr-1)",
    });
  });

  it("apellido nulo → etiqueta con nombre y id", () => {
    const i = identidadDe(req({ id: "usr-1", nombre: "Ana", apellido: null, correo: "ana@cope.pe" }));
    expect(i?.nombreCompleto).toBe("Ana");
    expect(i?.etiqueta).toBe("Ana (usr-1)");
    expect(i?.apellido).toBeNull();
  });

  it("normaliza espacios", () => {
    const i = identidadDe(req({ id: " usr-1 ", nombre: " Ana ", apellido: " Perez ", correo: "ana@cope.pe" }));
    expect(i?.nombreCompleto).toBe("Ana Perez");
    expect(i?.etiqueta).toBe("Ana Perez (usr-1)");
  });

  it("sin auth → null", () => {
    expect(identidadDe(req(undefined))).toBeNull();
  });

  it("sin id → null", () => {
    expect(identidadDe(req({ id: "", nombre: "Ana", apellido: "Perez", correo: "ana@cope.pe" }))).toBeNull();
  });

  it("sin nombre → null", () => {
    expect(identidadDe(req({ id: "usr-1", nombre: "   ", apellido: "Perez", correo: "ana@cope.pe" }))).toBeNull();
  });
});
