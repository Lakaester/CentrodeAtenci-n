export { useUsuarios, useRoles, useEquipos, usePermisos, useCrearUsuario, useActualizarUsuario, useCrearRol, useActualizarRol, useCrearEquipo, useActualizarEquipo, useSetPermiso } from "./hooks/useAdminConfig";
export { adminService } from "./services/adminService";
export type { AdminUsuario, AdminRol, AdminEquipo, AdminPermiso } from "./services/adminService";
