import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "events";
import { InMemoryRateLimitStore } from "../../core/security/rateLimit/RateLimitStore";
import { createLoginRateLimiter } from "../loginRateLimit.middleware";

function mockRes() {
  const res = new EventEmitter() as any;
  res.statusCode = 200;
  res.body = null;
  res.status = function (c: number) {
    this.statusCode = c;
    return this;
  };
  res.json = function (b: unknown) {
    this.body = b;
    return this;
  };
  return res;
}

function intento(limiter: any, ip: string, email: string) {
  const req: any = { ip, body: { email, password: "x" } };
  const res = mockRes();
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };
  limiter(req, res, next);
  return { req, res, nextCalled };
}

function fallo(limiter: any, ip: string, email: string) {
  const it = intento(limiter, ip, email);
  it.res.statusCode = 401;
  it.res.emit("finish");
  return it;
}

describe("InMemoryRateLimitStore", () => {
  it("cuenta registros dentro de la ventana y omite los anteriores", () => {
    const store = new InMemoryRateLimitStore(60_000);
    const t = 1_000_000;
    store.record("k", t);
    store.record("k", t + 1_000);
    store.record("k", t + 70_000); // fuera de la ventana de 60s
    expect(store.count("k", t + 70_000, 60_000)).toBe(1);
  });

  it("prune elimina registros y bloqueos vencidos", () => {
    const store = new InMemoryRateLimitStore(60_000);
    store.record("k", 1_000_000);
    store.setBlockedUntil("b", 2_000_000);
    store.prune(2_100_000);
    expect(store.count("k", 2_100_000, 60_000)).toBe(0);
    expect(store.getBlockedUntil("b")).toBe(0);
  });
});

describe("loginRateLimiter (política O3-B.5)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T08:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("no cuenta un login exitoso (200)", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 15; i++) {
      const it = intento(limiter, "1.1.1.1", "a@cope.pe");
      it.res.statusCode = 200;
      it.res.emit("finish");
    }
    const it = intento(limiter, "1.1.1.1", "a@cope.pe");
    expect(it.nextCalled).toBe(true);
    expect(it.res.statusCode).toBe(200);
  });

  it("no cuenta errores 5xx como fallos de autenticación", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 15; i++) {
      const it = intento(limiter, "2.2.2.2", "b@cope.pe");
      it.res.statusCode = 500;
      it.res.emit("finish");
    }
    const it = intento(limiter, "2.2.2.2", "b@cope.pe");
    expect(it.nextCalled).toBe(true);
  });

  it("bloquea por IP tras 10 fallos en 5 minutos", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "3.3.3.3", "c@cope.pe");
    const it = intento(limiter, "3.3.3.3", "c@cope.pe");
    expect(it.nextCalled).toBe(false);
    expect(it.res.statusCode).toBe(429);
  });

  it("bloquea por cuenta aunque venga de IPs distintas", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, `10.0.0.${i}`, "victima@cope.pe");
    const it = intento(limiter, "10.9.9.9", "victima@cope.pe");
    expect(it.nextCalled).toBe(false);
    expect(it.res.statusCode).toBe(429);
  });

  it("libera la cuenta tras pasar la ventana (sin lockout permanente)", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "5.5.5.5", "d@cope.pe");
    // Avanza más allá de la ventana de cuenta (10 min) y del backoff base.
    vi.advanceTimersByTime(11 * 60 * 1000);
    const it = intento(limiter, "5.5.5.5", "d@cope.pe");
    expect(it.nextCalled).toBe(true);
  });

  it("aplica backoff progresivo: el bloqueo se extiende con más fallos", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "6.6.6.6", "e@cope.pe");
    // Sigue fallando (no pasa por next): 11.º y 12.º fallo registrados.
    for (let i = 0; i < 2; i++) fallo(limiter, "6.6.6.6", "e@cope.pe");
    // El bloqueo base es 60s (exceso 1) y luego 120s (exceso 2).
    vi.advanceTimersByTime(90 * 1000);
    const it = intento(limiter, "6.6.6.6", "e@cope.pe");
    expect(it.nextCalled).toBe(false);
  });

  it("normaliza el email (trim + lowercase) para el bucket de cuenta", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, `7.0.0.${i}`, "  VICTIMA@COPE.PE ");
    const it = intento(limiter, "7.9.9.9", "victima@cope.pe");
    expect(it.res.statusCode).toBe(429);
  });
});