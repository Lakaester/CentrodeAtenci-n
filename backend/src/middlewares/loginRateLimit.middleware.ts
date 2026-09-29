import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { InMemoryRateLimitStore } from "../core/security/rateLimit/RateLimitStore";

/**
 * Política de login rate limiting aprobada (O3-B.5).
 * Dos buckets independientes (NO combinados en una sola key):
 *   A) IP: 10 fallos / 5 min y 30 fallos / 1 h.
 *   B) Cuenta (email normalizado, key = SHA-256): 10 fallos / ventana progresiva + backoff.
 * Solo se cuentan FALLOS de autenticación (respuestas 4xx de POST /auth/login).
 * No se cuentan: login exitoso, requests normales, logout, /auth/me, ni 5xx.
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

function normalizarEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function bucketDeCuenta(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

function demasiadas(res: Response): void {
  res.status(429).json({
    ok: false,
    error: "Demasiados intentos de inicio de sesión. Intente nuevamente en unos minutos.",
    code: "LOGIN_RATE_LIMIT_EXCEEDED",
    type: "infrastructure",
    timestamp: new Date().toISOString(),
  });
}

export function createLoginRateLimiter(opts?: Partial<LoginRateLimitOptions>) {
  const cfg: LoginRateLimitOptions = { ...DEFAULTS, ...opts };
  const store = new InMemoryRateLimitStore(cfg.retentionMs);

  return function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    store.prune(now - cfg.retentionMs);

    // Bucket A — IP (dos ventanas independientes).
    const ip = req.ip ?? "unknown";
    if (store.count(ip, now, cfg.ipWindow5m) >= cfg.ipLimit5m) return demasiadas(res);
    if (store.count(ip, now, cfg.ipWindow1h) >= cfg.ipLimit1h) return demasiadas(res);

    // Bucket B — Cuenta (email normalizado → SHA-256), con backoff progresivo.
    const email = normalizarEmail(req.body?.email);
    if (email) {
      const cuentaKey = bucketDeCuenta(email);
      if (store.getBlockedUntil(cuentaKey) > now) return demasiadas(res);
      if (store.count(cuentaKey, now, cfg.accountWindow) >= cfg.accountLimit) return demasiadas(res);
    }

    // Cuenta SOLO fallos de autenticación (4xx distintos de 429; los 5xx no son fallos).
    res.on("finish", () => {
      const status = res.statusCode;
      if (status < 400 || status >= 500 || status === 429) return;
      const at = Date.now();
      store.record(ip, at);
      if (!email) return;
      const cuentaKey = bucketDeCuenta(email);
      store.record(cuentaKey, at);
      const fallos = store.count(cuentaKey, at, cfg.accountWindow);
      if (fallos >= cfg.accountLimit) {
        const exceso = fallos - cfg.accountLimit + 1;
        const duracion = Math.min(cfg.backoffBaseMs * Math.pow(2, exceso - 1), cfg.backoffMaxMs);
        store.setBlockedUntil(cuentaKey, at + duracion);
      }
    });

    next();
  };
}

export const loginRateLimiter = createLoginRateLimiter();