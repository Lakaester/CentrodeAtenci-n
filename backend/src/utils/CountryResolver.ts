/**
 * CountryResolver — Motor unico de homologacion de pais para COPE.
 *
 * Proposito: todo modulo que necesite conocer el pais de un ticket,
 * cliente o atencion debe usar este resolver. PROHIBIDO duplicar
 * logica de homologacion en SQL, React, DTOs, componentes o mappers.
 *
 * Prioridad de resolucion:
 *   1. Pais del Cliente      (customer.country)
 *   2. Pais de la Organizacion (organization.country)
 *   3. Pais de la Licencia    (license.country)
 *   4. Pais del Dominio       (ej: .pe → PERU, .com.do → REPUBLICA DOMINICANA)
 *   5. Pais recibido por la integracion (raw)
 *   6. Inferencia por prefijo telefonico (countryPrefixes.ts)
 *
 * La inferencia telefonica es el ULTIMO recurso.
 *
 * Registra siempre countrySource para trazabilidad.
 */

import { COUNTRY_PREFIXES } from "./countryPrefixes";

/** Fuente de donde se obtuvo el pais homologado. */
export type CountrySource =
  | "CLIENT"
  | "ORGANIZATION"
  | "LICENSE"
  | "DOMAIN"
  | "INTEGRATION"
  | "PHONE_PREFIX";

export interface CountryResult {
  country: string;
  source: CountrySource;
}

/** Mapa de TLD de dominio → pais. */
const DOMAIN_TLD_MAP: Record<string, string> = {
  ".pe": "PERU",
  ".com.pe": "PERU",
  ".mx": "MEXICO",
  ".com.mx": "MEXICO",
  ".co": "COLOMBIA",
  ".com.co": "COLOMBIA",
  ".cl": "CHILE",
  ".com.do": "REPUBLICA DOMINICANA",
  ".do": "REPUBLICA DOMINICANA",
  ".gt": "GUATEMALA",
  ".com.gt": "GUATEMALA",
  ".ec": "ECUADOR",
  ".com.ec": "ECUADOR",
  ".sv": "EL SALVADOR",
  ".com.sv": "EL SALVADOR",
  ".hn": "HONDURAS",
  ".ni": "NICARAGUA",
  ".cr": "COSTA RICA",
  ".com.cr": "COSTA RICA",
  ".pa": "PANAMA",
  ".com.pa": "PANAMA",
  ".ar": "ARGENTINA",
  ".com.ar": "ARGENTINA",
  ".ve": "VENEZUELA",
  ".bo": "BOLIVIA",
  ".py": "PARAGUAY",
  ".com.py": "PARAGUAY",
  ".uy": "URUGUAY",
  ".com.uy": "URUGUAY",
  ".ht": "HAITI",
};

/**
 * Resuelve el pais utilizando la cadena completa de prioridad.
 *
 * @param input — Objeto con los datos disponibles del ticket/cliente.
 *   Todos los campos son opcionales. El resolver usara el primero disponible
 *   en orden de prioridad.
 */
export function resolveCountry(input: {
  customerCountry?: string | null;
  organizationCountry?: string | null;
  licenseCountry?: string | null;
  domain?: string | null;
  integrationCountry?: string | null;
  phone?: string | null;
}): CountryResult | null {
  // 1. Pais del Cliente
  if (input.customerCountry?.trim()) {
    return { country: input.customerCountry.trim().toUpperCase(), source: "CLIENT" };
  }

  // 2. Pais de la Organizacion
  if (input.organizationCountry?.trim()) {
    return { country: input.organizationCountry.trim().toUpperCase(), source: "ORGANIZATION" };
  }

  // 3. Pais de la Licencia
  if (input.licenseCountry?.trim()) {
    return { country: input.licenseCountry.trim().toUpperCase(), source: "LICENSE" };
  }

  // 4. Pais del Dominio
  if (input.domain?.trim()) {
    const domainResult = resolveCountryFromDomain(input.domain);
    if (domainResult) return domainResult;
  }

  // 5. Pais recibido por la integracion
  if (input.integrationCountry?.trim()) {
    const raw = input.integrationCountry.trim().toUpperCase();
    // Filtrar valores genericos que no son paises reales
    if (raw !== "UNITED STATES" && raw !== "USA" && raw !== "SIN PAIS" && raw !== "") {
      return { country: raw, source: "INTEGRATION" };
    }
  }

  // 6. Inferencia por prefijo telefonico (ULTIMO RECURSO)
  if (input.phone?.trim()) {
    const phoneResult = resolveCountryFromPhone(input.phone);
    if (phoneResult) return phoneResult;
  }

  return null;
}

