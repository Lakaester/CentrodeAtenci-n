/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
import { Router } from "express";
import { zendeskController } from "./ZendeskController";

export const zendeskRouter = Router();

zendeskRouter.get("/unassigned", zendeskController.unassigned);
zendeskRouter.get("/my", zendeskController.myTickets);
zendeskRouter.get("/recently-updated", zendeskController.recentlyUpdated);
zendeskRouter.get("/:ticketId", zendeskController.obtener);
zendeskRouter.get("/:ticketId/conversation", zendeskController.conversacion);

