import { Request, Response, NextFunction } from "express";
import { KnowledgeEngine } from "../engine/KnowledgeEngine";

const engine = new KnowledgeEngine();

export const knowledgeController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      engine.createArticle(req.body);
      res.json({ ok: true, data: req.body });
    } catch (err) { next(err); }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) ?? "";
      const results = engine.search(q);
      res.json({ ok: true, data: { results, total: results.length } });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const article = engine.getArticle(req.params.id);
      if (!article) return res.status(404).json({ ok: false, error: "No encontrado" });
      res.json({ ok: true, data: article });
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const article = engine.updateStatus(req.params.id, status);
      if (!article) return res.status(404).json({ ok: false, error: "No encontrado" });
      res.json({ ok: true, data: article });
    } catch (err) { next(err); }
  },

  async stats(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: engine.getStats() }); } catch (err) { next(err); }
  },
};
