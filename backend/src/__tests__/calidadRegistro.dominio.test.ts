import { describe, it, expect } from "vitest";
import { isValidDomainFormat } from "../domain/contacto/normalizacion";

/**
 * Fija los casos que el indicador "dominio válido" debe aceptar/rechazar.
 * La regla es la ya existente en el backend, no una regla nueva.
 */
describe("regla canónica de dominio válido para Calidad de Registro", () => {
  const validos = [
    "bobocha.restaurant.pe",
    "picadeli.restaurant.pe",
    "lavacanegra.quipupos.com",
    "CapitalPolleria.Restaurant.Pe",
    "  capitalpolleria.restaurant.pe  ",
    "https://bobocha.restaurant.pe/",
    "http://bobocha.restaurant.pe/restaurant/#!/inicio?x=1",
  ];

  const invalidos = [
    null,
    undefined,
    "",
    "   ",
    "0",
    "-",
    "Consultas",
    "Productos",
    "Informativo",
    "sin dominio",
    "sindominio",
    "foo",
    "localhost",
    "not a domain",
    "pardoschicken_off.restaurant.pe",
    "laleña.restaurant.pe",
    "grupoingunza.restaurant.p",
  ];

  for (const d of validos) {
    it(`acepta ${JSON.stringify(d)}`, () => {
      expect(isValidDomainFormat(d)).toBe(true);
    });
  }

  for (const d of invalidos) {
    it(`rechaza ${JSON.stringify(d)}`, () => {
      expect(isValidDomainFormat(d)).toBe(false);
    });
  }
});
