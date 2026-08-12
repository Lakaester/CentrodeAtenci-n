import { Router } from "express";
import { pluginController } from "../controllers/PluginController";

export const pluginRouter = Router();
pluginRouter.post("/", pluginController.install);
pluginRouter.get("/", pluginController.list);
pluginRouter.get("/capabilities", pluginController.capabilities);
pluginRouter.get("/stats", pluginController.stats);
pluginRouter.get("/:id", pluginController.get);
pluginRouter.post("/:id/enable", pluginController.enable);
pluginRouter.post("/:id/disable", pluginController.disable);
pluginRouter.delete("/:id", pluginController.remove);
pluginRouter.get("/:id/health", pluginController.health);
