import { Router } from "express";
import { validateFilters } from "../validators/filters.validator";
import { dashboardController } from "../controllers/dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.get("/resumen", validateFilters, dashboardController.resumen);
dashboardRouter.get("/sla", validateFilters, dashboardController.sla);
dashboardRouter.get("/operacion", validateFilters, dashboardController.operacion);
dashboardRouter.get("/asesores", validateFilters, dashboardController.asesores);
dashboardRouter.get("/categorias", validateFilters, dashboardController.categorias);
dashboardRouter.get("/categorias-v2", validateFilters, dashboardController.categoriasV2);
dashboardRouter.get("/clientes", validateFilters, dashboardController.clientes);
dashboardRouter.get("/clientes-v2", validateFilters, dashboardController.clientesV2);
dashboardRouter.get("/whatsapp", validateFilters, dashboardController.whatsapp);
dashboardRouter.get("/zendesk", validateFilters, dashboardController.zendesk);
dashboardRouter.get("/tendencias", validateFilters, dashboardController.tendencias);
dashboardRouter.get("/pais", validateFilters, dashboardController.pais);
dashboardRouter.get("/asesores-matrix", validateFilters, dashboardController.asesoresMatrix);
dashboardRouter.get("/detalle", validateFilters, dashboardController.detalle);
dashboardRouter.get("/opciones", dashboardController.opciones);
dashboardRouter.get("/quejas-devoluciones", validateFilters, dashboardController.quejasDevoluciones);
