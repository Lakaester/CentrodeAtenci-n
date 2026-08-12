import { Router } from "express";
import { configController } from "../controllers/ConfigurationController";

export const configRouter = Router();
configRouter.get("/", configController.list);
configRouter.get("/audits", configController.audits);
configRouter.get("/:key", configController.get);
configRouter.get("/:key/history", configController.history);
configRouter.post("/", configController.set);
configRouter.post("/schemas", configController.registerSchema);
configRouter.delete("/:key", configController.delete);
