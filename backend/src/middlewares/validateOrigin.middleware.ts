import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { authService } from "../services/auth.service";

/**
 * CSRF-01 — Origin validation (O3-C.2).
 * Protege mutaciones autenticadas por cookie: POST/PUT/PATCH/DELETE + cookie
 * `cope_session` presente + header `Origin` presente y NO permitido → 403.
 *
 * Política aprobada:
 *   - Origin ausente            → ALLOW
 *   - Origin permitido          → ALLOW
 *   - Origin no permitido       → REJECT 403 FORBIDDEN_ORIGIN
 *   - Origin "null" / vacío     → REJECT (header presente ≠ ausencia)
 *   - múltiples headers Origin  → REJECT (array, nunca válido)
 *
 * Comparación: trim → toLowerCase → exact match contra allowlist (CORS_ORIGIN,
 * misma fuente de verdad que CORS). Prohibido startsWith/includes/endsWith/regex.
 * Solo operaciones locales en memoria; sin DB/bcrypt/Redis/I/O.
 */

type OriginHeader = string | string[] | undefined;

const METODOS_MUTANTES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizarAllowlist(valor: string): string {
  return valor.trim().toLowerCase().replace(/\/$/, "");
}

function normalizarOrigin(valor: string): string {
  return valor.trim().toLowerCase();
}

function tieneCookie(req: Request, nombre: string): boolean {
  const raw = req.headers.cookie;
  if (!raw) return false;
  return raw.split(";").some((part) => {
    const clave = part.trim().split("=")[0];
    return clave === nombre;
  });
}

function rechazar(req: Request, res: Response, method: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[SECURITY] origin-rejected: method=${method} path=${req.originalUrl ?? req.url} origin_category=not_allowed`);
  res.status(403).json({ ok: false, error: "Origen no autorizado.", code: "FORBIDDEN_ORIGIN" });
}

export function createValidateOrigin(allowlist?: string[]) {
  const permitidos = new Set(
    (allowlist ?? env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)).map(normalizarAllowlist),
  );

  return function validateOrigin(req: Request, res: Response, next: NextFunction): void {
    const method = req.method;
    if (!METODOS_MUTANTES.has(method)) return next();
    if (!tieneCookie(req, authService.COOKIE_NAME)) return next();

    const origin = req.headers.origin as OriginHeader;
    if (origin === undefined) return next(); // Origin ausente → ALLOW (decisión aprobada)
    if (Array.isArray(origin)) return rechazar(req, res, method); // múltiples → REJECT
    if (!permitidos.has(normalizarOrigin(origin))) return rechazar(req, res, method); // null/vacío/malformado/no permitido

    next();
  };
}

export const validateOrigin = createValidateOrigin();