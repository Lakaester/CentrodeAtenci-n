import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { Router } from "express";
import http from "http";
import bcrypt from "bcryptjs";

vi.mock("../repositories/auth.repository", () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    actualizarLastLogin: vi.fn(),
    crearSesion: vi.fn(),
    deleteSesion: vi.fn(),
    deleteSesionesDeUsuario: vi.fn(),
    findSesionByTokenHash: vi.fn(),
    permisosDeUsuario: vi.fn(async () => []),
    permisosDeRol: vi.fn(async () => []),
  },
}));

vi.mock("../repositories/prisma", () => ({
  prisma: { $queryRaw: vi.fn(), $executeRaw: vi.fn() },
}));

import { authController } from "../controllers/auth.controller";
import { createLoginRateLimiter } from "../middlewares/loginRateLimit.middleware";
import { authRepository } from "../repositories/auth.repository";

const REAL_HASH = bcrypt.hashSync("correcta", 10);
const GENTE = {
  activo: {
    id: "usr-1",
    nombre: "Ana",
    apellido: null,
    email: "ana@cope.pe",
    rol: "rol-1",
    equipo_id: null,
    estado: "activo",
    iniciales: "AN",
    password_hash: REAL_HASH,
    last_login_at: null,
    personabi_id: "pb-1",
  },
  deshabilitado: { ...{ id: "usr-2", nombre: "Ana", apellido: null, email: "ana@cope.pe", rol: "rol-1", equipo_id: null, estado: "inactivo", iniciales: "AN", password_hash: REAL_HASH, last_login_at: null, personabi_id: null } },
  sesion: { id: "ses-1", user_id: "usr-1", token_hash: "x".repeat(64), created_at: new Date(), expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000) },
};

function buildApp() {
  const app = express();
  app.use(express.json());
  const authRouter = Router();
  authRouter.post("/login", createLoginRateLimiter(), authController.login);
  authRouter.post("/logout", authController.logout);
  authRouter.get("/me", authController.me);
  app.use("/auth", authRouter);
  return app;
}

async function withServer(app: express.Express, fn: (base: string) => Promise<void>) {
  const server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as { port: number }).port;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

async function login(base: string, body: unknown, cookie?: string) {
  return fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
}

