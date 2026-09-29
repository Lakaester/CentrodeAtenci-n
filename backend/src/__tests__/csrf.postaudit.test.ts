import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import express from "express";
import http from "http";
import { createValidateOrigin } from "../middlewares/validateOrigin.middleware";

const PERMITIDOS = ["https://app.example.com", "http://localhost:5173"];

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

function reqBase(opts: { method?: string; cookie?: boolean; origin?: string | string[] | undefined; auth?: string }) {
  const headers: Record<string, string | string[]> = {};
  if (opts.cookie) headers.cookie = "cope_session=abc; otro=x";
  if (opts.origin !== undefined) headers.origin = opts.origin;
  if (opts.auth) headers.authorization = opts.auth;
  return { method: opts.method ?? "POST", headers };
}

describe("O3-D.2 post-audit — bypasses y edges (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("A2. login: POST sin cookie + Origin atacante → se permite (login no bloqueado)", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    const { nextCalled, res } = run(limiter, reqBase({ origin: "https://attacker.example" }));
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(200);
  });

  it("A3. logout: POST con cookie + Origin permitido → allow; Origin atacante → 403", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    const ok = run(limiter, reqBase({ cookie: true, origin: "https://app.example.com" }));
    expect(ok.nextCalled).toBe(true);
    const bad = run(limiter, reqBase({ cookie: true, origin: "https://attacker.example" }));
    expect(bad.nextCalled).toBe(false);
    expect(bad.res.statusCode).toBe(403);
  });

  it("A6. múltiples Origin (array) → 403", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    const { nextCalled, res } = run(
      limiter,
      reqBase({ cookie: true, origin: ["https://app.example.com", "https://attacker.example"] }),
    );
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("A7. subdomain masquerade → 403", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    for (const o of ["https://app.example.com.attacker.com", "https://attacker-app.example.com", "https://app.example.com.evil.test"]) {
      const { nextCalled, res } = run(limiter, reqBase({ cookie: true, origin: o }));
      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
    }
  });

  it("A8. protocol mismatch (http vs https) → 403", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    const { nextCalled, res } = run(limiter, reqBase({ cookie: true, origin: "http://app.example.com" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("A9. port mismatch → 403", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    for (const o of ["https://app.example.com:443", "https://app.example.com:8443"]) {
      const { nextCalled, res } = run(limiter, reqBase({ cookie: true, origin: o }));
      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
    }
  });

  it("A10. Bearer-only (sin cookie) + Origin atacante → sin bloqueo", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    const { nextCalled } = run(limiter, reqBase({ auth: "Bearer xyz", origin: "https://attacker.example" }));
    expect(nextCalled).toBe(true);
  });

  it("A11. público (sin cookie) + Origin atacante → sin bloqueo", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    const { nextCalled } = run(limiter, reqBase({ origin: "https://attacker.example" }));
    expect(nextCalled).toBe(true);
  });

  it("A12. OPTIONS con cookie + Origin atacante → sin bloqueo (preflight intacto)", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    const { nextCalled } = run(limiter, reqBase({ method: "OPTIONS", cookie: true, origin: "https://attacker.example" }));
    expect(nextCalled).toBe(true);
  });

  it("A13. cookie parsing edge cases (sin bypass)", () => {
    const limiter = createValidateOrigin(PERMITIDOS);
    const casos = [
      { cookie: "cope_session", esperado: true }, // nombre sin valor → presente (más estricto, sin bypass)
      { cookie: "cope_session=", esperado: true }, // valor vacío → presente
      { cookie: "cope_session = abc", esperado: false }, // espacios alrededor de "=" → no presente (consistente con requireAuth)
      { cookie: "COPE_SESSION=abc", esperado: false }, // case-sensitive
      { cookie: "xcope_session=abc", esperado: false }, // prefijo no coincide
      { cookie: "cope_session_extra=abc", esperado: false }, // sufijo no coincide
      { cookie: "foo=1; cope_session=abc; bar=2", esperado: true }, // presente entre otras
    ];
    for (const c of casos) {
      const req: any = { method: "POST", headers: { cookie: c.cookie, origin: "https://attacker.example" } };
      const { nextCalled, res } = run(limiter, req);
      if (c.esperado) {
        expect(nextCalled).toBe(false); // cookie presente → se valida Origin → 403
        expect(res.statusCode).toBe(403);
      } else {
        expect(nextCalled).toBe(true); // no presente → se salta validación
      }
    }
  });

  it("A14. allowlist múltiples valores → ambos permitidos", () => {
    const limiter = createValidateOrigin(["https://a.example.com", "https://b.example.com"]);
    for (const o of ["https://a.example.com", "https://b.example.com"]) {
      const { nextCalled } = run(limiter, reqBase({ cookie: true, origin: o }));
      expect(nextCalled).toBe(true);
    }
  });

  it("A15. allowlist vacía → Origin presente → 403 (riesgo de configuración documentado)", () => {
    const limiter = createValidateOrigin([]);
    const { nextCalled, res } = run(limiter, reqBase({ cookie: true, origin: "https://app.example.com" }));
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });
});

describe("O3-D.2 post-audit — HTTP real (origin null/vacío/duplicado/OPTIONS)", () => {
  async function appServer() {
    const limiter = createValidateOrigin(PERMITIDOS);
    const app = express();
    app.use(limiter);
    const state = { ejecuciones: 0 };
    app.post("/mutacion", (_req, res) => {
      state.ejecuciones++;
      res.json({ ok: true });
    });
    const server = http.createServer(app);
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
    const port = (server.address() as { port: number }).port;
    return { server, port, state };
  }

  function rawRequest(port: number, opts: { method: string; path: string; headers: Record<string, string | string[]> }) {
    return new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = http.request({ host: "127.0.0.1", port, method: opts.method, path: opts.path, headers: opts.headers }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      });
      req.on("error", reject);
      req.end();
    });
  }

  it("A4. Origin null HTTP real → 403", async () => {
    const { server, port, state } = await appServer();
    try {
      const r = await rawRequest(port, {
        method: "POST",
        path: "/mutacion",
        headers: { Cookie: "cope_session=abc", Origin: "null" },
      });
      expect(r.status).toBe(403);
      expect(JSON.parse(r.body)).toEqual({ ok: false, error: "Origen no autorizado.", code: "FORBIDDEN_ORIGIN" });
      expect(state.ejecuciones).toBe(0);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("A5. Origin vacío HTTP real → 403", async () => {
    const { server, port, state } = await appServer();
    try {
      const r = await rawRequest(port, {
        method: "POST",
        path: "/mutacion",
        headers: { Cookie: "cope_session=abc", Origin: "" },
      });
      expect(r.status).toBe(403);
      expect(state.ejecuciones).toBe(0);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("A6b. múltiples headers Origin HTTP real → 403", async () => {
    const { server, port, state } = await appServer();
    try {
      const r = await rawRequest(port, {
        method: "POST",
        path: "/mutacion",
        headers: { Cookie: "cope_session=abc", Origin: ["https://app.example.com", "https://attacker.example"] },
      });
      expect(r.status).toBe(403);
      expect(state.ejecuciones).toBe(0);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("A12b. OPTIONS HTTP con Origin atacante → no 403 (preflight intacto)", async () => {
    const { server, port } = await appServer();
    try {
      const r = await rawRequest(port, {
        method: "OPTIONS",
        path: "/mutacion",
        headers: { Origin: "https://attacker.example", "Access-Control-Request-Method": "POST" },
      });
      expect(r.status).not.toBe(403);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});