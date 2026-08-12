import { Router } from "express";
import { AuthService } from "../services/AuthService";
import { authMiddleware } from "../middleware/AuthMiddleware";

const auth = new AuthService();
export const securityRouter = Router();

/** POST /api/security/login — Login simple (devuelve token) */
securityRouter.post("/login", (req, res) => {
  const { email, nombre, rol } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: "Email requerido" });
  const token = auth.generateToken({ id: email, email, nombre: nombre ?? email, rol: rol ?? "agent" });
  res.json({ ok: true, data: { token, email, rol: rol ?? "agent" } });
});

/** GET /api/security/me — Devuelve el usuario autenticado */
securityRouter.get("/me", authMiddleware, (req, res) => {
  res.json({ ok: true, data: req.user });
});
