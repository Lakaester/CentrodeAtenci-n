import { Router } from "express";
import { knowledgeController } from "../controllers/KnowledgeController";

export const knowledgeRouter = Router();
knowledgeRouter.post("/articles", knowledgeController.create);
knowledgeRouter.get("/articles", knowledgeController.search);
knowledgeRouter.get("/articles/:id", knowledgeController.get);
knowledgeRouter.patch("/articles/:id/status", knowledgeController.updateStatus);
knowledgeRouter.get("/stats", knowledgeController.stats);
