import { Router } from "express";
import { contactoController } from "../controllers/contacto.controller";

export const contactoRouter = Router();

// Todas las rutas exigen autenticación (se montan con requireAuth en index).
contactoRouter.get("/dominio", contactoController.resolver);
contactoRouter.post("/dominio", contactoController.vincular);
contactoRouter.delete("/dominio", contactoController.desvincular);