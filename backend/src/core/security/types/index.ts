export type UserRole = "admin" | "supervisor" | "agent";

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  token?: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  rol: UserRole;
}
