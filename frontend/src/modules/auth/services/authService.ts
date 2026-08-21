import { api } from "@/lib/api";

export interface AuthPermiso {
  modulo: string;
  accion: string;
  permitido: boolean;
}

export interface AuthUser {
  id: string;
  nombre: string;
  apellido: string | null;
  correo: string;
  rol: string | null;
  equipo: string | null;
  estado: string;
  permisos: AuthPermiso[];
  personabi_id?: string | null;
}

export type LoginErrorKind = "INVALID_CREDENTIALS" | "USER_DISABLED" | "SERVER_ERROR" | "NETWORK_ERROR";

export class LoginError extends Error {
  constructor(message: string, public kind: LoginErrorKind) {
    super(message);
    this.name = "LoginError";
  }
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const res = await api.post("/auth/login", { email, password });
      return res.data.data as AuthUser;
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 401) throw new LoginError("Correo o contraseña incorrectos.", "INVALID_CREDENTIALS");
      if (status === 403 || code === "USER_DISABLED") throw new LoginError("Tu usuario está desactivado. Contacta al administrador.", "USER_DISABLED");
      if (err?.message?.includes("timeout") || !err?.response) throw new LoginError("No se pudo conectar con el servidor.", "NETWORK_ERROR");
      throw new LoginError("No pudimos iniciar sesión. Inténtalo nuevamente.", "SERVER_ERROR");
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout", {});
    } catch {
      // ignorar
    }
  },

  async me(): Promise<AuthUser | null> {
    try {
      const res = await api.get("/auth/me");
      return res.data.data as AuthUser;
    } catch {
      return null;
    }
  },

  hasPermiso(user: AuthUser | null, modulo: string, accion: string): boolean {
    if (!user) return false;
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const p = user.permisos?.find((x) => norm(x.modulo) === norm(modulo) && norm(x.accion) === norm(accion));
    return Boolean(p?.permitido);
  },

  moduloVisible(user: AuthUser | null, modulo: string): boolean {
    return this.hasPermiso(user, modulo, "ver") || this.hasPermiso(user, modulo, "administrar");
  },
};
