import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { GetTicketUseCase } from "../application/tickets/GetTicketUseCase";
import { ListTicketsUseCase } from "../application/tickets/ListTicketsUseCase";
import { AcceptTicketUseCase } from "../application/tickets/AcceptTicketUseCase";
import { AssignTicketUseCase } from "../application/tickets/AssignTicketUseCase";
import { TransferTicketUseCase } from "../application/tickets/TransferTicketUseCase";
import { ReplyTicketUseCase } from "../application/tickets/ReplyTicketUseCase";
import { ResolveTicketUseCase } from "../application/tickets/ResolveTicketUseCase";
import { CloseTicketUseCase } from "../application/tickets/CloseTicketUseCase";
import { CategorizeTicketUseCase } from "../application/tickets/CategorizeTicketUseCase";
import { TicketWorkspaceAssembler } from "../assemblers/TicketWorkspaceAssembler";
import type { ITicketRepository } from "../contracts/tickets/ITicketRepository";

export function createTicketController(repo: ITicketRepository) {
  const get = new GetTicketUseCase(repo);
  const list = new ListTicketsUseCase(repo);
  const assembler = new TicketWorkspaceAssembler();
  const accept = new AcceptTicketUseCase(repo);
  const assign = new AssignTicketUseCase(repo);
  const transfer = new TransferTicketUseCase(repo);
  const reply = new ReplyTicketUseCase(repo);
  const resolve = new ResolveTicketUseCase(repo);
  const close = new CloseTicketUseCase(repo);
  const categorize = new CategorizeTicketUseCase(repo);

  const acceptSchema = z.object({ asesorId: z.string().min(1), asesorNombre: z.string().min(1) });
  const replySchema = z.object({ mensaje: z.string().min(1), emisor: z.string().min(1) });
  const categorizeSchema = z.object({ categoria: z.string().min(1), subcategoria: z.string().optional() });

  return {
    async listar(req: Request, res: Response, next: NextFunction) {
      try {
        const { status, channel, asesorId, search, page, limit } = req.query;
        const result = await list.execute({
          status: status as string, channel: channel as string, asesorId: asesorId as string,
          search: search as string, page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined,
        });
        res.json({ ok: true, data: result.tickets.map((t) => t.toJSON()), total: result.total });
      } catch (err) { next(err); }
    },

    async obtener(req: Request, res: Response, next: NextFunction) {
      try {
        const ticket = await get.execute(req.params.id);
        if (!ticket) return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
        res.json({ ok: true, data: ticket.toJSON() });
      } catch (err) { next(err); }
    },

    async workspace(req: Request, res: Response, next: NextFunction) {
      try {
        const ticket = await get.execute(req.params.id);
        if (!ticket) return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
        const data = await assembler.assemble(ticket);
        res.json({ ok: true, data });
      } catch (err) { next(err); }
    },

    async contexto(req: Request, res: Response, next: NextFunction) {
      try {
        const ticket = await get.execute(req.params.id);
        if (!ticket) return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
        const data = await assembler.assemble(ticket);
        res.json({ ok: true, data });
      } catch (err) { next(err); }
    },

    async aceptar(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = acceptSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
        const result = await accept.execute(req.params.id, parsed.data.asesorId, parsed.data.asesorNombre);
        if (!result.success) return res.status(400).json({ ok: false, error: result.error });
        res.json({ ok: true, data: result.ticket?.toJSON() });
      } catch (err) { next(err); }
    },

    async asignar(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = acceptSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
        const result = await assign.execute(req.params.id, parsed.data.asesorId, parsed.data.asesorNombre);
        if (!result.success) return res.status(400).json({ ok: false, error: result.error });
        res.json({ ok: true, data: result.ticket?.toJSON() });
      } catch (err) { next(err); }
    },

    async transferir(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = acceptSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
        const result = await transfer.execute(req.params.id, parsed.data.asesorId, parsed.data.asesorNombre);
        if (!result.success) return res.status(400).json({ ok: false, error: result.error });
        res.json({ ok: true, data: result.ticket?.toJSON() });
      } catch (err) { next(err); }
    },

    async resolver(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await resolve.execute(req.params.id);
        if (!result.success) return res.status(400).json({ ok: false, error: result.error });
        res.json({ ok: true, data: result.ticket?.toJSON() });
      } catch (err) { next(err); }
    },

    async cerrar(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await close.execute(req.params.id);
        if (!result.success) return res.status(400).json({ ok: false, error: result.error });
        res.json({ ok: true, data: result.ticket?.toJSON() });
      } catch (err) { next(err); }
    },

    async categorizar(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = categorizeSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
        const result = await categorize.execute(req.params.id, parsed.data.categoria, parsed.data.subcategoria);
        if (!result.success) return res.status(400).json({ ok: false, error: result.error });
        res.json({ ok: true, data: result.ticket?.toJSON() });
      } catch (err) { next(err); }
    },
  };
}
