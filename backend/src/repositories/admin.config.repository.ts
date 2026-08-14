import { prisma } from "./prisma";
import { genId } from "./facturacion.types";

export interface AdminUsuarioRow {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  rol: string | null;
  equipo_id: string | null;
  estado: string;
  iniciales: string | null;
  ultimo_acceso: Date | null;
  password_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AdminRolRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  es_interno: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AdminEquipoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  es_interno: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AdminPermisoRow {
  id: string;
  modulo: string;
  accion: string;
  rol_id: string;
  permitido: boolean;
}

export const adminConfigRepository = {
  async listarUsuarios(): Promise<AdminUsuarioRow[]> {
    return prisma.$queryRaw<AdminUsuarioRow[]>`SELECT * FROM cope_usuarios ORDER BY nombre ASC`;
  },

  async crearUsuario(data: {
    nombre: string;
    apellido?: string | null;
    email: string;
    rol?: string | null;
    equipoId?: string | null;
    iniciales?: string | null;
    passwordHash?: string | null;
  }): Promise<AdminUsuarioRow> {
    const id = genId();
    const rows = await prisma.$queryRaw<AdminUsuarioRow[]>`
      INSERT INTO cope_usuarios (id, nombre, apellido, email, rol, equipo_id, iniciales, password_hash)
      VALUES (${id}, ${data.nombre}, ${data.apellido ?? null}, ${data.email}, ${data.rol ?? null},
              ${data.equipoId ?? null}, ${data.iniciales ?? null}, ${data.passwordHash ?? null})
      RETURNING *
    `;
    return rows[0];
  },

  async actualizarUsuario(id: string, patch: {
    nombre?: string; apellido?: string | null; email?: string; rol?: string | null;
    equipoId?: string | null; estado?: string; iniciales?: string | null; passwordHash?: string | null;
  }): Promise<AdminUsuarioRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    const map: Record<string, unknown> = {
      nombre: patch.nombre,
      apellido: patch.apellido,
      email: patch.email,
      rol: patch.rol,
      equipo_id: patch.equipoId,
      estado: patch.estado,
      iniciales: patch.iniciales,
      password_hash: patch.passwordHash,
    };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { sets.push(`${col} = $${values.length + 1}`); values.push(val); }
    }
    if (sets.length === 0) return null;
    sets.push("updated_at = now()");
    values.push(id);
    const rows = await prisma.$queryRawUnsafe<AdminUsuarioRow[]>(
      `UPDATE cope_usuarios SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      ...values,
    );
    return rows[0] ?? null;
  },

  async listarRoles(): Promise<AdminRolRow[]> {
    return prisma.$queryRaw<AdminRolRow[]>`SELECT * FROM cope_roles ORDER BY orden ASC, nombre ASC`;
  },

  async crearRol(nombre: string, descripcion?: string | null): Promise<AdminRolRow> {
    const id = genId();
    const max = await prisma.$queryRaw<{ m: number | null }[]>`SELECT MAX(orden) AS m FROM cope_roles`;
    const orden = (max[0]?.m ?? 0) + 10;
    const rows = await prisma.$queryRaw<AdminRolRow[]>`
      INSERT INTO cope_roles (id, nombre, descripcion, orden) VALUES (${id}, ${nombre}, ${descripcion ?? null}, ${orden})
      RETURNING *
    `;
    return rows[0];
  },

  async actualizarRol(id: string, patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number }): Promise<AdminRolRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    const map: Record<string, unknown> = { nombre: patch.nombre, descripcion: patch.descripcion, activo: patch.activo, orden: patch.orden };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { sets.push(`${col} = $${values.length + 1}`); values.push(val); }
    }
    if (sets.length === 0) return null;
    sets.push("updated_at = now()");
    values.push(id);
    const rows = await prisma.$queryRawUnsafe<AdminRolRow[]>(
      `UPDATE cope_roles SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      ...values,
    );
    return rows[0] ?? null;
  },

  async listarEquipos(): Promise<AdminEquipoRow[]> {
    return prisma.$queryRaw<AdminEquipoRow[]>`SELECT * FROM cope_equipos ORDER BY orden ASC, nombre ASC`;
  },

  async crearEquipo(nombre: string, descripcion?: string | null): Promise<AdminEquipoRow> {
    const id = genId();
    const max = await prisma.$queryRaw<{ m: number | null }[]>`SELECT MAX(orden) AS m FROM cope_equipos`;
    const orden = (max[0]?.m ?? 0) + 10;
    const rows = await prisma.$queryRaw<AdminEquipoRow[]>`
      INSERT INTO cope_equipos (id, nombre, descripcion, orden) VALUES (${id}, ${nombre}, ${descripcion ?? null}, ${orden})
      RETURNING *
    `;
    return rows[0];
  },

  async actualizarEquipo(id: string, patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number }): Promise<AdminEquipoRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    const map: Record<string, unknown> = { nombre: patch.nombre, descripcion: patch.descripcion, activo: patch.activo, orden: patch.orden };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { sets.push(`${col} = $${values.length + 1}`); values.push(val); }
    }
    if (sets.length === 0) return null;
    sets.push("updated_at = now()");
    values.push(id);
    const rows = await prisma.$queryRawUnsafe<AdminEquipoRow[]>(
      `UPDATE cope_equipos SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      ...values,
    );
    return rows[0] ?? null;
  },

  async listarPermisos(rolId: string | null): Promise<AdminPermisoRow[]> {
    if (rolId) {
      return prisma.$queryRaw<AdminPermisoRow[]>`SELECT * FROM cope_permisos WHERE rol_id = ${rolId} ORDER BY modulo ASC, accion ASC`;
    }
    return prisma.$queryRaw<AdminPermisoRow[]>`SELECT * FROM cope_permisos ORDER BY modulo ASC, accion ASC`;
  },

  async setPermiso(modulo: string, accion: string, rolId: string, permitido: boolean): Promise<void> {
    const id = genId();
    await prisma.$executeRaw`
      INSERT INTO cope_permisos (id, modulo, accion, rol_id, permitido)
      VALUES (${id}, ${modulo}, ${accion}, ${rolId}, ${permitido})
      ON CONFLICT (modulo, accion, rol_id)
      DO UPDATE SET permitido = EXCLUDED.permitido, updated_at = now()
    `;
  },
};
