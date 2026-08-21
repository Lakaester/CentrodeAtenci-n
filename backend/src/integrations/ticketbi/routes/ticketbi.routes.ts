import { Router } from "express";
import { ticketbiController } from "../controllers/TicketbiController";

export const ticketbiRouter = Router();

ticketbiRouter.post("/ticket-desarrollo", ticketbiController.crearTicket);
ticketbiRouter.get("/ticket-catalogos/categorias", ticketbiController.categorias);
ticketbiRouter.get("/ticket-catalogos/subcategorias", ticketbiController.subcategorias);
ticketbiRouter.get("/ticket-catalogos/niveles", ticketbiController.niveles);
ticketbiRouter.get("/ticket-catalogos/areas", ticketbiController.areas);