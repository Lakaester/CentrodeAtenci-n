import { Router } from "express";
import { herramientaController } from "../controllers/HerramientaController";

export const herramientaRouter = Router();

herramientaRouter.get("/", herramientaController.listar);
herramientaRouter.get("/:id", herramientaController.obtener);
herramientaRouter.post("/", herramientaController.crear);
herramientaRouter.put("/:id", herramientaController.actualizar);
herramientaRouter.delete("/:id", herramientaController.eliminar);
