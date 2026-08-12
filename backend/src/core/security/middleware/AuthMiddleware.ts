import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import type { AuthPayload, UserRole } from "../types";

const auth = new AuthService();

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/** Middleware que valida el token de autenticación (header Authorization) */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ ok: false, error: "Token requerido" });

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const payload = auth.decodeToken(token);
  if (!payload) return res.status(401).json({ ok: false, error: "Token inválido" });

  req.user = payload;
  next();
}

/** Middleware que verifica roles específicos */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "No autenticado" });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ ok: false, error: `Se requiere rol: ${roles.join(" o ")}` });
    }
    next();
  };
}

/** Middleware opcional: si hay token, lo decodifica; si no, continúa */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header) {
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    req.user = auth.decodeToken(token) ?? undefined;
  }
  next();
}
