import { Request, Response, NextFunction } from "express";
import { CaseManager } from "../manager/CaseManager";

const manager = new CaseManager();

export const caseController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const c = manager.create(req.body);
      res.json({ ok: true, data: c });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const c = manager.get(req.params.id);
      if (!c) return res.status(404).json({ ok: false, error: "Caso no encontrado" });
      res.json({ ok: true, data: c });
    } catch (err) { next(err); }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: manager.list() }); } catch (err) { next(err); }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) ?? "";
      res.json({ ok: true, data: manager.search(q) });
    } catch (err) { next(err); }
  },

  async transition(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, userId, comment } = req.body;
      const result = manager.transition(req.params.id, status, userId, comment ?? "");
      if (!result) return res.status(400).json({ ok: false, error: "Transición inválida" });
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  async sla(req: Request, res: Response, next: NextFunction) {
    try {
      const slaData = manager.getSLA(req.params.id);
      if (!slaData) return res.status(404).json({ ok: false, error: "Caso no encontrado" });
      res.json({ ok: true, data: slaData });
    } catch (err) { next(err); }
  },

  async history(req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: manager.getHistory(req.params.id) }); } catch (err) { next(err); }
  },

  async stats(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: manager.getStats() }); } catch (err) { next(err); }
  },
};
