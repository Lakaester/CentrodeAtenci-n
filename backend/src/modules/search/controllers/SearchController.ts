import { Request, Response, NextFunction } from "express";
import { SearchEngine } from "../engine/SearchEngine";
import { CustomerMemorySearchProvider } from "../providers/CustomerMemorySearchProvider";

const engine = new SearchEngine();
engine.registerProvider(new CustomerMemorySearchProvider());

export const searchController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string)?.trim();
      if (!q) return res.status(400).json({ ok: false, error: "Parámetro q requerido" });
      const result = await engine.search(q);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },
};
