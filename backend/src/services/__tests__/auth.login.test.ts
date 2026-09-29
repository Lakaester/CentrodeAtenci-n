import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("../../repositories/auth.repository", () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    actualizarLastLogin: vi.fn(),
    crearSesion: vi.fn(),
    deleteSesion: vi.fn(),
    deleteSesionesDeUsuario: vi.fn(),
    permisosDeUsuario: vi.fn(async () => []),
    permisosDeRol: vi.fn(async () => []),
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
import { authService, DUMMY_PASSWORD_HASH } from "../auth.service";
import { DomainError } from "../../core/errors/types";

const usuarioActivo = {
  id: "usr-1",
  nombre: "Ana",
  apellido: null,
  email: "ana@cope.pe",
  rol: "rol-1",
  equipo_id: "eq-1",
  estado: "activo",
  iniciales: "AN",
  password_hash: "$2b$12$REALHASHreallongREALHASHreallongREALHASHreallong",
  last_login_at: null,
  personabi_id: "pb-1",
};

const usuarioDeshabilitado = { ...usuarioActivo, id: "usr-2", estado: "inactivo" };

async function capturar(err: unknown): Promise<DomainError> {
  expect(err).toBeInstanceOf(DomainError);
  return err as DomainError;
}

describe("authService.login — anti-enumeración + dummy hash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("A. usuario inexistente: ejecuta bcrypt.compare contra el DUMMY_PASSWORD_HASH", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(null);
    (verifyPassword as any).mockResolvedValue(false);
    await expect(authService.login("noexiste@cope.pe", "secreta")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    expect(verifyPassword).toHaveBeenCalledTimes(1);
    expect(verifyPassword).toHaveBeenCalledWith("secreta", DUMMY_PASSWORD_HASH);
  });

  it("B. password incorrecta: bcrypt.compare contra el hash real → 401", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(usuarioActivo);
    (verifyPassword as any).mockResolvedValue(false);
    await expect(authService.login("ana@cope.pe", "mal")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    expect(verifyPassword).toHaveBeenCalledWith("mal", usuarioActivo.password_hash);
  });

  it("C. usuario deshabilitado + password correcta → 401 genérico (INVALID_CREDENTIALS)", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(usuarioDeshabilitado);
    (verifyPassword as any).mockResolvedValue(true);
    try {
      await authService.login("ana@cope.pe", "correcta");
      expect.unreachable("debería lanzar");
    } catch (err) {
      const e = await capturar(err);
      expect(e.code).toBe("INVALID_CREDENTIALS");
      expect(e.message).toBe("Correo o contraseña incorrectos.");
    }
  });

  it("D. inexistente vs password incorrecta → misma respuesta pública (code y mensaje)", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(null);
    (verifyPassword as any).mockResolvedValue(false);
    let errNE: DomainError | null = null;
    try {
      await authService.login("noexiste@cope.pe", "x");
    } catch (err) {
      errNE = await capturar(err);
    }
    (authRepository.findUserByEmail as any).mockResolvedValue(usuarioActivo);
    let errWP: DomainError | null = null;
    try {
      await authService.login("ana@cope.pe", "x");
    } catch (err) {
      errWP = await capturar(err);
    }
    expect(errNE!.code).toBe("INVALID_CREDENTIALS");
    expect(errWP!.code).toBe("INVALID_CREDENTIALS");
    expect(errNE!.message).toBe(errWP!.message);
    expect(errNE!.message).toBe("Correo o contraseña incorrectos.");
  });

  it("E. dummy hash estable: formato bcrypt válido, constante, nunca matchea", () => {
    expect(DUMMY_PASSWORD_HASH).toMatch(/^\$2[aby]\$\d{2}\$/);
    // Válido para bcrypt (compareSync no lanza y nunca coincide con una password real).
    expect(bcrypt.compareSync("cualquier-password", DUMMY_PASSWORD_HASH)).toBe(false);
    expect(bcrypt.compareSync("password", DUMMY_PASSWORD_HASH)).toBe(false);
  });

  it("F. deshabilitado → 401 (el rate limiter ya cuenta 401 como fallo)", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(usuarioDeshabilitado);
    (verifyPassword as any).mockResolvedValue(true);
    try {
      await authService.login("ana@cope.pe", "correcta");
      expect.unreachable();
    } catch (err) {
      const e = await capturar(err);
      // El controller mapea INVALID_CREDENTIALS → 401 (sin 403).
      expect(e.code).toBe("INVALID_CREDENTIALS");
    }
  });

  it("G. login exitoso: 200, crea sesión, actualiza last_login, permisos", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(usuarioActivo);
    (verifyPassword as any).mockResolvedValue(true);
    (authRepository.permisosDeUsuario as any).mockResolvedValue([
      { modulo: "tickets", accion: "ver", permitido: true },
    ]);
    const { token, user } = await authService.login("ana@cope.pe", "correcta");
    expect(token).toBeTruthy();
    expect(user.id).toBe("usr-1");
    expect(user.personabi_id).toBe("pb-1");
    expect(authRepository.actualizarLastLogin).toHaveBeenCalledWith("usr-1");
    expect(authRepository.crearSesion).toHaveBeenCalledTimes(1);
    expect(authRepository.crearSesion).toHaveBeenCalledWith(
      "usr-1",
      expect.stringMatching(/^[0-9a-f]{64}$/),
      expect.any(Date),
    );
  });

  it("H. timing: ambos caminos (inexistente e incorrecta) ejecutan bcrypt.compare", async () => {
    (authRepository.findUserByEmail as any).mockResolvedValue(null);
    (verifyPassword as any).mockResolvedValue(false);
    await authService.login("no@cope.pe", "x").catch(() => undefined);
    (authRepository.findUserByEmail as any).mockResolvedValue(usuarioActivo);
    (verifyPassword as any).mockResolvedValue(false);
    await authService.login("ana@cope.pe", "x").catch(() => undefined);
    expect(verifyPassword).toHaveBeenCalledTimes(2);
  });
});