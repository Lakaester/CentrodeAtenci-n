import { Router } from "express";
import { decisionController } from "../controllers/DecisionController";

export const decisionRouter = Router();
decisionRouter.post("/evaluate", decisionController.evaluate);
decisionRouter.get("/rules", decisionController.listRules);
