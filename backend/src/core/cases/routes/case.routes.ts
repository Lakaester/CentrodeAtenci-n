import { Router } from "express";
import { caseController } from "../controllers/CaseController";

export const caseRouter = Router();
caseRouter.post("/", caseController.create);
caseRouter.get("/", caseController.list);
caseRouter.get("/search", caseController.search);
caseRouter.get("/stats", caseController.stats);
caseRouter.get("/:id", caseController.get);
caseRouter.post("/:id/transition", caseController.transition);
caseRouter.get("/:id/sla", caseController.sla);
caseRouter.get("/:id/history", caseController.history);
