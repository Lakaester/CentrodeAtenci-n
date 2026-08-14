import { Request, Response, NextFunction } from "express";
import { authService, type AuthMe } from "../services/auth.service";

export interface AuthedRequest extends Request {
  auth?: AuthMe;
}

function leerToken(req: Request): string {
  const cookie = req.headers.cookie ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${authService.COOKIE_NAME}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = leerToken(req);
  const user = token ? await authService.usuarioPorToken(token) : null;
  if (!user) {
    return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
  }
  (req as AuthedRequest).auth = user;
  next();
}

export function requirePermission(modulo: string, accion: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthedRequest).auth;
    if (!user) {
      return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
    }
    if (!authService.hasPermiso(user, modulo, accion)) {
      return res.status(403).json({ ok: false, error: "No tienes permisos para esta acción", code: "FORBIDDEN" });
    }
    next();
  };
}

export { leerToken };