/**
 * Resuelve el pais a partir de un dominio.
 * Busca el TLD en el mapa de dominios conocidos.
 *
 * Ejemplos:
 *   "restaurant.pe"     → PERU
 *   "cliente.com.do"    → REPUBLICA DOMINICANA
 *   "unknown.io"        → null
 */
export function resolveCountryFromDomain(domain: string): CountryResult | null {
  const clean = domain.trim().toLowerCase();
  // Intentar match exacto del TLD (mas largo primero: .com.do antes que .do)
  const sortedTLDs = Object.keys(DOMAIN_TLD_MAP).sort((a, b) => b.length - a.length);
  for (const tld of sortedTLDs) {
    if (clean.endsWith(tld)) {
      return { country: DOMAIN_TLD_MAP[tld], source: "DOMAIN" };
    }
  }
  return null;
}

/**
 * Resuelve el pais a partir de un numero de telefono.
 *
 * Reglas:
 * - Busca primero los prefijos mas largos (NANP overrides: +1809, +1829, +1849)
 * - Si el prefijo es +1 y NO es un override NANP → UNITED STATES
 * - Si no coincide ningun prefijo → null
 *
 * Ejemplos:
 *   "+51987654321" → PERU
 *   "+18095551234" → REPUBLICA DOMINICANA
 *   "+13055551234" → UNITED STATES
 *   "+44012345678" → null (UK no esta en la tabla)
 */
export function resolveCountryFromPhone(phone: string): CountryResult | null {
  const clean = phone.trim().replace(/\s+/g, "");

  // Buscar el prefijo mas largo que coincida
  for (const entry of COUNTRY_PREFIXES) {
    if (clean.startsWith(entry.prefix)) {
      return { country: entry.country, source: "PHONE_PREFIX" };
    }
  }

  return null;
}

/**
 * Valor canonico para Republica Dominicana.
 * Toda variante debe resolverse a este unico valor.
 */
export const CANONICAL_RD = "REPUBLICA DOMINICANA";

/**
 * Normaliza el nombre de un pais a su forma canonica.
 *
 * Maneja 13 variantes de Republica Dominicana:
 *   Dominican Republic, DOMINICAN REPUBLIC, dominican republic,
 *   Dominican_Republic, DOMINICAN_REPUBLIC, Republica Dominicana,
 *   REPUBLICA DOMINICANA, República Dominicana, REPÚBLICA DOMINICANA,
 *   Republica_Dominicana, RepublicaDominicana, Dominicana Republic,
 *   Dominican Rep.
 *
 * Tambien normaliza espacios, underscores, mayusculas/minusculas y acentos.
 *
 * @returns El nombre canonico del pais, o null si no se reconoce.
 */
export function normalizeCountryName(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Limpiar: uppercase, reemplazar underscores y multiples espacios
  let s = raw.trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase()
    .trim();

  // Eliminar acentos para comparacion
  s = s
    .replace(/[ÁÄÀÃÂ]/g, "A")
    .replace(/[ÉËÈÊ]/g, "E")
    .replace(/[ÍÏÌÎ]/g, "I")
    .replace(/[ÓÖÒÕÔ]/g, "O")
    .replace(/[ÚÜÙÛ]/g, "U")
    .replace(/Ñ/g, "N");

  if (!s) return null;

  // Republica Dominicana — 13 variantes
  if (
    s === "DOMINICAN REPUBLIC" ||
    s === "DOMINICAN REP" ||
    s === "DOMINICAN REP." ||
    s === "DOMINICANA REPUBLIC" ||
    s === "REPUBLICA DOMINICANA" ||
    s === "DOMINICANREPUBLIC" ||
    s === "REPUBLICADOMINICANA" ||
    s.startsWith("DOMINICAN REP") ||
    s.startsWith("REPUBLICA DOMINIC") ||
    s.startsWith("DOMINICANA REP")
  ) {
    return CANONICAL_RD;
  }

  return s;
}
