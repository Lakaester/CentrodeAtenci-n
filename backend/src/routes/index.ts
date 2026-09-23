import { Router } from "express";
import { healthRouter } from "./health.routes";
import { dashboardRouter } from "./dashboard.routes";
import { ticketRouter } from "./ticket.routes";
import { atencionRouter } from "./atencion.routes";
// @deprecated — módulo zendesk/ no utilizado. La implementación activa está en modules/zendesk-test/
// import { zendeskRouter } from "../modules/zendesk/presentation/ZendeskRoutes";
import { guiaRouter } from "./guia.routes";
import { herramientaRouter } from "./herramienta.routes";
import { zendeskTestRouter } from "../modules/zendesk-test/ZendeskTestRoutes";
import { printerRouter } from "../integrations/printer/routes/printer.routes";
import { localbiRouter } from "../integrations/localbi/routes/localbi.routes";
import { tareabiRouter } from "../integrations/tareabi/routes/tareabi.routes";
import { facturacionRouter } from "./facturacion.routes";
import { facturacionConfigRouter } from "./facturacion.config.routes";
import { adminConfigRouter } from "./admin.config.routes";
import { customerRouter } from "../core/customer/controllers/customer.routes";
import { searchRouter } from "../modules/search/routes/search.routes";
import { decisionRouter } from "../core/decision-engine/routes/decision.routes";
import { knowledgeRouter } from "../core/knowledge/routes/knowledge.routes";
import { caseRouter } from "../core/cases/routes/case.routes";
import { workflowRouter } from "../core/workflows/routes/workflow.routes";
import { pluginRouter } from "../core/plugins/routes/plugin.routes";
import { getEventRouter } from "../core/events/bootstrap";
import { securityRouter } from "../core/security/routes/security.routes";
import { configRouter } from "../core/configuration/routes/config.routes";
import { healthRouter as coreHealthRouter } from "../core/health/routes/health.routes";
import { operationsRouter } from "../modules/operations/routes/operations.routes";
import { authRouter } from "./auth.routes";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { qdRouter } from "./quejasDevoluciones.routes";
import { ticketbiRouter } from "../integrations/ticketbi/routes/ticketbi.routes";
import { integracionesRouter } from "../integrations/integraciones/routes/integraciones.routes";
import { contactoRouter } from "./contacto.routes";
import { atencionOperativaRouter } from "../integrations/atenciones/routes/atencionOperativa.routes";
import { gestionRouter } from "./gestion.routes";

export const apiRouter = Router();

const eventRouter = getEventRouter();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/quejas-devoluciones", requireAuth, qdRouter);
apiRouter.use("/dashboard", requireAuth, dashboardRouter);
apiRouter.use("/tickets", requireAuth, ticketRouter);
apiRouter.use("/contactos", requireAuth, contactoRouter);

const atencionesRouter = Router();
atencionesRouter.use("/", requireAuth, atencionRouter);
atencionesRouter.use("/", requireAuth, atencionOperativaRouter);
atencionesRouter.use("/", requireAuth, ticketbiRouter);
// atencionesRouter.use("/zendesk", zendeskRouter); // @deprecated — usar /api/zendesk/* (modules/zendesk-test/)
apiRouter.use("/atenciones", atencionesRouter);

apiRouter.use("/guias", requireAuth, guiaRouter);
apiRouter.use("/herramientas", requireAuth, herramientaRouter);
apiRouter.use("/zendesk", requireAuth, zendeskTestRouter);
apiRouter.use("/printer", printerRouter);
// Rutas sensibles protegidas: requieren sesión autenticada.
apiRouter.use("/localbi", requireAuth, localbiRouter);
apiRouter.use("/tareabi", requireAuth, tareabiRouter);
apiRouter.use("/integraciones", requireAuth, integracionesRouter);
apiRouter.use("/control-facturacion", requireAuth, facturacionRouter);
apiRouter.use("/control-facturacion/config", requireAuth, facturacionConfigRouter);
apiRouter.use("/config", requireAuth, requirePermission("Configuracion", "administrar"), adminConfigRouter);
apiRouter.use("/customer", requireAuth, customerRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/decision", decisionRouter);
apiRouter.use("/knowledge", knowledgeRouter);
apiRouter.use("/cases", caseRouter);
apiRouter.use("/workflows", workflowRouter);
apiRouter.use("/plugins", pluginRouter);
apiRouter.use("/dev/events", eventRouter);
apiRouter.use("/security", securityRouter);
apiRouter.use("/config", requireAuth, requirePermission("Configuracion", "administrar"), configRouter);
apiRouter.use("/health", coreHealthRouter);
apiRouter.use("/operations", operationsRouter);
apiRouter.use("/gestion", gestionRouter);
