import { Router } from "express";
import { apoyosController } from "../controllers/apoyos.controller";
import { agendasController } from "../controllers/agendas.controller";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";

export const gestionRouter = Router();

// ── Google Calendar OAuth callback (ANTES de requireAuth — Google redirige sin cookie) ──
gestionRouter.get("/google-calendar/callback", agendasController.googleCalendarCallback);

gestionRouter.use(requireAuth);

// ── ASESORES (dropdowns compartidos) — requiere acceso a Gestión ──
gestionRouter.get("/asesores", requirePermission("Gestión", "ver"), apoyosController.listarAsesores);

// ── CATEGORÍAS FUNCIONALES (homologacion_categorias compartido) — requiere acceso a Gestión ──
gestionRouter.get("/categorias-funcionales", requirePermission("Gestión", "ver"), apoyosController.listarCategoriasFun);
gestionRouter.get("/categorias-funcionales/:categoria/subcategorias", requirePermission("Gestión", "ver"), apoyosController.listarSubcategoriasDeCategoria);

// ── APOYOS (submódulo independiente) ──
gestionRouter.get("/apoyos", requirePermission("Apoyos", "ver"), apoyosController.listar);
gestionRouter.get("/apoyos/kpis", requirePermission("Apoyos", "ver"), apoyosController.kpis);
gestionRouter.get("/apoyos/areas", requirePermission("Apoyos", "ver"), apoyosController.listarAreas);
gestionRouter.get("/apoyos/exportar", requirePermission("Apoyos", "exportar"), apoyosController.exportar);
gestionRouter.get("/apoyos/:id", requirePermission("Apoyos", "ver"), apoyosController.detalle);
gestionRouter.post("/apoyos", requirePermission("Apoyos", "crear"), apoyosController.crear);
gestionRouter.patch("/apoyos/:id", requirePermission("Apoyos", "editar"), apoyosController.actualizar);
gestionRouter.post("/apoyos/:id/cerrar", requirePermission("Apoyos", "editar"), apoyosController.cerrar);
gestionRouter.delete("/apoyos/:id", requirePermission("Apoyos", "eliminar"), apoyosController.eliminar);

// ── AGENDAS (submódulo independiente) ──
gestionRouter.get("/agendas", requirePermission("Agendas", "ver"), agendasController.listar);
gestionRouter.get("/agendas/kpis", requirePermission("Agendas", "ver"), agendasController.kpis);
gestionRouter.get("/agendas/rango", requirePermission("Agendas", "ver"), agendasController.porRangoFecha);
gestionRouter.get("/agendas/exportar", requirePermission("Agendas", "exportar"), agendasController.exportar);
gestionRouter.get("/agendas/:id", requirePermission("Agendas", "ver"), agendasController.detalle);
gestionRouter.post("/agendas", requirePermission("Agendas", "crear"), agendasController.crear);
gestionRouter.patch("/agendas/:id", requirePermission("Agendas", "editar"), agendasController.actualizar);
gestionRouter.patch("/agendas/:id/estado", requirePermission("Agendas", "editar"), agendasController.actualizarEstado);
gestionRouter.patch("/agendas/:id/inicio-real", requirePermission("Agendas", "editar"), agendasController.registrarInicioReal);
gestionRouter.patch("/agendas/:id/fin-real", requirePermission("Agendas", "editar"), agendasController.registrarFinReal);
gestionRouter.patch("/agendas/:id/resultado", requirePermission("Agendas", "editar"), agendasController.setResultado);
gestionRouter.patch("/agendas/:id/acta", requirePermission("Agendas", "editar"), agendasController.guardarActa);
gestionRouter.get("/agendas/:id/acta/pdf", requirePermission("Agendas", "ver"), agendasController.descargarActaPdf);
gestionRouter.post("/agendas/:id/sync-calendar", requirePermission("Agendas", "editar"), agendasController.sincronizarCalendar);
gestionRouter.post("/agendas/:id/retry-sync-calendar", requirePermission("Agendas", "editar"), agendasController.reintentarSyncCalendar);
gestionRouter.delete("/agendas/:id", requirePermission("Agendas", "eliminar"), agendasController.eliminar);

// ── Google Calendar OAuth (requiere acceso a Agendas) ──
gestionRouter.get("/google-calendar/status", requirePermission("Agendas", "ver"), agendasController.googleCalendarStatus);
gestionRouter.get("/google-calendar/info", requirePermission("Agendas", "ver"), agendasController.googleCalendarInfo);
gestionRouter.get("/google-calendar/disponibilidad", requirePermission("Agendas", "ver"), agendasController.verificarDisponibilidad);
gestionRouter.post("/google-calendar/connect", requirePermission("Agendas", "editar"), agendasController.googleCalendarConnect);
gestionRouter.post("/google-calendar/disconnect", requirePermission("Agendas", "editar"), agendasController.googleCalendarDisconnect);
gestionRouter.post("/agendas/:id/reconcile", requirePermission("Agendas", "editar"), agendasController.reconciliarAgenda);
