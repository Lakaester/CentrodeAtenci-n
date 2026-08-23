import { Router } from "express";
import { integracionesController } from "../controllers/IntegracionesController";

export const integracionesRouter = Router();

integracionesRouter.get("/dominio/:dominio", integracionesController.porDominio);
integracionesRouter.post("/pedidos", integracionesController.buscarPedidos);
