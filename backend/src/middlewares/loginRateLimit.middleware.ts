import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { InMemoryRateLimitStore } from "../core/security/rateLimit/RateLimitStore";

/**
 * Política de login rate limiting aprobada (O3-B.5) con correcciones
 * O3-B.5-AUDIT-1 (H-01 Retry-After, H-02 backoff progresivo, H-03 solo 401/403,
 * H-04 reset por éxito de la cuenta preservando el bucket IP).
 *
 * Dos buckets independientes (NO combinados en una sola key):
 *   A) IP: 10 fallos / 5 min y 30 fallos / 1 h.
 *   B) Cuenta (email normalizado, key = SHA-256): failure counter (10/ventana) +
 *      strike/backoff progresivo 60s→3600s.
 *
 * Solo cuentan fallos reales de autenticación (401/403). No cuentan: 2xx, 400,
 * 429, 5xx, logout, /auth/me ni tráfico normal.
 * El 429 incluye `Retry-After` (segundos) correspondiente al bloqueo efectivo
 * más largo entre los buckets aplicables, sin revelar cuál lo originó.
 * Sliding window sobre marcas de tiempo; sin Redis (single-instance).
 */
export interface LoginRateLimitOptions {
  ipWindow5m: number;
  ipLimit5m: number;
  ipWindow1h: number;
  ipLimit1h: number;
  accountWindow: number;
  accountLimit: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
  retentionMs: number;
}

const DEFAULTS: LoginRateLimitOptions = {
  ipWindow5m: 5 * 60 * 1000,
  ipLimit5m: 10,
  ipWindow1h: 60 * 60 * 1000,
  ipLimit1h: 30,
  accountWindow: 10 * 60 * 1000,
  accountLimit: 10,
  backoffBaseMs: 60 * 1000,
  backoffMaxMs: 60 * 60 * 1000,
  retentionMs: 60 * 60 * 1000,
};

/** Nivel máximo de strike (60s→120s→240s→480s→960s→1920s→3600s). */
const MAX_STRIKES = 7;

function normalizarEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function bucketDeCuenta(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

function duracionBackoff(baseMs: number, strikes: number, maxMs: number): number {
  return Math.min(baseMs * Math.pow(2, strikes - 1), maxMs);
}

export function createLoginRateLimiter(opts?: Partial<LoginRateLimitOptions>) {
  const cfg: LoginRateLimitOptions = { ...DEFAULTS, ...opts };
  const store = new InMemoryRateLimitStore(cfg.retentionMs);

  /** Milisegundos restantes del bloqueo efectivo más largo entre los buckets aplicables. */
  function tiempoRestante(now: number, ip: string, cuentaKey: string | null): number {
    let remaining = store.timeUntilBelow(ip, now, cfg.ipWindow5m, cfg.ipLimit5m);
    remaining = Math.max(remaining, store.timeUntilBelow(ip, now, cfg.ipWindow1h, cfg.ipLimit1h));
    if (cuentaKey) {
      const blocked = store.getBlockedUntil(cuentaKey);
      if (blocked > now) remaining = Math.max(remaining, blocked - now);
    }
    return remaining;
  }

  function bloquear(req: Request, res: Response, now: number, cuentaKey: string | null): void {
    const ip = req.ip ?? "unknown";
    const remaining = tiempoRestante(now, ip, cuentaKey);
    const retryAfter = Math.max(1, Math.ceil(remaining / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      ok: false,
      error: "Demasiados intentos de inicio de sesión. Intente nuevamente en unos minutos.",
      code: "LOGIN_RATE_LIMIT_EXCEEDED",
      type: "infrastructure",
      timestamp: new Date().toISOString(),
    });
  }

  return function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    store.prune(now - cfg.retentionMs);

    const ip = req.ip ?? "unknown";
    const email = normalizarEmail(req.body?.email);
    const cuentaKey = email ? bucketDeCuenta(email) : null;

    // Pre-check de bloqueos vigentes (IP por ventana; cuenta por strike/backoff).
    if (store.count(ip, now, cfg.ipWindow5m) >= cfg.ipLimit5m) return bloquear(req, res, now, cuentaKey);
    if (store.count(ip, now, cfg.ipWindow1h) >= cfg.ipLimit1h) return bloquear(req, res, now, cuentaKey);
    if (cuentaKey && store.getBlockedUntil(cuentaKey) > now) return bloquear(req, res, now, cuentaKey);

    res.on("finish", () => {
      const status = res.statusCode;
      const at = Date.now();

      // H-04: éxito → reset del estado de la cuenta (fallos, strikes, bloqueo).
      // El bucket IP se preserva (protege a múltiples cuentas).
      if (status >= 200 && status < 300) {
        if (cuentaKey) store.clear(cuentaKey);
        return;
      }

      // H-03: solo fallos reales de autenticación (401/403). 400/429/5xx no cuentan.
      if (status !== 401 && status !== 403) return;

      store.record(ip, at);
      if (!cuentaKey) return;

      store.record(cuentaKey, at);
      const prior = store.getStrikes(cuentaKey);
      const inWindow = store.count(cuentaKey, at, cfg.accountWindow);
      // Primer episodio: se requiere acumular `accountLimit` fallos en la ventana.
      // Episodio en curso: cada fallo real tras un bloqueo servido avanza el strike (H-02).
      const trigger = prior > 0 ? true : inWindow >= cfg.accountLimit;
      if (trigger) {
        const strikes = store.nextStrike(cuentaKey, MAX_STRIKES);
        const duration = duracionBackoff(cfg.backoffBaseMs, strikes, cfg.backoffMaxMs);
        store.setBlockedUntil(cuentaKey, at + duration);
      }
    });

    next();
  };
}

export const loginRateLimiter = createLoginRateLimiter();