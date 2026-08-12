/**
 * Tabla unica de prefijos telefonicos para homologacion de pais.
 *
 * Orden de prioridad:
 * 1. Pais del Cliente   (customer.country)
 * 2. Pais de la Organizacion
 * 3. Pais de la Licencia
 * 4. Pais del Dominio    (ej: .restaurant.pe → PERU)
 * 5. Pais recibido por la integracion
 * 6. Inferencia por prefijo telefonico (ESTA TABLA)
 *
 * La inferencia telefonica es el ULTIMO RECURSO.
 */

export interface CountryPrefix {
  prefix: string;
  country: string;
}

/** Prefijos NANP (+1) que corresponden a paises especificos del Caribe. */
export const NANP_OVERRIDES: CountryPrefix[] = [
  { prefix: "+1809", country: "REPUBLICA DOMINICANA" },
  { prefix: "+1829", country: "REPUBLICA DOMINICANA" },
  { prefix: "+1849", country: "REPUBLICA DOMINICANA" },
];

/**
 * Tabla principal de prefijos telefonicos.
 * Ordenados por longitud de prefijo (mas largo primero) para
 * evitar falsos positivos (ej: +50 no debe capturar +502).
 */
export const COUNTRY_PREFIXES: CountryPrefix[] = [
  // NANP (+1) overrides — revisados primero por ser mas especificos
  ...NANP_OVERRIDES,

  // Centroamerica y Caribe (3 digitos)
  { prefix: "+502", country: "GUATEMALA" },
  { prefix: "+503", country: "EL SALVADOR" },
  { prefix: "+504", country: "HONDURAS" },
  { prefix: "+505", country: "NICARAGUA" },
  { prefix: "+506", country: "COSTA RICA" },
  { prefix: "+507", country: "PANAMA" },
  { prefix: "+509", country: "HAITI" },

  // Sudamerica (2 digitos)
  { prefix: "+51", country: "PERU" },
  { prefix: "+52", country: "MEXICO" },
  { prefix: "+54", country: "ARGENTINA" },
  { prefix: "+56", country: "CHILE" },
  { prefix: "+57", country: "COLOMBIA" },
  { prefix: "+58", country: "VENEZUELA" },

  // Sudamerica (3 digitos)
  { prefix: "+591", country: "BOLIVIA" },
  { prefix: "+593", country: "ECUADOR" },
  { prefix: "+595", country: "PARAGUAY" },
  { prefix: "+598", country: "URUGUAY" },

  // NANP fallback (+1) — ultimo porque captura todo lo que no fue override
  { prefix: "+1", country: "UNITED STATES" },
];
