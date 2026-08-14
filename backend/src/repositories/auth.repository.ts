import { prisma } from "./prisma";

export interface AuthUsuario {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  rol: string | null;
  equipo_id: string | null;
  estado: string;
  iniciales: string | null;
  password_hash: string | null;
  last_login_at: Date | null;
}

export interface AuthSesion {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: Date;
  expires_at: Date;
}

export interface PermisoRow {
  modulo: string;
  accion: string;
  permitido: boolean;
}

export const authRepository = {
  async findUserByEmail(email: string): Promise<AuthUsuario | null> {
    const rows = await prisma.$queryRaw<AuthUsuario[]>`
      SELECT * FROM cope_usuarios WHERE email = ${email.toLowerCase()} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async findUserById(id: string): Promise<AuthUsuario | null> {
    const rows = await prisma.$queryRaw<AuthUsuario[]>`
      SELECT * FROM cope_usuarios WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async permisosDeUsuario(userId: string): Promise<PermisoRow[]> {
    // Permisos del rol del usuario (cope_usuarios.rol = cope_roles.id).
    return prisma.$queryRaw<PermisoRow[]>`
      SELECT p.modulo, p.accion, p.permitido
      FROM cope_permisos p
      JOIN cope_usuarios u ON u.rol = p.rol_id
      WHERE u.id = ${userId}
    `;
  },

  async permisosDeRol(rolId: string | null): Promise<PermisoRow[]> {
    if (!rolId) return [];
    return prisma.$queryRaw<PermisoRow[]>`SELECT modulo, accion, permitido FROM cope_permisos WHERE rol_id = ${rolId}`;
  },

  async crearSesion(userId: string, tokenHash: string, expiresAt: Date): Promise<AuthSesion> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const rows = await prisma.$queryRaw<AuthSesion[]>`
      INSERT INTO cope_sessions (id, user_id, token_hash, expires_at)
      VALUES (${id}, ${userId}, ${tokenHash}, ${expiresAt})
      RETURNING *
    `;
    return rows[0];
  },

  async findSesionByTokenHash(tokenHash: string): Promise<AuthSesion | null> {
    const rows = await prisma.$queryRaw<AuthSesion[]>`
      SELECT * FROM cope_sessions WHERE token_hash = ${tokenHash} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async deleteSesion(id: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM cope_sessions WHERE id = ${id}`;
  },

  async deleteSesionesDeUsuario(userId: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM cope_sessions WHERE user_id = ${userId}`;
  },

  async actualizarLastLogin(userId: string): Promise<void> {
    await prisma.$executeRaw`UPDATE cope_usuarios SET last_login_at = now() WHERE id = ${userId}`;
  },
};
