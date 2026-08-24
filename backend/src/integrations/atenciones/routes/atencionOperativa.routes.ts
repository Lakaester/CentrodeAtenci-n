import { Router } from "express";
import { atencionOperativaController } from "../controllers/AtencionOperativaController";

/**
 * Rutas del registro operativo de atenciones (COPE).
 * Se montan bajo /api/atenciones/:id/operativa (requiere auth).
 *
 * La atención es la entidad conceptual de COPE; zendesk_ticket_id es la
 * referencia externa. Estas rutas persisten el SNAPSHOT OPERATIVO:
 * identificación, clasificación, calificación y auditoría.
 */
export const atencionOperativaRouter = Router();

atencionOperativaRouter.get("/:id/operativa", atencionOperativaController.obtener);
atencionOperativaRouter.post("/:id/operativa/identificacion", atencionOperativaController.registrarIdentificacion);
atencionOperativaRouter.post("/:id/operativa/clasificacion", atencionOperativaController.registrarClasificacion);
atencionOperativaRouter.post("/:id/operativa/calificacion", atencionOperativaController.registrarCalificacion);
atencionOperativaRouter.post("/:id/operativa/acciones", atencionOperativaController.registrarAccion);