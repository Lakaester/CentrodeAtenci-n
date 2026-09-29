import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "events";
import { InMemoryRateLimitStore } from "../../core/security/rateLimit/RateLimitStore";
import { createLoginRateLimiter } from "../loginRateLimit.middleware";

function mockRes() {
  const res = new EventEmitter() as any;
  res.statusCode = 200;
  res.body = null;
  res.headers = {} as Record<string, string | undefined>;
  res.setHeader = function (k: string, v: string) {
    this.headers[k] = v;
  };
  res.getHeader = function (k: string) {
    return this.headers[k];
  };
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

function intento(limiter: any, ip: string, email: string, status = 200) {
  const req: any = { ip, body: { email, password: "x" } };
  const res = mockRes();
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };
  limiter(req, res, next);
  // Si el middleware dejó pasar (next), simulamos la respuesta del controller.
  // Si bloqueó (429), se conserva el status fijado por el propio middleware.
  if (nextCalled) res.statusCode = status;
  res.emit("finish");
  return { req, res, nextCalled };
}

function fallo(limiter: any, ip: string, email: string) {
  return intento(limiter, ip, email, 401);
}

function retryAfter(it: { res: any }): number {
  return Number(it.res.getHeader("Retry-After"));
}

describe("InMemoryRateLimitStore", () => {
  it("cuenta registros dentro de la ventana y omite los anteriores", () => {
    const store = new InMemoryRateLimitStore(60_000);
    const t = 1_000_000;
    store.record("k", t);
    store.record("k", t + 1_000);
    store.record("k", t + 70_000);
    expect(store.count("k", t + 70_000, 60_000)).toBe(1);
  });

  it("prune elimina registros, strikes y bloqueos vencidos", () => {
    const store = new InMemoryRateLimitStore(60_000);
    store.record("k", 1_000_000);
    store.setBlockedUntil("b", 2_000_000);
    store.nextStrike("s", 7);
    store.prune(2_100_000);
    expect(store.count("k", 2_100_000, 60_000)).toBe(0);
    expect(store.getBlockedUntil("b")).toBe(0);
    expect(store.getStrikes("s")).toBe(0);
  });

  it("nextStrike avanza con tope y resetStrikes/clear lo reinician", () => {
    const store = new InMemoryRateLimitStore();
    expect(store.nextStrike("k", 7)).toBe(1);
    expect(store.nextStrike("k", 7)).toBe(2);
    expect(store.nextStrike("k", 2)).toBe(2); // tope
    store.resetStrikes("k");
    expect(store.getStrikes("k")).toBe(0);
    store.nextStrike("k", 7);
    store.clear("k");
    expect(store.getStrikes("k")).toBe(0);
    expect(store.getBlockedUntil("k")).toBe(0);
  });

  it("timeUntilBelow devuelve el tiempo restante hasta bajar del límite", () => {
    const store = new InMemoryRateLimitStore();
    const t = 1_000_000;
    for (let i = 0; i < 10; i++) store.record("ip", t);
    // Límite 10, ventana 5 min: al instante t quedan 5 min (300 s).
    expect(store.timeUntilBelow("ip", t, 5 * 60_000, 10)).toBe(300_000);
    expect(store.timeUntilBelow("ip", t + 60_000, 5 * 60_000, 10)).toBe(240_000);
    expect(store.timeUntilBelow("ip", t, 5 * 60_000, 11)).toBe(0);
  });
});

