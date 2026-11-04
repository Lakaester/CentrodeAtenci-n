import { Prisma } from "@prisma/client";

/**
 * Identificación de clientes del reporte Clientes.
 *
 * Regla:
 * 1. Dominio normalizado y válido.
 * 2. Fallback: dominio corporativo del correo del solicitante en Zendesk.
 * 3. Correos personales, teléfonos y dominios malformados no se convierten en clientes.
 *
 * La misma clave se usa en todas las consultas del reporte para que los totales
 * del resumen, el explorador y los tickets sean reconciliables.
 */

export const SIN_IDENTIFICAR_KEY = "__sin_identificar__";
export const SIN_IDENTIFICAR_LABEL = "No identificados";

export const PROVEEDORES_GRATUITOS = [
  "gmail.com",
  "gmail.pe",
  "hotmail.com",
  "hotmail.es",
  "hotmail.pe",
  "outlook.com",
  "outlook.es",
  "yahoo.com",
  "yahoo.es",
  "yahoo.com.pe",
  "live.com",
  "icloud.com",
];

/** Dominio normalizado; mismo criterio que N_DOMINIO_COALESCE. */
export const DOMINIO_NORMALIZADO = Prisma.sql`COALESCE(NULLIF(LOWER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dominio), '^[[:space:]]*https?://', ''), '/.*$', ''), '#.*$', ''), '[?].*$', ''), '[.]\\s*$', '')), ''), '—')`;

const INVALIDOS_SQL = Prisma.sql`('—', '0', '-', 'sin dominio', 'sindominio', 'sinlocal', 'informativo', 'inforamativo', 'ttp:')`;

/** Dominio con forma válida: punto, TLD >= 2, sin @ y sin valores técnicos. */
export const DOMINIO_VALIDO = Prisma.sql`(
  ${DOMINIO_NORMALIZADO} ~ '^[a-z0-9][a-z0-9.-]*\\.[a-z]{2,}$'
  AND ${DOMINIO_NORMALIZADO} !~ '@'
  AND ${DOMINIO_NORMALIZADO} NOT IN ${INVALIDOS_SQL}
)`;

/** Dominio del correo disponible en `numero` (Zendesk). */
export const DOMINIO_CORREO = Prisma.sql`LOWER(SPLIT_PART(TRIM(numero), '@', 2))`;

const DOMINIO_CORREO_VALIDO = Prisma.sql`(
  subcanal = 'ZENDESK'
  AND numero LIKE '%@%'
  AND ${DOMINIO_CORREO} ~ '^[a-z0-9][a-z0-9.-]*\\.[a-z]{2,}$'
  AND ${DOMINIO_CORREO} NOT IN (${Prisma.join(PROVEEDORES_GRATUITOS)})
)`;

/** Clave única de cliente. */
export const CLIENTE_KEY = Prisma.sql`CASE
  WHEN ${DOMINIO_VALIDO} THEN ${DOMINIO_NORMALIZADO}
  WHEN ${DOMINIO_CORREO_VALIDO} THEN ${DOMINIO_CORREO}
  ELSE ${SIN_IDENTIFICAR_KEY}
END`;

/** Nombre visible del cliente. */
export const CLIENTE_NOMBRE = Prisma.sql`CASE
  WHEN ${CLIENTE_KEY} = ${SIN_IDENTIFICAR_KEY} THEN ${SIN_IDENTIFICAR_LABEL}
  ELSE ${CLIENTE_KEY}
END`;

/** true si el cliente se identificó por el correo de Zendesk. */
export const IDENTIFICADO_POR_CORREO = Prisma.sql`(
  NOT ${DOMINIO_VALIDO} AND ${DOMINIO_CORREO_VALIDO}
)`;

/* ─── Equivalentes en TypeScript para validaciones y exportación ─── */

const VALIDO_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/;
const INVALIDOS = new Set([
  "—",
  "0",
  "-",
  "sin dominio",
  "sindominio",
  "sinlocal",
  "informativo",
  "inforamativo",
  "ttp:",
]);

export function normalizarDominio(dominio: string | null | undefined): string {
  if (!dominio) return "—";
  const v = dominio
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/#.*$/, "")
    .replace(/\?.*$/, "")
    .replace(/[.]\s*$/, "")
    .toLowerCase();
  return v || "—";
}

export function esDominioValido(dominio: string | null | undefined): boolean {
  const d = normalizarDominio(dominio);
  return VALIDO_RE.test(d) && !d.includes("@") && !INVALIDOS.has(d);
}

export function claveCliente(row: {
  dominio: string | null | undefined;
  numero: string | null | undefined;
  subcanal: string | null | undefined;
}): string {
  const dom = normalizarDominio(row.dominio);
  if (esDominioValido(dom)) return dom;
  const subcanal = (row.subcanal ?? "").trim().toUpperCase();
  const numero = (row.numero ?? "").trim();
  if (subcanal === "ZENDESK" && numero.includes("@")) {
    const emailDom = numero.split("@")[1]?.trim().toLowerCase() ?? "";
    if (VALIDO_RE.test(emailDom) && !PROVEEDORES_GRATUITOS.includes(emailDom)) {
      return emailDom;
    }
  }
  return SIN_IDENTIFICAR_KEY;
}

export function nombreCliente(clave: string): string {
  return clave === SIN_IDENTIFICAR_KEY ? SIN_IDENTIFICAR_LABEL : clave;
}
