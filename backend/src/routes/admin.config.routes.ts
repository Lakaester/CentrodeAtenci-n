import { Router } from "express";
import { adminConfigController } from "../controllers/admin.config.controller";

export const adminConfigRouter = Router();

adminConfigRouter.get("/usuarios", adminConfigController.listarUsuarios);
adminConfigRouter.post("/usuarios", adminConfigController.crearUsuario);
adminConfigRouter.patch("/usuarios/:id", adminConfigController.actualizarUsuario);

adminConfigRouter.get("/roles", adminConfigController.listarRoles);
adminConfigRouter.post("/roles", adminConfigController.crearRol);
adminConfigRouter.patch("/roles/:id", adminConfigController.actualizarRol);

adminConfigRouter.get("/equipos", adminConfigController.listarEquipos);
adminConfigRouter.post("/equipos", adminConfigController.crearEquipo);
adminConfigRouter.patch("/equipos/:id", adminConfigController.actualizarEquipo);

adminConfigRouter.get("/permisos", adminConfigController.listarPermisos);
adminConfigRouter.post("/permisos", adminConfigController.setPermiso);
