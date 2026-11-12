/**
 * Reglas de dominio para Quejas y Devoluciones (QyD).
 *
 * Un expediente QyD puede originarse en un ticket sin dominio utilizable. En
 * ese caso se persiste el valor explícito `SIN DOMINIO` y se conserva el valor
 * original para auditoría. No se aceptan correos ni placeholders como dominio.
 *
 * Este módulo es neutral (no importa servicios ni repositorios) para que pueda
 * ser usado por el repositorio y por los servicios sin crear ciclos.
 */
import { isValidDomainFormat, normalizeDomain } from "./normalizacion";

/** Valor explícito permitido por `qd_casos.dominio` (columna TEXT sin CHECK). */
export const DOMINIO_SIN_DOMINIO = "SIN DOMINIO";

/** Estado textual solicitado para expedientes creados sin dominio. */
export const ESTADO_CERRADO = "CERRADO";

const PLACEHOLDERS_EXACTOS = new Set([
  "sin dominio",
  "sindominio",
  "sinlocal",
  "s/d",
  "s/d.",
  "sd",
  "n/a",
  "na",
  "null",
  "undefined",
  "ninguno",
  "ninguna",
  "no aplica",
  "noaplica",
  "no definido",
  "no-definido",
  "pendiente",
  "por definir",
  "dominio no disponible",
  "-",
  "--",
]);

const PREFIJOS_PLACEHOLDER = [
  "sinlocal",
  "sindominio",
  "sin-dominio",
  "sin_dominio",
  "nodomain",
  "no-domain",
  "no_domain",
];

export type MotivoDominioQyd =
  | "VALIDO"
  | "AUSENTE"
  | "EMAIL"
  | "PLACEHOLDER"
  | "FORMATO_INVALIDO";

export interface DominioQydResuelto {
  /** Dominio canónico o `SIN DOMINIO`. Nunca null. */
  dominio: string;
  sinDominio: boolean;
  /** Valor crudo recibido, conservado para auditoría. */
  original: string | null;
  motivo: MotivoDominioQyd;
}

export function esDominioSinDominio(valor: string | null | undefined): boolean {
  return (valor ?? "").trim().toUpperCase() === DOMINIO_SIN_DOMINIO;
}

function normalizarTexto(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function esDominioPlaceholder(valor: string | null | undefined): boolean {
  const raw = (valor ?? "").trim();
  if (!raw) return false;
  const texto = normalizarTexto(raw);
  if (PLACEHOLDERS_EXACTOS.has(texto)) return true;
  if (texto.includes("sin dominio")) return true;
  const host = normalizeDomain(raw);
  if (!host) return false;
  const primerEtiqueta = host.split(".")[0] ?? "";
  return PREFIJOS_PLACEHOLDER.some(
    (p) => host === p || primerEtiqueta === p || host.startsWith(`${p}.`),
  );
}

/**
 * Clasifica el dominio de un ticket QyD y devuelve el valor a persistir.
 *
 * - Dominio real → se normaliza (solo hostname).
 * - Ausente, correo, placeholder o formato inválido → `SIN DOMINIO`.
 * - `SIN DOMINIO` recibido explícitamente → se conserva como tal.
 *
 * No lanza excepciones: la regla de negocio es crear/reutilizar el expediente,
 * no bloquearlo por falta de dominio.
 */
export function resolverDominioQyd(valor: string | null | undefined): DominioQydResuelto {
  const raw = valor == null ? "" : String(valor).trim();
  if (!raw) {
    return { dominio: DOMINIO_SIN_DOMINIO, sinDominio: true, original: null, motivo: "AUSENTE" };
  }
  if (esDominioSinDominio(raw)) {
    return { dominio: DOMINIO_SIN_DOMINIO, sinDominio: true, original: raw, motivo: "PLACEHOLDER" };
  }
  if (raw.includes("@")) {
    return { dominio: DOMINIO_SIN_DOMINIO, sinDominio: true, original: raw, motivo: "EMAIL" };
  }
  if (esDominioPlaceholder(raw)) {
    return { dominio: DOMINIO_SIN_DOMINIO, sinDominio: true, original: raw, motivo: "PLACEHOLDER" };
  }
  if (!isValidDomainFormat(raw)) {
    return { dominio: DOMINIO_SIN_DOMINIO, sinDominio: true, original: raw, motivo: "FORMATO_INVALIDO" };
  }
  return {
    dominio: normalizeDomain(raw),
    sinDominio: false,
    original: raw,
    motivo: "VALIDO",
  };
}
