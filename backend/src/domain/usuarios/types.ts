export type Rol = "admin" | "supervisor" | "agente";
export type EstadoUsuario = "activo" | "inactivo" | "suspendido";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  equipo: string;
  estado: EstadoUsuario;
  ultimoAcceso?: string;
  createdAt: string;
}
