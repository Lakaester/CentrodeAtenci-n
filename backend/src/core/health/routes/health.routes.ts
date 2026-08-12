import { Router } from "express";
import { healthController } from "../controllers/HealthController";

export const healthRouter = Router();
healthRouter.get("/report", healthController.report);
healthRouter.get("/liveness", healthController.liveness);
healthRouter.get("/readiness", healthController.readiness);
healthRouter.get("/heartbeats", healthController.heartbeats);
