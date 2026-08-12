/** @deprecated Este mÛdulo ha sido reemplazado por modules/zendesk-test/. Se eliminar· en M2. */
import { Request, Response, NextFunction } from "express";
import { ZendeskRepository } from "../infrastructure/ZendeskRepository";

const repo = new ZendeskRepository();

export const zendeskController = {
  async unassigned(req: Request, res: Response, next: NextFunction) {
    try {
      const { page } = req.query;
      const result = await repo.obtenerUnassigned(page ? Number(page) : undefined);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  async myTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { page } = req.query;
      const result = await repo.obtenerMyTickets(page ? Number(page) : undefined);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  async recentlyUpdated(req: Request, res: Response, next: NextFunction) {
    try {
      const { page } = req.query;
      const result = await repo.obtenerRecentlyUpdated(page ? Number(page) : undefined);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.ticketId);
      if (isNaN(id)) return res.status(400).json({ ok: false, error: "ID inv√°lido" });
      const ticket = await repo.obtenerAtencion(id);
      if (!ticket) return res.status(404).json({ ok: false, error: "Ticket no encontrado en Zendesk" });
      res.json({ ok: true, data: ticket });
    } catch (err) { next(err); }
  },

  async conversacion(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = Number(req.params.ticketId);
      if (isNaN(ticketId)) return res.status(400).json({ ok: false, error: "ID inv√°lido" });
      const result = await repo.obtenerConversacion(ticketId);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },
};

