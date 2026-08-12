import { Request, Response, NextFunction } from "express";
import { EventBus } from "../bus/EventBus";
import { EventRegistry } from "../registry/EventRegistry";

export function createEventController(bus: EventBus, registry: EventRegistry) {
  return {
    async listHistory(_req: Request, res: Response, next: NextFunction) {
      try { res.json({ ok: true, data: bus.getHistory(200) }); } catch (err) { next(err); }
    },
    async listEvents(_req: Request, res: Response, next: NextFunction) {
      try { res.json({ ok: true, data: registry.list() }); } catch (err) { next(err); }
    },
    async listSubscriptions(_req: Request, res: Response, next: NextFunction) {
      try { res.json({ ok: true, data: bus.list() }); } catch (err) { next(err); }
    },
  };
}
