import { Router } from "express";
import { zendeskTestController } from "./ZendeskTestController";

export const zendeskTestRouter = Router();

zendeskTestRouter.get("/test", zendeskTestController.test);
zendeskTestRouter.get("/views", zendeskTestController.views);
zendeskTestRouter.get("/inbox", zendeskTestController.inbox);
zendeskTestRouter.get("/tickets/:id", zendeskTestController.ticketDetail);
zendeskTestRouter.get("/tickets/:id/comments", zendeskTestController.ticketComments);
zendeskTestRouter.get("/atenciones/:id", zendeskTestController.atencionCompleta);
zendeskTestRouter.get("/completa/:id", zendeskTestController.atencionCompleta);
zendeskTestRouter.put("/tickets/:id/domain", zendeskTestController.updateDomain);
zendeskTestRouter.get("/client", zendeskTestController.getClientInfo);
zendeskTestRouter.post("/client/domain", zendeskTestController.addClientDomain);
zendeskTestRouter.get("/agents", zendeskTestController.getAgents);
zendeskTestRouter.post("/tickets/:id/reply-resolve", zendeskTestController.replyResolve);
zendeskTestRouter.get("/history/:requesterId", zendeskTestController.history);
zendeskTestRouter.get("/customer-memory", zendeskTestController.getCustomerMemory);
zendeskTestRouter.post("/customer-memory/domain", zendeskTestController.linkDomainCustomerMemory);
zendeskTestRouter.get("/customer-memory/suggest", zendeskTestController.checkDomainSuggestion);
zendeskTestRouter.get("/users/:id", zendeskTestController.customer);
zendeskTestRouter.get("/users/:id/timeline", zendeskTestController.customerTimeline);
zendeskTestRouter.get("/agents", zendeskTestController.agents);

zendeskTestRouter.post("/tickets/:id/internal-note", zendeskTestController.internalNote);
zendeskTestRouter.post("/tickets/:id/assign", zendeskTestController.assign);
zendeskTestRouter.post("/tickets/:id/status", zendeskTestController.changeStatus);
zendeskTestRouter.post("/tickets/:id/categorize", zendeskTestController.categorize);
zendeskTestRouter.post("/tickets/:id/reply", zendeskTestController.reply);
