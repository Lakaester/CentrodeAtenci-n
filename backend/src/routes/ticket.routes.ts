import { Router } from "express";
import { createTicketController } from "../controllers/TicketController";
import { PgTicketRepository } from "../repositories/PgTicketRepository";

const repo = new PgTicketRepository();
const controller = createTicketController(repo);

export const ticketRouter = Router();

ticketRouter.get("/", controller.listar);
ticketRouter.get("/:id", controller.obtener);
ticketRouter.get("/:id/workspace", controller.workspace);
ticketRouter.get("/:id/contexto", controller.contexto);
ticketRouter.post("/:id/aceptar", controller.aceptar);
ticketRouter.post("/:id/asignar", controller.asignar);
ticketRouter.post("/:id/transferir", controller.transferir);
ticketRouter.post("/:id/resolver", controller.resolver);
ticketRouter.post("/:id/cerrar", controller.cerrar);
ticketRouter.post("/:id/categorizar", controller.categorizar);