describe("Auth HTTP integration — flujo POST /auth/login end-to-end", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authRepository.findUserByEmail as any).mockResolvedValue(GENTE.activo);
    (authRepository.permisosDeUsuario as any).mockResolvedValue([]);
    (authRepository.actualizarLastLogin as any).mockResolvedValue(undefined);
    (authRepository.crearSesion as any).mockResolvedValue(GENTE.sesion);
  });

  it("login exitoso: 200, cookie cope_session, sesión creada (user_id, hash, 12h)", async () => {
    await withServer(buildApp(), async (base) => {
      const res = await login(base, { email: "ana@cope.pe", password: "correcta" });
      expect(res.status).toBe(200);
      const sc = res.headers.get("set-cookie") ?? "";
      expect(sc).toContain("cope_session=");
      expect(sc).toContain("HttpOnly");
      expect(sc).toContain("Path=/");
      expect(sc).toContain("Max-Age=43200");
      expect(sc.toLowerCase()).toContain("samesite=lax");
      expect(sc.toLowerCase()).not.toContain("secure");
      expect(authRepository.actualizarLastLogin).toHaveBeenCalledWith("usr-1");
      expect(authRepository.crearSesion).toHaveBeenCalledWith(
        "usr-1",
        expect.stringMatching(/^[0-9a-f]{64}$/),
        expect.any(Date),
      );
      const expiresAt = (authRepository.crearSesion as any).mock.calls[0][2] as Date;
      expect(expiresAt.getTime() - Date.now()).toBeGreaterThan(11 * 60 * 60 * 1000);
      expect(expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(12 * 60 * 60 * 1000);
    });
  });

  it("password incorrecta: 401, mismo body genérico, sin cookie, sin sesión", async () => {
    await withServer(buildApp(), async (base) => {
      const res = await login(base, { email: "ana@cope.pe", password: "mal" });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, error: "Correo o contraseña incorrectos." });
      expect(res.headers.get("set-cookie")).toBeNull();
      expect(authRepository.crearSesion).not.toHaveBeenCalled();
    });
  });

  it("usuario inexistente: 401, mismo body (anti-enumeración)", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(null);
    await withServer(buildApp(), async (base) => {
      const res = await login(base, { email: "nadie@cope.pe", password: "x" });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, error: "Correo o contraseña incorrectos." });
    });
  });

  it("deshabilitado + password correcta: 401, mismo body (sin 403)", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(GENTE.deshabilitado);
    await withServer(buildApp(), async (base) => {
      const res = await login(base, { email: "ana@cope.pe", password: "correcta" });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, error: "Correo o contraseña incorrectos." });
    });
  });

  it("deshabilitado + password incorrecta: 401, mismo body", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(GENTE.deshabilitado);
    await withServer(buildApp(), async (base) => {
      const res = await login(base, { email: "ana@cope.pe", password: "mal" });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, error: "Correo o contraseña incorrectos." });
    });
  });

  it("payload inválido {}: 400, no consume bucket", async () => {
    await withServer(buildApp(), async (base) => {
      for (let i = 0; i < 10; i++) {
        const r = await login(base, {});
        expect(r.status).toBe(400);
      }
      const ok = await login(base, { email: "ana@cope.pe", password: "correcta" });
      expect(ok.status).toBe(200);
    });
  });

  it("rate limit: 10 fallos → 429 con Retry-After; los 429 no avanzan strike", async () => {
    await withServer(buildApp(), async (base) => {
      for (let i = 0; i < 10; i++) await login(base, { email: "ana@cope.pe", password: "mal" });
      const b1 = await login(base, { email: "ana@cope.pe", password: "correcta" });
      expect(b1.status).toBe(429);
      const ra1 = Number(b1.headers.get("retry-after"));
      expect(Number.isInteger(ra1)).toBe(true);
      expect(ra1).toBeGreaterThanOrEqual(1);
      for (let i = 0; i < 3; i++) {
        const b = await login(base, { email: "ana@cope.pe", password: "correcta" });
        expect(b.status).toBe(429);
        const ra = Number(b.headers.get("retry-after"));
        // No crece: los 429 durante el bloqueo no incrementan contadores ni strike.
        expect(ra).toBeGreaterThanOrEqual(ra1);
        expect(ra).toBeLessThanOrEqual(ra1 + 1);
      }
    });
  }, 30000);

  it("success reset: el éxito limpia la cuenta pero NO el bucket IP", async () => {
    await withServer(buildApp(), async (base) => {
      for (let i = 0; i < 3; i++) await login(base, { email: "ana@cope.pe", password: "mal" });
      const ok = await login(base, { email: "ana@cope.pe", password: "correcta" });
      expect(ok.status).toBe(200); // éxito → clear cuenta
      await login(base, { email: "ana@cope.pe", password: "mal" });
      for (let i = 0; i < 6; i++) await login(base, { email: "ana@cope.pe", password: "mal" });
      // IP: 3 + 1 + 6 = 10 → bloqueado por IP aunque la cuenta partió limpia (7 fallos).
      const b = await login(base, { email: "ana@cope.pe", password: "correcta" });
      expect(b.status).toBe(429);
    });
  }, 30000);

  it("/auth/me sin token → 401; con token válido → 200", async () => {
    await withServer(buildApp(), async (base) => {
      const anon = await fetch(`${base}/auth/me`);
      expect(anon.status).toBe(401);
      (authRepository.findSesionByTokenHash as any).mockResolvedValue(GENTE.sesion);
      (authRepository.findUserById as any).mockResolvedValue(GENTE.activo);
      const me = await fetch(`${base}/auth/me`, { headers: { Cookie: "cope_session=abc" } });
      expect(me.status).toBe(200);
      const data = await me.json();
      expect(data.ok).toBe(true);
      expect(data.data.id).toBe("usr-1");
    });
  });

  it("/auth/logout: borra sesión y limpia cookie", async () => {
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(GENTE.sesion);
    await withServer(buildApp(), async (base) => {
      const res = await fetch(`${base}/auth/logout`, { method: "POST", headers: { Cookie: "cope_session=abc" } });
      expect(res.status).toBe(200);
      expect(authRepository.deleteSesion).toHaveBeenCalledWith("ses-1");
      expect(res.headers.get("set-cookie") ?? "").toContain("cope_session=");
    });
  });

  it("concurrencia básica: 10 fallos simultáneos → 401; el siguiente → 429 (determinista)", async () => {
    await withServer(buildApp(), async (base) => {
      const all = await Promise.all(
        Array.from({ length: 10 }, () => login(base, { email: "ana@cope.pe", password: "mal" })),
      );
      for (const r of all) expect(r.status).toBe(401);
      const b = await login(base, { email: "ana@cope.pe", password: "correcta" });
      expect(b.status).toBe(429);
    });
  }, 30000);
});