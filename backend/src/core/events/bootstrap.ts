import { EventBus } from "./bus/EventBus";
import { EventRegistry } from "./registry/EventRegistry";
import { createEventRouter } from "./routes/event.routes";

let bus: EventBus;
let registry: EventRegistry;
let eventRouter: ReturnType<typeof createEventRouter> | null = null;

export function initEvents() {
  bus = new EventBus();
  registry = new EventRegistry();
  console.log(`[Events] Bus iniciado con ${registry.list().length} tipos de eventos`);
  return { bus, registry };
}

export function getEventBus(): EventBus {
  if (!bus) throw new Error("EventBus no inicializado");
  return bus;
}

export function getEventRouter() {
  if (!eventRouter) eventRouter = createEventRouter(bus, registry);
  return eventRouter;
}
