import { Router } from "express";
import { facturacionController } from "../controllers/facturacion.controller";
import { facturacionSourceController } from "../controllers/facturacionSource.controller";
import { facturacionCasosController } from "../controllers/facturacion.casos.controller";
import { requirePermission } from "../middlewares/auth.middleware";

const MOD = "Control de Facturación";

export const facturacionRouter = Router();

// ── Fuente (solo lectura; el contrato no se modifica) ──
facturacionRouter.get("/source/status", requirePermission(MOD, "ver"), facturacionSourceController.status);

// ── Intervenciones existentes (ahora con permisos por acción) ──
facturacionRouter.get("/intervencion/activa", requirePermission(MOD, "ver"), facturacionController.activa);
facturacionRouter.get("/intervenciones", requirePermission(MOD, "ver"), facturacionController.listar);
facturacionRouter.get("/intervenciones/cliente", requirePermission(MOD, "ver"), facturacionController.porCliente);
facturacionRouter.post("/intervenciones", requirePermission(MOD, "crear"), facturacionController.crear);
facturacionRouter.post("/intervenciones/:id/pausar", requirePermission(MOD, "editar"), facturacionController.pausar);
facturacionRouter.post("/intervenciones/:id/reanudar", requirePermission(MOD, "editar"), facturacionController.reanudar);
facturacionRouter.post("/intervenciones/:id/finalizar", requirePermission(MOD, "editar"), facturacionController.finalizar);
facturacionRouter.post("/intervenciones/:id/actividades", requirePermission(MOD, "editar"), facturacionController.registrarActividad);
facturacionRouter.patch("/intervenciones/:id", requirePermission(MOD, "editar"), facturacionController.actualizar);

// ── Casos operativos (Historia 1-12) ──
facturacionRouter.get("/casos", requirePermission(MOD, "ver"), facturacionCasosController.listar);
facturacionRouter.get("/casos/por-dominio", requirePermission(MOD, "ver"), facturacionCasosController.porDominio);
facturacionRouter.get("/casos/categorias", requirePermission(MOD, "ver"), facturacionCasosController.listarCategorias);
facturacionRouter.get("/casos/categorias/:categoriaId/subcategorias", requirePermission(MOD, "ver"), facturacionCasosController.listarSubcategorias);
facturacionRouter.get("/casos/:id", requirePermission(MOD, "ver"), facturacionCasosController.detalle);
facturacionRouter.get("/casos/:id/snapshots", requirePermission(MOD, "ver"), facturacionCasosController.snapshots);
facturacionRouter.post("/casos/:id/asignar", requirePermission(MOD, "editar"), facturacionCasosController.asignar);
facturacionRouter.post("/casos/:id/estado", requirePermission(MOD, "editar"), facturacionCasosController.cambiarEstado);
facturacionRouter.post("/casos/:id/snapshots", requirePermission(MOD, "editar"), facturacionCasosController.registrarSnapshot);
facturacionRouter.patch("/casos/:id/categoria", requirePermission(MOD, "editar"), facturacionCasosController.cambiarCategoria);

// Exportación del histórico (Historia 9) — permiso exportar
facturacionRouter.get("/exportar", requirePermission(MOD, "exportar"), facturacionCasosController.exportar);
