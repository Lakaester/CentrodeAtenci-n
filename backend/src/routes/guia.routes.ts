import { Router } from "express";
import { guiaController } from "../controllers/GuiaController";

export const guiaRouter = Router();

guiaRouter.get("/", guiaController.listar);
guiaRouter.get("/:id", guiaController.obtener);
guiaRouter.post("/", guiaController.crear);
guiaRouter.put("/:id", guiaController.actualizar);
guiaRouter.delete("/:id", guiaController.eliminar);
