import { Router } from "express";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { seguimientoProactivoController as controller } from "../controllers/seguimientoProactivo.controller";

export const seguimientoProactivoRouter = Router();

seguimientoProactivoRouter.use(requireAuth);

// Lectura
seguimientoProactivoRouter.get(
  "/candidatos",
  requirePermission("Clientes", "ver"),
  controller.candidatos,
);
seguimientoProactivoRouter.get(
  "/resumen",
  requirePermission("Clientes", "ver"),
  controller.resumen,
);
seguimientoProactivoRouter.get(
  "/casos",
  requirePermission("Clientes", "ver"),
  controller.listar,
);
seguimientoProactivoRouter.get(
  "/casos/:id",
  requirePermission("Clientes", "ver"),
  controller.detalle,
);
seguimientoProactivoRouter.get(
  "/casos/:id/atenciones",
  requirePermission("Clientes", "ver"),
  controller.atenciones,
);

// Escritura
seguimientoProactivoRouter.post(
  "/lotes",
  requirePermission("Clientes", "crear"),
  controller.crearLote,
);
seguimientoProactivoRouter.post(
  "/casos/:id/gestiones",
  requirePermission("Clientes", "editar"),
  controller.gestionar,
);
seguimientoProactivoRouter.patch(
  "/casos/:id",
  requirePermission("Clientes", "editar"),
  controller.actualizar,
);
