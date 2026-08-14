import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/adminService";

const KEY = ["admin", "config"];

export function useUsuarios() {
  return useQuery({ queryKey: [...KEY, "usuarios"], queryFn: () => adminService.listarUsuarios(), staleTime: 30_000, retry: 1 });
}

export function useRoles() {
  return useQuery({ queryKey: [...KEY, "roles"], queryFn: () => adminService.listarRoles(), staleTime: 30_000, retry: 1 });
}

export function useEquipos() {
  return useQuery({ queryKey: [...KEY, "equipos"], queryFn: () => adminService.listarEquipos(), staleTime: 30_000, retry: 1 });
}

export function usePermisos(rolId?: string | null) {
  return useQuery({
    queryKey: [...KEY, "permisos", rolId ?? "all"],
    queryFn: () => adminService.listarPermisos(rolId ?? null),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; apellido?: string | null; email: string; rol?: string | null; equipoId?: string | null; iniciales?: string | null; password?: string }) => adminService.crearUsuario(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "usuarios"] }),
  });
}

export function useActualizarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { nombre?: string; apellido?: string | null; email?: string; rol?: string | null; equipoId?: string | null; estado?: string; iniciales?: string | null; password?: string } }) =>
      adminService.actualizarUsuario(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "usuarios"] }),
  });
}

export function useCrearRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string | null }) => adminService.crearRol(data.nombre, data.descripcion),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "roles"] }),
  });
}

export function useActualizarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number } }) => adminService.actualizarRol(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "roles"] }),
  });
}

export function useCrearEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string | null }) => adminService.crearEquipo(data.nombre, data.descripcion),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "equipos"] }),
  });
}

export function useActualizarEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number } }) => adminService.actualizarEquipo(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "equipos"] }),
  });
}

export function useSetPermiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ modulo, accion, rolId, permitido }: { modulo: string; accion: string; rolId: string; permitido: boolean }) =>
      adminService.setPermiso(modulo, accion, rolId, permitido),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "permisos"] }),
  });
}
