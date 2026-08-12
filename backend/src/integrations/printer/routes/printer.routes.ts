import { Router } from "express";
import { printerController } from "../controllers/PrinterController";

export const printerRouter = Router();

printerRouter.get("/feature-flags", printerController.listFeatureFlags);
printerRouter.post("/feature-flags", printerController.updateFeatureFlag);
printerRouter.get("/logs", printerController.getLogs);
