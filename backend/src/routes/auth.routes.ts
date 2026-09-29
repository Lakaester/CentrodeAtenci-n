import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { loginRateLimiter } from "../middlewares/loginRateLimit.middleware";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authController.me);
