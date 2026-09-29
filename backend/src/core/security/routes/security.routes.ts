import { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { AuthService } from "../services/AuthService";
import { authMiddleware } from "../middleware/AuthMiddleware";

const auth = new AuthService();
export const securityRouter = Router();

/**
 * Guard de entorno: el mecanismo mock de autenticación (token base64 sin firma,
 * identidad forjable) solo está disponible fuera de producción.
 */
function soloDev(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ ok: false, error: "No encontrado" });
  }
  next();
}

securityRouter.use(soloDev);

/** POST /api/security/login — Login simple (devuelve token). Solo entorno dev. */
securityRouter.post("/login", (req, res) => {
  const { email, nombre, rol } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: "Email requerido" });
  const token = auth.generateToken({ id: email, email, nombre: nombre ?? email, rol: rol ?? "agent" });
  res.json({ ok: true, data: { token, email, rol: rol ?? "agent" } });
});

/** GET /api/security/me — Devuelve el usuario autenticado. Solo entorno dev. */
securityRouter.get("/me", authMiddleware, (req, res) => {
  res.json({ ok: true, data: req.user });
});