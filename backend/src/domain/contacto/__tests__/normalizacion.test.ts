import { describe, it, expect } from "vitest";
import { normalizeDomain, isValidDomainFormat } from "../normalizacion";

describe("normalizeDomain", () => {
  const cases: [string, string][] = [
    // Protocolo
    ["https://picadeli.restaurant.pe", "picadeli.restaurant.pe"],
    ["http://picadeli.restaurant.pe", "picadeli.restaurant.pe"],
    ["HTTPS://PICADELI.RESTAURANT.PE", "picadeli.restaurant.pe"],

    // Trailing slash
    ["https://picadeli.restaurant.pe/", "picadeli.restaurant.pe"],
    ["http://picadeli.restaurant.pe/", "picadeli.restaurant.pe"],

    // Paths
    ["https://picadeli.restaurant.pe/r", "picadeli.restaurant.pe"],
    ["https://picadeli.restaurant.pe/ruta/abc", "picadeli.restaurant.pe"],
    ["http://picadeli.restaurant.pe/restaurant/#!/algo", "picadeli.restaurant.pe"],
    ["http://bobocha.restaurant.pe/restaurant/#!/inicio?x=1", "bobocha.restaurant.pe"],

    // Query strings
    ["https://picadeli.restaurant.pe/ruta?x=1", "picadeli.restaurant.pe"],
    ["https://picadeli.restaurant.pe?foo=1&bar=2", "picadeli.restaurant.pe"],

    // Fragments
    ["https://picadeli.restaurant.pe/#abc", "picadeli.restaurant.pe"],
    ["https://picadeli.restaurant.pe/ruta#section", "picadeli.restaurant.pe"],

    // Quipupos
    ["https://lavacanegra.quipupos.com/", "lavacanegra.quipupos.com"],
    ["http://lavacanegra.quipupos.com/test", "lavacanegra.quipupos.com"],
    ["https://abc.quipupos.com/ruta?x=1#y", "abc.quipupos.com"],

    // Espacios
    [" bobocha.restaurant.pe ", "bobocha.restaurant.pe"],
    ["  https://bobocha.restaurant.pe/  ", "bobocha.restaurant.pe"],
    [" https://bobocha.restaurant.pe/restaurant/#!/ ", "bobocha.restaurant.pe"],

    // Ya limpio
    ["bobocha.restaurant.pe", "bobocha.restaurant.pe"],
    ["lorenzocafe.restaurant.pe", "lorenzocafe.restaurant.pe"],

    // Trailing dots
    ["picadeli.restaurant.pe.", "picadeli.restaurant.pe"],

    // Empty / null
    ["", ""],
  ];

  for (const [input, expected] of cases) {
    it(`"${input}" → "${expected}"`, () => {
      expect(normalizeDomain(input)).toBe(expected);
    });
  }

  it("returns empty string for null", () => {
    expect(normalizeDomain(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(normalizeDomain(undefined)).toBe("");
  });

  it("equivalencia: https://bobocha.restaurant.pe/ == bobocha.restaurant.pe", () => {
    expect(normalizeDomain("https://bobocha.restaurant.pe/")).toBe(
      normalizeDomain("bobocha.restaurant.pe")
    );
  });

  it("equivalencia: http://bobocha.restaurant.pe/restaurant/#!/ == bobocha.restaurant.pe", () => {
    expect(normalizeDomain("http://bobocha.restaurant.pe/restaurant/#!/")).toBe(
      normalizeDomain("bobocha.restaurant.pe")
    );
  });
});

describe("isValidDomainFormat", () => {
  const valid = [
    "picadeli.restaurant.pe",
    "bobocha.restaurant.pe",
    "lavacanegra.quipupos.com",
    "lorenzocafe.restaurant.pe",
  ];

  const invalid = [
    "",
    "localhost",
    "foo",
    "not a domain",
  ];

  for (const d of valid) {
    it(`"${d}" is valid`, () => {
      expect(isValidDomainFormat(d)).toBe(true);
    });
  }

  for (const d of invalid) {
    it(`"${d}" is invalid`, () => {
      expect(isValidDomainFormat(d)).toBe(false);
    });
  }
});
