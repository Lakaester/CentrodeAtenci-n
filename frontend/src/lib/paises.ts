/**
 * Homologación de países para el frontend.
 *
 * Espejo exacto de las reglas de normalización del motor oficial
 * CountryResolver del backend (backend/src/utils/CountryResolver.ts ·
 * normalizeCountryName): trim, "_"→espacio, colapso de espacios,
 * mayúsculas y comparación sin acentos.
 *
 * La etiqueta visible usa el catálogo con acentos y capitalización
 * oficial; países fuera del catálogo caen a Title Case del valor
 * normalizado para no perder ninguna opción del dropdown.
 */

const ETIQUETAS: Record<string, string> = {
  PERU: "Perú",
  COLOMBIA: "Colombia",
  "EL SALVADOR": "El Salvador",
  "COSTA RICA": "Costa Rica",
  GUATEMALA: "Guatemala",
  ECUADOR: "Ecuador",
  MEXICO: "México",
  CHILE: "Chile",
  "REPUBLICA DOMINICANA": "República Dominicana",
  HONDURAS: "Honduras",
  NICARAGUA: "Nicaragua",
  PANAMA: "Panamá",
  ARGENTINA: "Argentina",
  VENEZUELA: "Venezuela",
  BOLIVIA: "Bolivia",
  PARAGUAY: "Paraguay",
  URUGUAY: "Uruguay",
  HAITI: "Haití",
};

/** Clave homologada para comparación (mayúsculas, sin acentos, sin "_"). */
export function clavePais(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase()
    .trim()
    .replace(/[ÁÄÀÃÂ]/g, "A")
    .replace(/[ÉËÈÊ]/g, "E")
    .replace(/[ÍÏÌÎ]/g, "I")
    .replace(/[ÓÖÒÕÔ]/g, "O")
    .replace(/[ÚÜÙÛ]/g, "U")
    .replace(/Ñ/g, "N");
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

/** Etiqueta visible homologada ("perú" → "Perú", "el_salvador" → "El Salvador"). */
export function etiquetaPais(raw: string | null | undefined): string {
  const clave = clavePais(raw);
  if (!clave) return "";
  return ETIQUETAS[clave] ?? titleCase(clave);
}
