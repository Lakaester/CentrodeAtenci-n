import { Router } from "express";
import { atencionController } from "../controllers/AtencionController";

export const atencionRouter = Router();

atencionRouter.get("/", atencionController.listar);
atencionRouter.get("/:id", atencionController.obtener);
atencionRouter.post("/", atencionController.crear);
atencionRouter.post("/:id/actividades", atencionController.agregarActividad);
atencionRouter.post("/:id/hipotesis", atencionController.agregarHipotesis);
atencionRouter.post("/:id/finalizar", atencionController.finalizar);
