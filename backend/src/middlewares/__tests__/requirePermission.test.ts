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
import { requirePermission } from "../auth.middleware";

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

const usuario = {
  id: "usr-1",
  nombre: "Ana",
  apellido: null,
  correo: "ana@cope.pe",
  permisos: [{ modulo: "Atenciones", accion: "editar", permitido: true }],
};

function run(auth: any) {
  const req: any = { headers: {}, auth };
  const res = mockRes();
  const state = { nextCalled: false };
  const next = () => { state.nextCalled = true; };
  return { req, res, state, next };
}

describe("requirePermission — autorización funcional (H-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sin sesión → 401 UNAUTHENTICATED", () => {
    const { req, res, state, next } = run(undefined);
    requirePermission("Atenciones", "editar")(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ code: "UNAUTHENTICATED" });
    expect(state.nextCalled).toBe(false);
  });

  it("autenticado sin permiso → 403 FORBIDDEN", () => {
    (authService.hasPermiso as any).mockReturnValue(false);
    const { req, res, state, next } = run(usuario);
    requirePermission("Atenciones", "editar")(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ code: "FORBIDDEN" });
    expect(state.nextCalled).toBe(false);
  });

  it("autenticado con permiso → next", () => {
    (authService.hasPermiso as any).mockReturnValue(true);
    const { req, res, state, next } = run(usuario);
    requirePermission("Atenciones", "editar")(req, res, next);
    expect(state.nextCalled).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(authService.hasPermiso).toHaveBeenCalledWith(usuario, "Atenciones", "editar");
  });
});
