import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import http from "http";
import cors from "cors";

vi.mock("../services/auth.service", () => ({
  authService: {
    COOKIE_NAME: "cope_session",
    usuarioPorToken: vi.fn(),
    hasPermiso: vi.fn(),
  },
}));

import { authService } from "../services/auth.service";
import { requireAuth } from "../middlewares/auth.middleware";

const usuarioSesion = {
  id: "usr-1",
  nombre: "Ana",
  apellido: null,
  correo: "ana@cope.pe",
  rol: "rol-1",
  equipo: null,
  estado: "activo",
  permisos: [] as any[],
  personabi_id: "pb-1",
};

/** Réplica de la configuración REAL de app.ts: express.json + cors allowlist + credentials. */
function buildApp() {
  const app = express();
  const state = { mutaciones: 0, ultimoBody: undefined as unknown };
  app.use(express.json({ limit: "50mb" }));
  app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
  app.post("/mutacion", requireAuth, (req, res) => {
    state.mutaciones++;
    state.ultimoBody = req.body;
    res.json({ ok: true });
  });
  app.patch("/mutacion/:id", requireAuth, (req, res) => {
    state.mutaciones++;
    res.json({ ok: true });
  });
  app.delete("/mutacion/:id", requireAuth, (req, res) => {
    state.mutaciones++;
    res.json({ ok: true });
  });
  return { app, state };
}

async function withServer(fn: (base: string, state: { mutaciones: number; ultimoBody: unknown }) => Promise<void>) {
  const { app, state } = buildApp();
  const server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as { port: number }).port;
  try {
    await fn(`http://127.0.0.1:${port}`, state);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

function req(base: string, path: string, init: RequestInit & { headers?: Record<string, string> }) {
  return fetch(`${base}${path}`, {
    ...init,
    headers: { Cookie: "cope_session=valid", ...(init.headers ?? {}) },
  });
}

describe("CSRF audit — comportamiento real de CORS + Origin + Content-Type", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authService.usuarioPorToken as any).mockResolvedValue(usuarioSesion);
  });

  it("CSRF-01 POST mutante con Origin externo: se EJECUTA (Origin ignorado) y sin ACAO", async () => {
    await withServer(async (base, state) => {
      const res = await req(base, "/mutacion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
        body: JSON.stringify({ datos: 1 }),
      });
      expect(res.status).toBe(200); // no hay rechazo por Origin
      expect(res.headers.get("access-control-allow-origin")).toBeNull(); // lectura bloqueada por CORS
      expect(state.mutaciones).toBe(1); // la mutación se ejecutó server-side
    });
  });

  it("CSRF-02 PATCH mutante con Origin externo: se ejecuta", async () => {
    await withServer(async (base, state) => {
      const res = await req(base, "/mutacion/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
        body: JSON.stringify({ x: 1 }),
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
      expect(state.mutaciones).toBe(1);
    });
  });

  it("CSRF-03 DELETE mutante con Origin externo: se ejecuta", async () => {
    await withServer(async (base, state) => {
      const res = await req(base, "/mutacion/9", {
        method: "DELETE",
        headers: { Origin: "https://evil.example" },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
      expect(state.mutaciones).toBe(1);
    });
  });

  it("CSRF-08 Origin permitido: ACAO presente + credentials true + se ejecuta", async () => {
    await withServer(async (base, state) => {
      const res = await req(base, "/mutacion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
        body: JSON.stringify({ datos: 1 }),
      });
      expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
      expect(res.headers.get("access-control-allow-credentials")).toBe("true");
      expect(state.mutaciones).toBe(1);
    });
  });

  it("CSRF-09 Origin NO permitido: sin ACAO pero la mutación se ejecuta", async () => {
    await withServer(async (base, state) => {
      const res = await req(base, "/mutacion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://otro-sitio.example" },
        body: JSON.stringify({ datos: 1 }),
      });
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
      expect(state.mutaciones).toBe(1);
    });
  });

  it("CSRF-10 request sin Origin: se ejecuta (sin validación de origen)", async () => {
    await withServer(async (base, state) => {
      const res = await req(base, "/mutacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datos: 1 }),
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
      expect(state.mutaciones).toBe(1);
    });
  });

  it("CSRF-06 form-urlencoded: el backend NO parsea el body (solo JSON) → body vacío", async () => {
    await withServer(async (base, state) => {
      const res = await req(base, "/mutacion", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://evil.example" },
        body: "campo=valor",
      });
      expect(res.status).toBe(200);
      expect(state.ultimoBody).toEqual({}); // express.json no lo parseó
      expect(state.mutaciones).toBe(1);
    });
  });

  it("CSRF-07 multipart/form-data: el backend NO parsea el body → body vacío", async () => {
    await withServer(async (base, state) => {
      const res = await req(base, "/mutacion", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=abc", Origin: "https://evil.example" },
        body: "--abc\r\nContent-Disposition: form-data; name=\"x\"\r\n\r\n1\r\n--abc--\r\n",
      });
      expect(res.status).toBe(200);
      expect(state.ultimoBody).toEqual({});
      expect(state.mutaciones).toBe(1);
    });
  });
});