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

  it("backoff base (60 s) se activa tras 10 fallos; sin lockout permanente", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "6.6.6.6", "e@cope.pe");
    const b = intento(limiter, "6.6.6.6", "e@cope.pe");
    expect(b.res.statusCode).toBe(429);
    // A los 70 s sigue bloqueado: la ventana de cuenta (10 min) mantiene el conteo.
    vi.advanceTimersByTime(70_000);
    const b2 = intento(limiter, "6.6.6.6", "e@cope.pe");
    expect(b2.res.statusCode).toBe(429);
    // Tras superar la ventana deslizante de cuenta, se libera (sin lockout permanente).
    vi.advanceTimersByTime(11 * 60 * 1000);
    const l = intento(limiter, "6.6.6.6", "e@cope.pe");
    expect(l.nextCalled).toBe(true);
  });

  it("normaliza el email (trim + lowercase) para el bucket de cuenta", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, `7.0.0.${i}`, "  VICTIMA@COPE.PE ");
    const it = intento(limiter, "7.9.9.9", "victima@cope.pe");
    expect(it.res.statusCode).toBe(429);
  });

  it("10 fallos / 5 min por IP: bloquea el 11.º intento (aislado del bucket cuenta)", () => {
    const limiter = createLoginRateLimiter({ accountLimit: 1_000_000 });
    for (let i = 0; i < 10; i++) fallo(limiter, "14.14.14.14", "ip@cope.pe");
    const b = intento(limiter, "14.14.14.14", "ip@cope.pe");
    expect(b.res.statusCode).toBe(429);
    const otraIpMismoEmail = intento(limiter, "15.15.15.15", "ip@cope.pe");
    expect(otraIpMismoEmail.nextCalled).toBe(true);
  });

  it("30 fallos / 1 hora por IP: bloquea el 31.º intento y expira a la hora (aislado)", () => {
    const limiter = createLoginRateLimiter({ accountLimit: 1_000_000 });
    for (let i = 0; i < 30; i++) {
      fallo(limiter, "8.8.8.8", "f@cope.pe");
      vi.advanceTimersByTime(40_000); // espaciamos: la ventana 5 min nunca alcanza 10
    }
    const b = intento(limiter, "8.8.8.8", "f@cope.pe");
    expect(b.res.statusCode).toBe(429); // 30/1h activo (último fallo ≈ t=20 min)
    // Total ≈ 61 min desde el primer fallo: la ventana deslizante de 1 h libera.
    vi.advanceTimersByTime(41 * 60 * 1000);
    const l = intento(limiter, "8.8.8.8", "f@cope.pe");
    expect(l.nextCalled).toBe(true);
  });

  it("una respuesta 429 no incrementa los contadores", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 5; i++) fallo(limiter, "9.9.9.9", "g@cope.pe");
    const sim429 = intento(limiter, "9.9.9.9", "g@cope.pe");
    sim429.res.statusCode = 429;
    sim429.res.emit("finish");
    for (let i = 0; i < 4; i++) fallo(limiter, "9.9.9.9", "g@cope.pe");
    const it = intento(limiter, "9.9.9.9", "g@cope.pe");
    expect(it.nextCalled).toBe(true); // 9 fallos reales; el 429 no sumó
    fallo(limiter, "9.9.9.9", "g@cope.pe");
    const b = intento(limiter, "9.9.9.9", "g@cope.pe");
    expect(b.res.statusCode).toBe(429);
  });

  it("los buckets IP y cuenta son independientes", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "11.11.11.11", "indep@cope.pe");
    const otraCuentaMismaIP = intento(limiter, "11.11.11.11", "otra@cope.pe");
    expect(otraCuentaMismaIP.res.statusCode).toBe(429); // IP compartida entre cuentas
    const otraIPOtraCuenta = intento(limiter, "12.12.12.12", "otra@cope.pe");
    expect(otraIPOtraCuenta.nextCalled).toBe(true); // ni IP ni cuenta bloqueadas
    const mismaCuentaOtraIP = intento(limiter, "12.12.12.12", "indep@cope.pe");
    expect(mismaCuentaOtraIP.res.statusCode).toBe(429); // cuenta bloqueada, independiente de IP
  });

  it("el éxito NO resetea los fallos acumulados (comportamiento actual)", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 5; i++) fallo(limiter, "13.13.13.13", "reset@cope.pe");
    const ok = intento(limiter, "13.13.13.13", "reset@cope.pe");
    ok.res.statusCode = 200;
    ok.res.emit("finish");
    for (let i = 0; i < 5; i++) fallo(limiter, "13.13.13.13", "reset@cope.pe");
    const b = intento(limiter, "13.13.13.13", "reset@cope.pe");
    expect(b.res.statusCode).toBe(429); // 5 + 5 fallos persisten pese al éxito intermedio
  });
});