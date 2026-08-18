import { Router } from "express";
import { localbiController } from "../controllers/LocalbiController";

export const localbiRouter = Router();

localbiRouter.get("/search", localbiController.search);
localbiRouter.get("/historia/:unidadNegocio", localbiController.historia);
localbiRouter.get("/health", localbiController.health);
localbiRouter.get("/actividad", localbiController.actividad);
localbiRouter.get("/soporte", localbiController.soporte);
