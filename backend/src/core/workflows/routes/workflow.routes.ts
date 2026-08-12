import { Router } from "express";
import { workflowController } from "../controllers/WorkflowController";

export const workflowRouter = Router();
workflowRouter.post("/definitions", workflowController.createDefinition);
workflowRouter.get("/definitions", workflowController.listDefinitions);
workflowRouter.get("/definitions/:id", workflowController.getDefinition);
workflowRouter.post("/instances", workflowController.startInstance);
workflowRouter.get("/instances", workflowController.listInstances);
workflowRouter.get("/instances/:id", workflowController.getInstance);
workflowRouter.post("/instances/:instanceId/execute", workflowController.executeStep);
workflowRouter.get("/metrics/:definitionId", workflowController.getMetrics);
