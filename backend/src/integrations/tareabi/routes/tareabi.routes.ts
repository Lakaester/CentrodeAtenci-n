import { Router } from "express";
import { tareabiController } from "../controllers/TareabiController";

export const tareabiRouter = Router();

tareabiRouter.post("/logs/:tareabiId/:ticketbiId", tareabiController.logs);
tareabiRouter.get("/detalle/:tareabiId", tareabiController.detalle);
tareabiRouter.get("/estados", tareabiController.estados);
