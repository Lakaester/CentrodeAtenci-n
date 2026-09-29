import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import express from "express";
import http from "http";
import { createValidateOrigin } from "../validateOrigin.middleware";

const PERMITIDOS = ["https://app.example.com", "http://localhost:5173"];

function makeLimiter() {
  return createValidateOrigin(PERMITIDOS);
}

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

function run(limiter: any, req: any) {
  const res = mockRes();
  let nextCalled = false;
  limiter(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

function req(opts: { method?: string; cookie?: boolean; origin?: string | string[] | undefined }) {
  const headers: Record<string, string | string[]> = {};
  if (opts.cookie) headers.cookie = "cope_session=abc; otro=x";
  if (opts.origin !== undefined) headers.origin = opts.origin;
  return { method: opts.method ?? "POST", headers };
}

describe("validateOrigin — CSRF-01 (Origin validation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T1. POST + cookie + Origin permitido → ALLOW", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(limiter, req({ cookie: true, origin: "https://app.example.com" }));
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(200);
  });

  it("T2. PATCH + cookie + Origin permitido → ALLOW", () => {
    const limiter = makeLimiter();
    const { nextCalled } = run(limiter, req({ method: "PATCH", cookie: true, origin: "http://localhost:5173" }));
    expect(nextCalled).toBe(true);
  });

  it("T3. DELETE + cookie + Origin permitido → ALLOW", () => {
    const limiter = makeLimiter();
    const { nextCalled } = run(limiter, req({ method: "DELETE", cookie: true, origin: "https://app.example.com" }));
    expect(nextCalled).toBe(true);
  });

  it("T4. POST + cookie + Origin atacante → 403 FORBIDDEN_ORIGIN", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(limiter, req({ cookie: true, origin: "https://attacker.example" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ ok: false, error: "Origen no autorizado.", code: "FORBIDDEN_ORIGIN" });
  });

  it("T5. PATCH + cookie + Origin atacante → 403", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(limiter, req({ method: "PATCH", cookie: true, origin: "https://attacker.example" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("T6. DELETE + cookie + Origin atacante → 403", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(limiter, req({ method: "DELETE", cookie: true, origin: "https://attacker.example" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("T7. POST + cookie + Origin ausente → ALLOW (decisión)", () => {
    const limiter = makeLimiter();
    const { nextCalled } = run(limiter, req({ cookie: true, origin: undefined }));
    expect(nextCalled).toBe(true);
  });

  it("T8. POST + cookie + Origin null → 403", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(limiter, req({ cookie: true, origin: "null" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("T9. POST + cookie + Origin vacío → 403", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(limiter, req({ cookie: true, origin: "" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("T10. POST + cookie + Origin malformado → 403", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(limiter, req({ cookie: true, origin: "no-es-un-origin" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("T11. POST + cookie + múltiples Origin (array) → 403", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(
      limiter,
      req({ cookie: true, origin: ["https://app.example.com", "https://attacker.example"] }),
    );
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("T12. POST + cookie + Origin case-insensitive → ALLOW", () => {
    const limiter = makeLimiter();
    const { nextCalled } = run(limiter, req({ cookie: true, origin: "HTTPS://APP.EXAMPLE.COM" }));
    expect(nextCalled).toBe(true);
  });

  it("T13. POST + cookie + subdomain masquerade → 403", () => {
    const limiter = makeLimiter();
    const { nextCalled, res } = run(limiter, req({ cookie: true, origin: "https://app.example.com.attacker.com" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("T14. Authorization Bearer-only (sin cookie) + Origin atacante → sin regresión", () => {
    const limiter = makeLimiter();
    const reqMock: any = {
      method: "POST",
      headers: { authorization: "Bearer xyz", origin: "https://attacker.example" },
    };
    const { nextCalled } = run(limiter, reqMock);
    expect(nextCalled).toBe(true); // fuera de scope (sin cookie)
  });

  it("T15. Endpoint público (sin cookie) + Origin atacante → sin regresión", () => {
    const limiter = makeLimiter();
    const { nextCalled } = run(limiter, req({ origin: "https://attacker.example" }));
    expect(nextCalled).toBe(true);
  });

  it("T16. OPTIONS (sin validación) → next", () => {
    const limiter = makeLimiter();
    const { nextCalled } = run(limiter, req({ method: "OPTIONS", cookie: true, origin: "https://attacker.example" }));
    expect(nextCalled).toBe(true);
  });

  it("T17. GET (sin validación) → next", () => {
    const limiter = makeLimiter();
    const { nextCalled } = run(limiter, req({ method: "GET", cookie: true, origin: "https://attacker.example" }));
    expect(nextCalled).toBe(true);
  });

  it("Bypass negativos (spec §25): todos rechazados si no están en la allowlist", () => {
    const limiter = makeLimiter();
    const malos = [
      "https://trusted.example.attacker.com",
      "https://attacker.com/https://trusted.example",
      "https://trusted.example.evil.test",
      "http://app.example.com",
      "https://app.example.com:444",
      "https://app.example.com/",
      "https://APP.EXAMPLE.COM.ATTACKER.COM",
    ];
    for (const o of malos) {
      const { nextCalled, res } = run(limiter, req({ cookie: true, origin: o }));
      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
    }
  });
});

describe("validateOrigin — integración (controller NO ejecutado / side-effect NO modificado)", () => {
  it("T18/T19. POST mutante con Origin atacante → 403 y el controller NO se ejecuta (side-effect intacto)", async () => {
    const limiter = createValidateOrigin(["https://app.example.com"]);
    const app = express();
    const state = { ejecuciones: 0 };
    app.use(limiter);
    app.post("/mutacion", (_req, res) => {
      state.ejecuciones++;
      res.json({ ok: true });
    });
    const server = http.createServer(app);
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
    const port = (server.address() as { port: number }).port;
    try {
      const base = `http://127.0.0.1:${port}`;
      const ok = await fetch(`${base}/mutacion`, {
        method: "POST",
        headers: { Cookie: "cope_session=abc", Origin: "https://app.example.com" },
      });
      expect(ok.status).toBe(200);
      expect(state.ejecuciones).toBe(1);
      const rej = await fetch(`${base}/mutacion`, {
        method: "POST",
        headers: { Cookie: "cope_session=abc", Origin: "https://attacker.example" },
      });
      expect(rej.status).toBe(403);
      expect(await rej.json()).toEqual({ ok: false, error: "Origen no autorizado.", code: "FORBIDDEN_ORIGIN" });
      expect(state.ejecuciones).toBe(1); // controller NO ejecutado → side-effect intacto
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});