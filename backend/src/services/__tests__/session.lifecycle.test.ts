import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

vi.mock("../../repositories/auth.repository", () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    actualizarLastLogin: vi.fn(),
    crearSesion: vi.fn(),
    deleteSesion: vi.fn(),
    deleteSesionesDeUsuario: vi.fn(),
    findSesionByTokenHash: vi.fn(),
    permisosDeUsuario: vi.fn(),
    permisosDeRol: vi.fn(),
  },
}));

vi.mock("../../repositories/prisma", () => ({
  prisma: { $queryRaw: vi.fn(), $executeRaw: vi.fn() },
}));

vi.mock("../../utils/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

import { authRepository } from "../../repositories/auth.repository";
import { verifyPassword } from "../../utils/password";
import { authService } from "../auth.service";

const ahora = Date.now();
const sesionValida = {
  id: "ses-A",
  user_id: "usr-1",
  token_hash: "a".repeat(64),
  created_at: new Date(ahora),
  expires_at: new Date(ahora + 12 * 60 * 60 * 1000),
};
const sesionExpirada = { ...sesionValida, id: "ses-X", expires_at: new Date(ahora - 1000) };

const usuario = {
  id: "usr-1",
  nombre: "Ana",
  apellido: null,
  email: "ana@cope.pe",
  rol: "rol-1",
  equipo_id: null,
  estado: "activo",
  iniciales: "AN",
  password_hash: "hash",
  last_login_at: null,
  personabi_id: "pb-1",
};
const deshabilitado = { ...usuario, estado: "inactivo" };

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

describe("authService — ciclo de vida de sesiones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authRepository.findUserByEmail as any).mockResolvedValue(usuario);
    (verifyPassword as any).mockResolvedValue(true);
    (authRepository.permisosDeUsuario as any).mockResolvedValue([]);
  });

  it("1. login crea sesión con HASH del token en DB (no el token crudo)", async () => {
    (authRepository.crearSesion as any).mockResolvedValue(sesionValida);
    const { token } = await authService.login("ana@cope.pe", "correcta");
    expect(token.length).toBe(64);
    const args = (authRepository.crearSesion as any).mock.calls[0];
    expect(args[0]).toBe("usr-1");
    expect(args[1]).toBe(sha256(token)); // token_hash = sha256(token)
    expect(args[1]).not.toBe(token); // nunca el token crudo
    expect(args[1]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("2. token válido → usuario autenticado", async () => {
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(sesionValida);
    (authRepository.findUserById as any).mockResolvedValue(usuario);
    const user = await authService.usuarioPorToken("0123456789abcdef");
    expect(user?.id).toBe("usr-1");
  });

  it("3. token inexistente → null", async () => {
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(null);
    expect(await authService.usuarioPorToken("abc")).toBeNull();
  });

  it("4. token expirado → null y elimina la sesión (lazy cleanup)", async () => {
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(sesionExpirada);
    expect(await authService.usuarioPorToken("abc")).toBeNull();
    expect(authRepository.deleteSesion).toHaveBeenCalledWith("ses-X");
  });

  it("5. usuario deshabilitado post-login → null (sesión rechazada)", async () => {
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(sesionValida);
    (authRepository.findUserById as any).mockResolvedValue(deshabilitado);
    expect(await authService.usuarioPorToken("abc")).toBeNull();
  });

  it("6. permisos/rol se re-leen en cada request (no congelados en la sesión)", async () => {
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(sesionValida);
    (authRepository.findUserById as any).mockResolvedValue(usuario);
    await authService.usuarioPorToken("abc");
    await authService.usuarioPorToken("abc");
    expect(authRepository.permisosDeUsuario).toHaveBeenCalledTimes(2);
  });

  it("7. logout elimina SOLO la sesión del token (no todas las del usuario)", async () => {
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(sesionValida);
    await authService.logout("0123456789abcdef");
    expect(authRepository.deleteSesion).toHaveBeenCalledWith("ses-A");
    expect(authRepository.deleteSesionesDeUsuario).not.toHaveBeenCalled();
  });

  it("8. logout con token inexistente → no elimina nada", async () => {
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(null);
    await authService.logout("0123456789abcdef");
    expect(authRepository.deleteSesion).not.toHaveBeenCalled();
  });

  it("9. cada login genera un token distinto (sin session fixation)", async () => {
    (authRepository.crearSesion as any).mockResolvedValue(sesionValida);
    const a = await authService.login("ana@cope.pe", "correcta");
    const b = await authService.login("ana@cope.pe", "correcta");
    expect(a.token).not.toBe(b.token);
    expect((authRepository.crearSesion as any).mock.calls.length).toBe(2);
    expect((authRepository.crearSesion as any).mock.calls[0][1]).not.toBe(
      (authRepository.crearSesion as any).mock.calls[1][1],
    );
  });

  it("10. múltiples sesiones independientes (una por login)", async () => {
    (authRepository.crearSesion as any).mockResolvedValue(sesionValida);
    await authService.login("ana@cope.pe", "correcta");
    await authService.login("ana@cope.pe", "correcta");
    expect(authRepository.crearSesion).toHaveBeenCalledTimes(2);
  });

  it("11. la sesión depende de la fila en DB (sobrevive al reinicio del proceso)", async () => {
    // usuarioPorToken solo consulta la fila DB; no depende de memoria del proceso.
    (authRepository.findSesionByTokenHash as any).mockResolvedValue(sesionValida);
    (authRepository.findUserById as any).mockResolvedValue(usuario);
    const user = await authService.usuarioPorToken("0123456789abcdef");
    expect(user?.id).toBe("usr-1");
  });
});