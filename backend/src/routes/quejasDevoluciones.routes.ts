import { Router } from "express";
import { qdController } from "../controllers/quejasDevoluciones.controller";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";

export const qdRouter = Router();

qdRouter.use(requireAuth);

// Lectura: requiere permiso "ver"
qdRouter.get("/devoluciones", requirePermission("Quejas y Devoluciones", "ver"), qdController.listarDevoluciones);
qdRouter.get("/quejas", requirePermission("Quejas y Devoluciones", "ver"), qdController.listarQuejas);
qdRouter.get("/casos/:id", requirePermission("Quejas y Devoluciones", "ver"), qdController.detalle);
qdRouter.get("/casos/ticket/:ticketId", requirePermission("Quejas y Devoluciones", "ver"), qdController.porTicket);
qdRouter.get("/catalogo/estados", requirePermission("Quejas y Devoluciones", "ver"), qdController.listarEstados);
qdRouter.get("/catalogo/resultados", requirePermission("Quejas y Devoluciones", "ver"), qdController.listarResultados);
qdRouter.get("/catalogo/areas", requirePermission("Quejas y Devoluciones", "ver"), qdController.listarAreas);
qdRouter.get("/catalogo/productos", requirePermission("Quejas y Devoluciones", "ver"), qdController.listarProductos);
qdRouter.get("/catalogo/tipos-queja", requirePermission("Quejas y Devoluciones", "ver"), qdController.listarTiposQueja);
qdRouter.get("/catalogo/dominios", requirePermission("Quejas y Devoluciones", "ver"), qdController.listarDominios);

// Exportación: requiere permiso "exportar"
qdRouter.get("/exportar", requirePermission("Quejas y Devoluciones", "exportar"), qdController.exportar);

// Escritura: requiere permiso "crear" / "editar"
qdRouter.post("/casos", requirePermission("Quejas y Devoluciones", "crear"), qdController.crear);
qdRouter.patch("/casos/:id", requirePermission("Quejas y Devoluciones", "editar"), qdController.actualizar);
qdRouter.post("/casos/:id/interacciones", requirePermission("Quejas y Devoluciones", "editar"), qdController.asociarInteraccion);
qdRouter.post("/casos/:id/vincular-ticket", requirePermission("Quejas y Devoluciones", "editar"), qdController.vincularTicket);
qdRouter.patch("/casos/:id/dominio", requirePermission("Quejas y Devoluciones", "editar"), qdController.asignarDominio);
qdRouter.post("/casos/:id/cerrar", requirePermission("Quejas y Devoluciones", "editar"), qdController.cerrarCaso);
qdRouter.post("/casos/:id/reabrir", requirePermission("Quejas y Devoluciones", "editar"), qdController.reabrirCaso);
qdRouter.post("/casos/consolidar", requirePermission("Quejas y Devoluciones", "administrar"), qdController.consolidarCasos);
qdRouter.post("/catalogo/:tabla", requirePermission("Quejas y Devoluciones", "administrar"), qdController.crearCatalogo);
qdRouter.patch("/catalogo/:tabla/:id", requirePermission("Quejas y Devoluciones", "administrar"), qdController.actualizarCatalogo);

// Eliminación controlada: requiere permiso "eliminar" (solo casos MANUAL)
qdRouter.delete("/casos/:id", requirePermission("Quejas y Devoluciones", "eliminar"), qdController.eliminar);

// Carga retroactiva (BACKFILL) del histórico real: requiere permiso "administrar"
qdRouter.post("/backfill", requirePermission("Quejas y Devoluciones", "administrar"), qdController.backfill);
