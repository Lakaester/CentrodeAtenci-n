/**
 * ADVISOR_COLOR_MAP — Fuente unica de verdad para la identidad cromatica de asesores.
 *
 * REGLAS:
 * - 1 asesor = 1 color FIJO. Nunca cambia por indice, ranking, volumen o periodo.
 * - Los colores representan IDENTIDAD, nunca estado (SLA, exito, error, warning).
 * - Prohibido duplicar esta paleta en otros archivos.
 * - Para nuevos asesores usar ADVISOR_FALLBACK_COLOR.
 *
 * Paleta pastel tipo arcoiris — 7 colores sobrios y diferenciables.
 * Ninguno coincide con los tokens de estado del Design System
 * (success/warning/danger) para evitar ambiguedad semantica.
 */

const COLOR_MAP: Record<string, string> = {
  "Lidia Ceferino":   "#D98C8C",  // coral suave
  "Victor Guevara":   "#D9A06F",  // naranja suave
  "Danilo Pena":      "#D6B85A",  // amarillo dorado
  "Eveling Lovera":   "#78B89A",  // verde salvia
  "Andres Espinoza":  "#6F9FCB",  // azul suave
  "Lisbeth Giron":    "#8585B8",  // indigo suave
  "Sheyla Guevara":   "#B08AB8",  // violeta/malva
};

/** Color para asesores no mapeados (nuevos asesores). */
export const ADVISOR_FALLBACK_COLOR = "#8585B8";

/** Conjunto de colores ordenados para iteracion (charts, paletas genericas). */
export const ADVISOR_COLORS = Object.values(COLOR_MAP);

/** Mapa original para lookup directo cuando el nombre ya esta normalizado. */
export const ADVISOR_COLOR_MAP = COLOR_MAP;

/**
 * Normaliza un nombre de asesor para comparacion:
 * - trim, lowercase, reemplaza underscores y multiples espacios.
 * - elimina acentos via NFD + strip combining marks.
 * - toma solo la primera palabra (nombre) como clave secundaria.
 */
function normalizeName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Obtiene el color de un asesor por su nombre. Busca primero por
 * nombre completo normalizado, luego solo por el primer nombre.
 * Es insensible a acentos, mayusculas/minusculas y espacios extra.
 */
export function getAdvisorColor(name: string): string {
  const q = normalizeName(name);
  if (!q) return ADVISOR_FALLBACK_COLOR;

  // Busqueda exacta normalizada
  for (const [key, color] of Object.entries(COLOR_MAP)) {
    if (normalizeName(key) === q) return color;
  }

  // Fallback: buscar por primer nombre
  const firstName = q.split(" ")[0];
  for (const [key, color] of Object.entries(COLOR_MAP)) {
    if (normalizeName(key).split(" ")[0] === firstName) return color;
  }

  return ADVISOR_FALLBACK_COLOR;
}

/** Verifica si un asesor tiene color asignado en el mapa oficial. */
export function hasAdvisorColor(name: string): boolean {
  const q = normalizeName(name);
  for (const key of Object.keys(COLOR_MAP)) {
    if (normalizeName(key) === q) return true;
  }
  return false;
}
