import { randomBytes, createHash } from "crypto";
import { authRepository, type AuthUsuario, type PermisoRow } from "../repositories/auth.repository";
import { verifyPassword, hashPassword } from "../utils/password";
import { prisma } from "../repositories/prisma";
import { DomainError } from "../core/errors/types";

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const COOKIE_NAME = "cope_session";

/**
 * Dummy bcrypt hash PRECOMPUTADO (bcryptjs, cost 12, igual que el hashing real).
 * Se usa únicamente para usuarios inexistentes: garantiza que `bcrypt.compare`
 * se ejecute siempre, sin revelar si el email existe (anti-enumeración por timing).
 * Nunca se genera por request, no se expone, no se loguea.
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$0KH.gLXeADqqAgy3ktR1x.eCfI/iJCKrRJ1igUMnyEvv3GMaMW8tG";

/** Log interno seguro de fallos de autenticación (solo categoría, nunca secretos). */
function logAuthFailure(reason: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[AUTH] login fallido: reason=${reason}`);
}

export interface AuthMe {
  id: string;
  nombre: string;
  apellido: string | null;
  correo: string;
  rol: string | null;
  equipo: string | null;
  estado: string;
  permisos: PermisoRow[];
  personabi_id?: string | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Normaliza un texto para comparar permisos (minúsculas, sin tildes). */
function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function toMe(u: AuthUsuario, permisos: PermisoRow[]): AuthMe {
  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    correo: u.email,
    rol: u.rol,
    equipo: u.equipo_id,
    estado: u.estado,
    permisos,
    personabi_id: u.personabi_id,
  };
}

export const authService = {
  COOKIE_NAME,

  async login(email: string, password: string): Promise<{ token: string; user: AuthMe }> {
    const emailNorm = email.trim().toLowerCase();
    const usuario = await authRepository.findUserByEmail(emailNorm);

    // Anti-enumeración: bcrypt.compare SIEMPRE se ejecuta, con el hash real si el
    // usuario existe o con el DUMMY_PASSWORD_HASH si no existe. Sin early return.
    const hash = usuario?.password_hash ?? DUMMY_PASSWORD_HASH;
    const ok = await verifyPassword(password, hash);

    // Misma respuesta pública para los tres casos (usuario inexistente, password
    // incorrecta, usuario deshabilitado). La causa solo se conserva internamente.
    if (!ok) {
      logAuthFailure(usuario ? "INVALID_PASSWORD" : "USER_NOT_FOUND");
      throw new DomainError("Correo o contraseña incorrectos.", "INVALID_CREDENTIALS");
    }
    if (!usuario) {
      logAuthFailure("USER_NOT_FOUND");
      throw new DomainError("Correo o contraseña incorrectos.", "INVALID_CREDENTIALS");
    }
    if (usuario.estado !== "activo") {
      logAuthFailure("USER_DISABLED");
      throw new DomainError("Correo o contraseña incorrectos.", "INVALID_CREDENTIALS");
    }

    await authRepository.actualizarLastLogin(usuario.id);

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await authRepository.crearSesion(usuario.id, tokenHash, expiresAt);

    const permisos = await authRepository.permisosDeUsuario(usuario.id);
    return { token, user: toMe(usuario, permisos) };
  },

  async usuarioPorToken(token: string): Promise<AuthMe | null> {
    if (!token) return null;
    const tokenHash = hashToken(token);
    const sesion = await authRepository.findSesionByTokenHash(tokenHash);
    if (!sesion) return null;
    if (sesion.expires_at.getTime() < Date.now()) {
      await authRepository.deleteSesion(sesion.id);
      return null;
    }

    const usuario = await authRepository.findUserById(sesion.user_id);
    if (!usuario) return null;
    // Usuario desactivado: rechazar la sesión.
    if (usuario.estado !== "activo") return null;

    const permisos = await authRepository.permisosDeUsuario(usuario.id);
    return toMe(usuario, permisos);
  },

  async logout(token: string): Promise<void> {
    if (!token) return;
    const tokenHash = hashToken(token);
    const sesion = await authRepository.findSesionByTokenHash(tokenHash);
    if (sesion) await authRepository.deleteSesion(sesion.id);
  },

  hasPermiso(user: AuthMe, modulo: string, accion: string): boolean {
    const p = user.permisos?.find((x) => norm(x.modulo) === norm(modulo) && norm(x.accion) === norm(accion));
    if (!p) return false;
    return Boolean(p.permitido);
  },

  /** Permisos "VER" por módulo (para sidebar dinámico). */
  moduloVisible(user: AuthMe, modulo: string): boolean {
    return this.hasPermiso(user, modulo, "ver") || this.hasPermiso(user, modulo, "administrar");
  },

  /**
   * Bootstrap del administrador inicial desde variables de entorno.
   * Idempotente: no crea duplicados si el correo ya existe.
   */
  async bootstrapAdmin(): Promise<boolean> {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (!email || !password) return false;

    const existente = await authRepository.findUserByEmail(email);
    if (existente) return false;

    const passwordHash = await hashPassword(password);
    const id = `usr-bootstrap-${Date.now()}`;
    await prisma.$queryRaw`
      INSERT INTO cope_usuarios (id, nombre, apellido, email, rol, equipo_id, estado, iniciales, password_hash)
      VALUES (${id}, ${"Administrador"}, NULL, ${email}, 'rol-admin', 'equipo-administracion', 'activo', 'AD', ${passwordHash})
    `;
    return true;
  },
};
