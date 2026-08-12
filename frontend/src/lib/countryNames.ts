/**
 * Canonical country name resolution — frontend mirror of the backend
 * CountryResolver.normalizeCountryName().
 *
 * SOURCE OF TRUTH: backend/src/utils/CountryResolver.ts
 * Any changes to country normalization must be made in BOTH files.
 *
 * Canonical value for Republica Dominicana: "REPUBLICA DOMINICANA"
 *
 * Handles 13 variants:
 *   Dominican Republic, DOMINICAN REPUBLIC, dominican republic,
 *   Dominican_Republic, DOMINICAN_REPUBLIC, Republica Dominicana,
 *   REPUBLICA DOMINICANA, República Dominicana, REPÚBLICA DOMINICANA,
 *   Republica_Dominicana, RepublicaDominicana, Dominicana Republic,
 *   Dominican Rep.
 */

/** Valor canonico para Republica Dominicana. */
export const CANONICAL_RD = "REPUBLICA DOMINICANA";

/**
 * Normaliza el nombre de un pais a su forma canonica.
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

  // Republica Dominicana
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
