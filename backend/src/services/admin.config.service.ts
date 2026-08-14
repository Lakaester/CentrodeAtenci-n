import { adminConfigRepository, type AdminUsuarioRow } from "../repositories/admin.config.repository";
import { DomainError } from "../core/errors/types";
import { hashPassword } from "../utils/password";

/** Elimina password_hash de la respuesta (nunca exponer). */
function sinPassword(u: AdminUsuarioRow) {
  const { password_hash, ...rest } = u;
  void password_hash;
  return rest;
}

export const adminConfigService = {
  async listarUsuarios() {
    const rows = await adminConfigRepository.listarUsuarios();
    // Nunca exponer password_hash al frontend.
    return rows.map(sinPassword);
  },

  async crearUsuario(data: {
    nombre: string; apellido?: string | null; email: string; rol?: string | null;
    equipoId?: string | null; iniciales?: string | null; password?: string;
  }) {
    const nombre = data.nombre.trim();
    const email = data.email.trim().toLowerCase();
    if (!nombre) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
    if (!email) throw new DomainError("El correo es obligatorio", "EMAIL_REQUERIDO");
    const existentes = await adminConfigRepository.listarUsuarios();
    if (existentes.some((u) => u.email.toLowerCase() === email)) {
      throw new DomainError("Ya existe un usuario con ese correo", "DUPLICADO");
    }
    const passwordHash = data.password ? await hashPassword(data.password) : null;
    const creado = await adminConfigRepository.crearUsuario({ nombre, apellido: data.apellido, email, rol: data.rol, equipoId: data.equipoId, iniciales: data.iniciales, passwordHash });
    return sinPassword(creado);
  },

  async actualizarUsuario(id: string, patch: {
    nombre?: string; apellido?: string | null; email?: string; rol?: string | null;
    equipoId?: string | null; estado?: string; iniciales?: string | null; password?: string;
  }) {
    if (patch.email) {
      const email = patch.email.trim().toLowerCase();
      patch.email = email;
      const existentes = await adminConfigRepository.listarUsuarios();
      if (existentes.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
        throw new DomainError("Ya existe un usuario con ese correo", "DUPLICADO");
      }
    }
    let passwordHash: string | undefined;
    if (patch.password) {
      passwordHash = await hashPassword(patch.password);
      delete patch.password;
    }
    const actualizado = await adminConfigRepository.actualizarUsuario(id, { ...patch, ...(passwordHash !== undefined ? { passwordHash } : {}) });
    if (!actualizado) throw new DomainError("Usuario no encontrado", "NO_ENCONTRADO");
    return sinPassword(actualizado);
  },

  async listarRoles() {
    return adminConfigRepository.listarRoles();
  },

  async crearRol(nombre: string, descripcion?: string | null) {
    const limpio = nombre.trim();
    if (!limpio) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
    const existentes = await adminConfigRepository.listarRoles();
    if (existentes.some((r) => r.nombre.toLowerCase() === limpio.toLowerCase())) {
      throw new DomainError("Ya existe un rol con ese nombre", "DUPLICADO");
    }
    return adminConfigRepository.crearRol(limpio, descripcion);
  },

  async actualizarRol(id: string, patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number }) {
    if (patch.nombre !== undefined) {
      const limpio = patch.nombre.trim();
      if (!limpio) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
      const existentes = await adminConfigRepository.listarRoles();
      if (existentes.some((r) => r.id !== id && r.nombre.toLowerCase() === limpio.toLowerCase())) {
        throw new DomainError("Ya existe un rol con ese nombre", "DUPLICADO");
      }
      patch.nombre = limpio;
    }
    const actualizado = await adminConfigRepository.actualizarRol(id, patch);
    if (!actualizado) throw new DomainError("Rol no encontrado", "NO_ENCONTRADO");
    return actualizado;
  },

  async listarEquipos() {
    return adminConfigRepository.listarEquipos();
  },

  async crearEquipo(nombre: string, descripcion?: string | null) {
    const limpio = nombre.trim();
    if (!limpio) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
    const existentes = await adminConfigRepository.listarEquipos();
    if (existentes.some((e) => e.nombre.toLowerCase() === limpio.toLowerCase())) {
      throw new DomainError("Ya existe un equipo con ese nombre", "DUPLICADO");
    }
    return adminConfigRepository.crearEquipo(limpio, descripcion);
  },

  async actualizarEquipo(id: string, patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number }) {
    if (patch.nombre !== undefined) {
      const limpio = patch.nombre.trim();
      if (!limpio) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
      const existentes = await adminConfigRepository.listarEquipos();
      if (existentes.some((e) => e.id !== id && e.nombre.toLowerCase() === limpio.toLowerCase())) {
        throw new DomainError("Ya existe un equipo con ese nombre", "DUPLICADO");
      }
      patch.nombre = limpio;
    }
    const actualizado = await adminConfigRepository.actualizarEquipo(id, patch);
    if (!actualizado) throw new DomainError("Equipo no encontrado", "NO_ENCONTRADO");
    return actualizado;
  },

  async listarPermisos(rolId?: string | null) {
    return adminConfigRepository.listarPermisos(rolId ?? null);
  },

  async setPermiso(modulo: string, accion: string, rolId: string, permitido: boolean) {
    if (!modulo || !accion || !rolId) throw new DomainError("Faltan datos del permiso", "DATOS_REQUERIDOS");
    await adminConfigRepository.setPermiso(modulo, accion, rolId, permitido);
  },
};
