import { Router } from "express";
import { facturacionController } from "../controllers/facturacion.controller";
import { facturacionSourceController } from "../controllers/facturacionSource.controller";

export const facturacionRouter = Router();

facturacionRouter.get("/source/status", facturacionSourceController.status);
facturacionRouter.get("/intervencion/activa", facturacionController.activa);
facturacionRouter.get("/intervenciones", facturacionController.listar);
facturacionRouter.get("/intervenciones/cliente", facturacionController.porCliente);
facturacionRouter.post("/intervenciones", facturacionController.crear);
facturacionRouter.post("/intervenciones/:id/pausar", facturacionController.pausar);
facturacionRouter.post("/intervenciones/:id/reanudar", facturacionController.reanudar);
facturacionRouter.post("/intervenciones/:id/finalizar", facturacionController.finalizar);
facturacionRouter.post("/intervenciones/:id/actividades", facturacionController.registrarActividad);
facturacionRouter.patch("/intervenciones/:id", facturacionController.actualizar);
