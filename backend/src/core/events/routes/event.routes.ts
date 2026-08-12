import { Router } from "express";
import { EventBus } from "../bus/EventBus";
import { EventRegistry } from "../registry/EventRegistry";
import { createEventController } from "../controllers/EventController";

export function createEventRouter(bus: EventBus, registry: EventRegistry) {
  const router = Router();
  const ctrl = createEventController(bus, registry);
  router.get("/history", ctrl.listHistory);
  router.get("/types", ctrl.listEvents);
  router.get("/subscriptions", ctrl.listSubscriptions);
  return router;
}
