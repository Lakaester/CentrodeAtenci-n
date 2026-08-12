import type { User, AuthPayload, UserRole } from "../types";

const API_TOKEN = process.env.COPE_API_TOKEN ?? "cope-dev-token";

/**
 * AuthService — Autenticación y autorización básica.
 * Implementa JWT simplificado (sin librería externa) y API key.
 */
export class AuthService {
  /** Valida un API key y devuelve el payload de autenticación */
  authenticateApiKey(token: string): AuthPayload | null {
    if (token !== API_TOKEN) return null;
    return { userId: "system", email: "system@cope.pe", rol: "admin" };
  }

  /** Valida que un usuario tenga el rol requerido */
  authorize(payload: AuthPayload | null, roles: UserRole[]): boolean {
    if (!payload) return false;
    return roles.includes(payload.rol);
  }

  /** Decodifica un token (mock — en producción usar JWT real) */
  decodeToken(token: string): AuthPayload | null {
    if (token === API_TOKEN) return { userId: "system", email: "system@cope.pe", rol: "admin" };
    try {
      const parsed = JSON.parse(Buffer.from(token, "base64").toString());
      return { userId: parsed.userId, email: parsed.email, rol: parsed.rol };
    } catch {
      return null;
    }
  }

  /** Genera un token (mock) */
  generateToken(user: Partial<User>): string {
    const payload: AuthPayload = { userId: user.id ?? "0", email: user.email ?? "unknown", rol: user.rol ?? "agent" };
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }
}
