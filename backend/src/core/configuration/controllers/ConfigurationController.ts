import { Request, Response, NextFunction } from "express";
import { ConfigurationRegistry } from "../registry/ConfigurationRegistry";

const registry = new ConfigurationRegistry();

export const configController = {
  list(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: registry.list() }); } catch (err) { next(err); }
  },

  get(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = registry.get(req.params.key);
      if (!entry) return res.status(404).json({ ok: false, error: "Configuración no encontrada" });
      res.json({ ok: true, data: entry });
    } catch (err) { next(err); }
  },

  set(req: Request, res: Response, next: NextFunction) {
    try {
      const { key, value, userId } = req.body;
      if (!key) return res.status(400).json({ ok: false, error: "key requerido" });
      const error = registry.set(key, value, userId ?? "api");
      if (error) return res.status(400).json({ ok: false, error });
      res.json({ ok: true, data: registry.get(key) });
    } catch (err) { next(err); }
  },

  delete(req: Request, res: Response, next: NextFunction) {
    try {
      registry.delete(req.params.key, req.body?.userId ?? "api");
      res.json({ ok: true });
    } catch (err) { next(err); }
  },

  history(req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: registry.getHistory(req.params.key) }); } catch (err) { next(err); }
  },

  audits(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: registry.getAudits() }); } catch (err) { next(err); }
  },

  registerSchema(req: Request, res: Response, next: NextFunction) {
    try {
      registry.registerSchema(req.body);
      res.json({ ok: true });
    } catch (err) { next(err); }
  },
};