describe("loginRateLimiter (política O3-B.5 + H-01..H-04)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T08:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("no cuenta un login exitoso (200)", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 15; i++) intento(limiter, "1.1.1.1", "a@cope.pe", 200);
    const it = intento(limiter, "1.1.1.1", "a@cope.pe", 200);
    expect(it.nextCalled).toBe(true);
    expect(it.res.statusCode).toBe(200);
  });

  it("no cuenta errores 5xx como fallos de autenticación", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 15; i++) intento(limiter, "2.2.2.2", "b@cope.pe", 500);
    const it = intento(limiter, "2.2.2.2", "b@cope.pe", 200);
    expect(it.nextCalled).toBe(true);
  });

  it("bloquea por IP tras 10 fallos en 5 minutos (11.º intento)", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "3.3.3.3", "c@cope.pe");
    const it = intento(limiter, "3.3.3.3", "c@cope.pe");
    expect(it.nextCalled).toBe(false);
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
      vi.advanceTimersByTime(40_000);
    }
    const b = intento(limiter, "8.8.8.8", "f@cope.pe");
    expect(b.res.statusCode).toBe(429);
    vi.advanceTimersByTime(41 * 60 * 1000);
    const l = intento(limiter, "8.8.8.8", "f@cope.pe");
    expect(l.nextCalled).toBe(true);
  });

  it("bloquea por cuenta aunque venga de IPs distintas", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, `10.0.0.${i}`, "victima@cope.pe");
    const it = intento(limiter, "10.9.9.9", "victima@cope.pe");
    expect(it.res.statusCode).toBe(429);
  });

  it("libera la cuenta tras pasar la ventana (sin lockout permanente)", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "5.5.5.5", "d@cope.pe");
    vi.advanceTimersByTime(11 * 60 * 1000);
    const it = intento(limiter, "5.5.5.5", "d@cope.pe");
    expect(it.nextCalled).toBe(true);
  });

  it("backoff base (60 s) se activa tras 10 fallos; sin lockout permanente", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "6.6.6.6", "e@cope.pe");
    const b = intento(limiter, "6.6.6.6", "e@cope.pe");
    expect(b.res.statusCode).toBe(429);
    vi.advanceTimersByTime(70_000);
    const b2 = intento(limiter, "6.6.6.6", "e@cope.pe");
    expect(b2.res.statusCode).toBe(429);
    vi.advanceTimersByTime(11 * 60 * 1000);
    const l = intento(limiter, "6.6.6.6", "e@cope.pe");
    expect(l.nextCalled).toBe(true);
  });

  it("H-02: el backoff progresa 60s→120s→240s→480s→960s→1920s→3600s (máx)", () => {
    const limiter = createLoginRateLimiter();
    const progress = [60, 120, 240, 480, 960, 1920, 3600];
    // 10 fallos desde IPs distintas (IP no bloquea) → strike 1 → 60 s.
    for (let i = 0; i < 10; i++) fallo(limiter, `p.0.0.${i}`, "prog@cope.pe");
    for (let s = 0; s < progress.length; s++) {
      const bloqueado = intento(limiter, "p.9.9.9", "prog@cope.pe");
      expect(bloqueado.res.statusCode).toBe(429);
      expect(bloqueado.nextCalled).toBe(false);
      expect(retryAfter(bloqueado)).toBe(progress[s]);
      // Espera a que termine el bloqueo vigente.
      vi.advanceTimersByTime(progress[s] * 1000 + 1000);
      if (s < progress.length - 1) {
        // Nuevo fallo real tras bloqueo servido → avanza el strike.
        fallo(limiter, `q.0.0.${s}`, "prog@cope.pe");
      }
    }
  });

  it("H-03: un 400 (payload inválido) no incrementa contadores", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) intento(limiter, "41.41.41.41", "h@cope.pe", 400);
    const it = intento(limiter, "41.41.41.41", "h@cope.pe");
    expect(it.nextCalled).toBe(true);
  });

  it("una respuesta 429 no incrementa los contadores", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 5; i++) fallo(limiter, "9.9.9.9", "g@cope.pe");
    const sim429 = intento(limiter, "9.9.9.9", "g@cope.pe", 429);
    for (let i = 0; i < 4; i++) fallo(limiter, "9.9.9.9", "g@cope.pe");
    const it = intento(limiter, "9.9.9.9", "g@cope.pe");
    expect(it.nextCalled).toBe(true);
    fallo(limiter, "9.9.9.9", "g@cope.pe");
    const b = intento(limiter, "9.9.9.9", "g@cope.pe");
    expect(b.res.statusCode).toBe(429);
  });

  it("los buckets IP y cuenta son independientes", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "11.11.11.11", "indep@cope.pe");
    const otraCuentaMismaIP = intento(limiter, "11.11.11.11", "otra@cope.pe");
    expect(otraCuentaMismaIP.res.statusCode).toBe(429);
    const otraIPOtraCuenta = intento(limiter, "12.12.12.12", "otra@cope.pe");
    expect(otraIPOtraCuenta.nextCalled).toBe(true);
    const mismaCuentaOtraIP = intento(limiter, "12.12.12.12", "indep@cope.pe");
    expect(mismaCuentaOtraIP.res.statusCode).toBe(429);
  });

  it("H-04 Test A: el éxito resetea la cuenta; el fallo posterior es de cuenta limpia", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 9; i++) fallo(limiter, `a.0.0.${i}`, "reset@cope.pe");
    const ok = intento(limiter, "a.9.9.9", "reset@cope.pe", 200); // éxito → clear cuenta
    expect(ok.nextCalled).toBe(true);
    fallo(limiter, "b.0.0.0", "reset@cope.pe"); // primer fallo de cuenta limpia
    const it = intento(limiter, "b.0.0.1", "reset@cope.pe", 401); // fallo → cuenta limpia (2 fallos)
    expect(it.nextCalled).toBe(true); // sin bloqueo: la cuenta partió limpia
    for (let i = 0; i < 8; i++) fallo(limiter, `c.0.0.${i}`, "reset@cope.pe"); // total 10 (1+1+8)
    const b = intento(limiter, "c.9.9.9", "reset@cope.pe");
    expect(b.res.statusCode).toBe(429); // episodio nuevo: 10 fallos → bloqueo
  });

  it("H-04 Test B: el éxito de cuenta X NO borra el historial de la IP", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 6; i++) fallo(limiter, "31.31.31.31", "x@cope.pe");
    intento(limiter, "31.31.31.31", "x@cope.pe", 200); // éxito cuenta X
    for (let i = 0; i < 4; i++) fallo(limiter, "31.31.31.31", "y@cope.pe");
    const it = intento(limiter, "31.31.31.31", "y@cope.pe");
    expect(it.res.statusCode).toBe(429); // IP conserva 10 fallos
  });

  it("H-04 Test C: el éxito NO elimina un estado de protección IP existente", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 9; i++) fallo(limiter, "32.32.32.32", "a@cope.pe");
    intento(limiter, "32.32.32.32", "a@cope.pe", 200); // éxito cuenta A
    fallo(limiter, "32.32.32.32", "a@cope.pe");
    const it = intento(limiter, "32.32.32.32", "a@cope.pe");
    expect(it.res.statusCode).toBe(429); // IP seguía en 9 fallos → llegó a 10
  });

  it("normaliza el email (trim + lowercase) para el bucket de cuenta", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, `7.0.0.${i}`, "  VICTIMA@COPE.PE ");
    const it = intento(limiter, "7.9.9.9", "victima@cope.pe");
    expect(it.res.statusCode).toBe(429);
  });

  it("H-01: el 429 incluye Retry-After entero, en segundos, >= 1", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, `r.0.0.${i}`, "retry@cope.pe");
    const b = intento(limiter, "r.9.9.9", "retry@cope.pe");
    expect(b.res.statusCode).toBe(429);
    const n = retryAfter(b);
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(1);
  });

  it("H-01: Retry-After corresponde al tiempo restante del bloqueo (60 s)", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, `t.0.0.${i}`, "time@cope.pe");
    const b = intento(limiter, "t.9.9.9", "time@cope.pe");
    const n = retryAfter(b);
    expect(n).toBeGreaterThanOrEqual(59);
    expect(n).toBeLessThanOrEqual(61);
  });

  it("H-01: con dos buckets bloqueando, se usa el bloqueo efectivo más largo", () => {
    const limiter = createLoginRateLimiter();
    for (let i = 0; i < 10; i++) fallo(limiter, "51.51.51.51", "long@cope.pe");
    const b = intento(limiter, "51.51.51.51", "long@cope.pe");
    // IP 5 min: 300 s restantes (todos los fallos en el mismo instante).
    // Cuenta: strike 1 → 60 s. Se usa el mayor → ~300 s.
    expect(retryAfter(b)).toBeGreaterThanOrEqual(299);
    expect(retryAfter(b)).toBeLessThanOrEqual(301);
  });
});