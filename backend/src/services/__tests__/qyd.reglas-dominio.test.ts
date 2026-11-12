import { describe, expect, it } from "vitest";
import {
  DOMINIO_SIN_DOMINIO,
  esDominioPlaceholder,
  esDominioSinDominio,
  resolverDominioQyd,
} from "../../domain/contacto/dominioQyd";
import {
  dominioValido,
  esCategoriaSinCategorizar,
  normalizarDominio,
} from "../quejasCasos.service";
import { fechaOrigenDia, fechaOrigenExacta } from "../../utils/fechaQyd";

describe("QyD — regla SIN DOMINIO", () => {
  it("acepta un dominio real y lo normaliza", () => {
    expect(resolverDominioQyd("  HTTPS://Cliente.Restaurant.PE/ruta  ")).toEqual({
      dominio: "cliente.restaurant.pe",
      sinDominio: false,
      original: "HTTPS://Cliente.Restaurant.PE/ruta",
      motivo: "VALIDO",
    });
  });

  it("un vacío/ausente se resuelve como SIN DOMINIO", () => {
    expect(resolverDominioQyd(null)).toMatchObject({
      dominio: DOMINIO_SIN_DOMINIO, sinDominio: true, original: null, motivo: "AUSENTE",
    });
    expect(resolverDominioQyd("   ")).toMatchObject({
      dominio: DOMINIO_SIN_DOMINIO, sinDominio: true, motivo: "AUSENTE",
    });
  });

  it("rechaza correos y conserva el valor original", () => {
    expect(resolverDominioQyd("munanqui@gmail.com")).toEqual({
      dominio: DOMINIO_SIN_DOMINIO,
      sinDominio: true,
      original: "munanqui@gmail.com",
      motivo: "EMAIL",
    });
  });

  it("rechaza placeholders aunque tengan formato de dominio", () => {
    for (const valor of [
      "sinlocal.restaurant.pe",
      "sindominio.restaurant.pe",
      "sin dominio",
      "sindominio",
      "sin dominio (se le solicitò datos)",
      "s/d",
      "n/a",
      "null",
    ]) {
      const r = resolverDominioQyd(valor);
      expect(r.sinDominio, valor).toBe(true);
      expect(r.dominio, valor).toBe(DOMINIO_SIN_DOMINIO);
      expect(r.original, valor).toBe(valor);
    }
  });

  it("un valor con formato inválido se resuelve como SIN DOMINIO", () => {
    expect(resolverDominioQyd("sin-punto")).toMatchObject({
      dominio: DOMINIO_SIN_DOMINIO, sinDominio: true, motivo: "FORMATO_INVALIDO",
    });
  });

  it("preserva el valor explícito SIN DOMINIO", () => {
    expect(esDominioSinDominio(" sin dominio ")).toBe(true);
    expect(esDominioPlaceholder("SIN DOMINIO")).toBe(true);
    expect(resolverDominioQyd("SIN DOMINIO")).toMatchObject({
      dominio: DOMINIO_SIN_DOMINIO, sinDominio: true,
    });
  });

  it("dominioValido distingue dominio real de SIN DOMINIO", () => {
    expect(dominioValido("cliente.restaurant.pe")).toBe(true);
    expect(dominioValido("munanqui@gmail.com")).toBe(false);
    expect(dominioValido("sindominio.restaurant.pe")).toBe(false);
    expect(dominioValido("sinlocal.restaurant.pe")).toBe(false);
    expect(dominioValido(DOMINIO_SIN_DOMINIO)).toBe(false);
    expect(dominioValido(null)).toBe(false);
  });

  it("normalizarDominio conserva el marcador en mayúsculas", () => {
    expect(normalizarDominio("SIN DOMINIO")).toBe(DOMINIO_SIN_DOMINIO);
    expect(normalizarDominio("Cliente.Restaurant.PE")).toBe("cliente.restaurant.pe");
  });
});

describe("QyD — universo: sin categorizar vs no QyD", () => {
  it("trata vacío y SIN HOMOLOGAR como sin categorizar", () => {
    expect(esCategoriaSinCategorizar(null, null)).toBe(true);
    expect(esCategoriaSinCategorizar("", "")).toBe(true);
    expect(esCategoriaSinCategorizar("SIN HOMOLOGAR", "integraciones_y_apis")).toBe(true);
    expect(esCategoriaSinCategorizar("sin categoría")).toBe(true);
    expect(esCategoriaSinCategorizar("NO CATEGORIZADO")).toBe(true);
  });

  it("no confunde categorías reales no QyD con sin categorizar", () => {
    expect(esCategoriaSinCategorizar("SOFTWARE", "error_punto_de_venta")).toBe(false);
    expect(esCategoriaSinCategorizar("DUPLICADA", "duplicada_o_spam")).toBe(false);
    expect(esCategoriaSinCategorizar("GESTION", "consultas_generales")).toBe(false);
    expect(esCategoriaSinCategorizar("QUEJA", "queja_servicio")).toBe(false);
  });
});

describe("QyD — fecha original exacta", () => {
  it("conserva el instante original sin conversión horaria", () => {
    expect(fechaOrigenExacta("2026-07-01T00:18:48Z")).toBe("2026-07-01T00:18:48Z");
    expect(fechaOrigenDia("2026-07-01T00:18:48Z")).toBe("2026-07-01");
  });

  it("no desplaza el día a Lima (2026-07-01 00:18 UTC sigue siendo 2026-07-01)", () => {
    expect(fechaOrigenDia("2026-07-01T00:18:48Z")).toBe("2026-07-01");
    expect(fechaOrigenDia("2026-07-01T03:28:38Z")).toBe("2026-07-01");
  });

  it("normaliza Date a ISO UTC exacto y rechaza inválidos", () => {
    expect(fechaOrigenExacta(new Date("2026-08-10T15:37:21.000Z"))).toBe("2026-08-10T15:37:21Z");
    expect(fechaOrigenExacta("no-es-fecha")).toBeNull();
    expect(fechaOrigenDia(null)).toBeNull();
  });
});
