import { Router } from "express";
import { facturacionConfigController } from "../controllers/facturacion.config.controller";

export const facturacionConfigRouter = Router();

facturacionConfigRouter.get("/estados", facturacionConfigController.listarEstados);
facturacionConfigRouter.get("/subcategorias", facturacionConfigController.listarSubcategorias);
facturacionConfigRouter.post("/estados", facturacionConfigController.crearEstado);
facturacionConfigRouter.post("/subcategorias", facturacionConfigController.crearSubcategoria);
facturacionConfigRouter.patch("/estados/:id", facturacionConfigController.actualizarEstado);
facturacionConfigRouter.patch("/subcategorias/:id", facturacionConfigController.actualizarSubcategoria);
