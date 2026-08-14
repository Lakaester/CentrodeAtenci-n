import { api } from "@/lib/api";

export interface AdminUsuario {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  rol: string | null;
  equipo_id: string | null;
  estado: string;
  iniciales: string | null;
  ultimo_acceso: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRol {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  es_interno: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminEquipo {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  es_interno: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPermiso {
  id: string;
  modulo: string;
  accion: string;
  rol_id: string;
  permitido: boolean;
}

export const adminService = {
  async listarUsuarios(): Promise<AdminUsuario[]> {
    const res = await api.get("/config/usuarios");
    return res.data.data ?? [];
  },
  async crearUsuario(data: { nombre: string; apellido?: string | null; email: string; rol?: string | null; equipoId?: string | null; iniciales?: string | null; password?: string }): Promise<AdminUsuario> {
    const res = await api.post("/config/usuarios", data);
    return res.data.data;
  },
  async actualizarUsuario(id: string, patch: { nombre?: string; apellido?: string | null; email?: string; rol?: string | null; equipoId?: string | null; estado?: string; iniciales?: string | null; password?: string }): Promise<AdminUsuario> {
    const res = await api.patch(`/config/usuarios/${id}`, patch);
    return res.data.data;
  },
  async listarRoles(): Promise<AdminRol[]> {
    const res = await api.get("/config/roles");
    return res.data.data ?? [];
  },
  async crearRol(nombre: string, descripcion?: string | null): Promise<AdminRol> {
    const res = await api.post("/config/roles", { nombre, descripcion });
    return res.data.data;
  },
  async actualizarRol(id: string, patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number }): Promise<AdminRol> {
    const res = await api.patch(`/config/roles/${id}`, patch);
    return res.data.data;
  },
  async listarEquipos(): Promise<AdminEquipo[]> {
    const res = await api.get("/config/equipos");
    return res.data.data ?? [];
  },
  async crearEquipo(nombre: string, descripcion?: string | null): Promise<AdminEquipo> {
    const res = await api.post("/config/equipos", { nombre, descripcion });
    return res.data.data;
  },
  async actualizarEquipo(id: string, patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number }): Promise<AdminEquipo> {
    const res = await api.patch(`/config/equipos/${id}`, patch);
    return res.data.data;
  },
  async listarPermisos(rolId?: string | null): Promise<AdminPermiso[]> {
    const res = await api.get("/config/permisos", { params: rolId ? { rolId } : {} });
    return res.data.data ?? [];
  },
  async setPermiso(modulo: string, accion: string, rolId: string, permitido: boolean): Promise<void> {
    await api.post("/config/permisos", { modulo, accion, rolId, permitido });
  },
};
