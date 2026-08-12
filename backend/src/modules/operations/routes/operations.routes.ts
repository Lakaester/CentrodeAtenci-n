import { Router } from "express";
import { operationsController } from "../controllers/OperationsController";

export const operationsRouter = Router();
operationsRouter.get("/dashboard", operationsController.dashboard);
