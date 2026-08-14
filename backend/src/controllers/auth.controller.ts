import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { leerToken } from "../middlewares/auth.middleware";
import { DomainError } from "../core/errors/types";

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

function toHttp(err: unknown): number {
  if (err instanceof DomainError) {
    if (err.code === "INVALID_CREDENTIALS") return 401;
    if (err.code === "USER_DISABLED") return 403;
    return 400;
  }
  return 500;
}

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Correo y contraseña requeridos" });

      const { token, user } = await authService.login(parsed.data.email, parsed.data.password);

      res.cookie(authService.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 12,
        path: "/",
      });

      res.json({ ok: true, data: user });
    } catch (err) {
      res.status(toHttp(err)).json({ ok: false, error: err instanceof Error ? err.message : "No pudimos iniciar sesión. Inténtalo nuevamente." });
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = leerToken(req);
      await authService.logout(token);
      res.clearCookie(authService.COOKIE_NAME, { path: "/" });
      res.json({ ok: true });
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const token = leerToken(req);
      const user = token ? await authService.usuarioPorToken(token) : null;
      if (!user) return res.status(401).json({ ok: false, error: "No autenticado", code: "UNAUTHENTICATED" });
      res.json({ ok: true, data: user });
    } catch (err) { next(err); }
  },
};
