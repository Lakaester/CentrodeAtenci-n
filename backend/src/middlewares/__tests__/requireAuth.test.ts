import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

vi.mock("../../services/auth.service", () => ({
  authService: {
    COOKIE_NAME: "cope_session",
    usuarioPorToken: vi.fn(),
    hasPermiso: vi.fn(),
  },
}));

import { authService } from "../../services/auth.service";
import { requireAuth } from "../auth.middleware";

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

function run(cookie?: string) {
  const req: any = { headers: cookie ? { cookie } : {} };
  const res = mockRes();
  const state: { nextCalled: boolean; nextErr: unknown } = { nextCalled: false, nextErr: null };
  const next = (e?: unknown) => {
    state.nextCalled = true;
    state.nextErr = e ?? null;
  };
  return { req, res, next, state };
}

const usuarioSesion = {
  id: "usr-1",
  nombre: "Ana",
  apellido: null,
  correo: "ana@cope.pe",
  rol: "rol-1",
  equipo: null,
  estado: "activo",
  permisos: [{ modulo: "tickets", accion: "ver", permitido: true }],
  personabi_id: "pb-1",
};

describe("requireAuth — validación de sesión (casos A-F)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("A. cookie inexistente → 401 UNAUTHENTICATED", async () => {
    const { req, res, next, state } = run();
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
    expect(state.nextCalled).toBe(false);
  });

  it("B. cookie inventada (sesión no existe) → 401", async () => {
    (authService.usuarioPorToken as any).mockResolvedValue(null);
    const { req, res, next, state } = run("cope_session=inventado");
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(state.nextCalled).toBe(false);
  });

  it("C. token aleatorio → 401", async () => {
    (authService.usuarioPorToken as any).mockResolvedValue(null);
    const { req, res, next } = run("cope_session=aleatorio");
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it("D. token válido → req.auth se llena desde la sesión y continúa", async () => {
    (authService.usuarioPorToken as any).mockResolvedValue(usuarioSesion);
    const { req, res, next, state } = run("cope_session=validotoken");
    await requireAuth(req, res, next);
    expect(state.nextCalled).toBe(true);
    expect((req as any).auth?.id).toBe("usr-1");
    expect((req as any).auth?.permisos).toHaveLength(1);
  });

  it("E. token expirado → 401 (el servicio devuelve null)", async () => {
    (authService.usuarioPorToken as any).mockResolvedValue(null);
    const { req, res, next, state } = run("cope_session=expirado");
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(state.nextCalled).toBe(false);
  });

  it("F. token eliminado de DB → 401", async () => {
    (authService.usuarioPorToken as any).mockResolvedValue(null);
    const { req, res, next } = run("cope_session=eliminado");
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it("G. error de DB (P1017) → 503 DB_UNAVAILABLE (no 500)", async () => {
    (authService.usuarioPorToken as any).mockRejectedValue(Object.assign(new Error("db"), { code: "P1017" }));
    const { req, res, next } = run("cope_session=abc");
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({ code: "DB_UNAVAILABLE" });
  });

  it("H. error inesperado → next(err) (no transforma 401 en 500)", async () => {
    (authService.usuarioPorToken as any).mockRejectedValue(new Error("boom"));
    const { req, res, next, state } = run("cope_session=abc");
    await requireAuth(req, res, next);
    expect(state.nextErr).toBeInstanceOf(Error);
  });
});