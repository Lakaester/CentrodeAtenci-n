import { Request, Response, NextFunction } from "express";
import { PluginManager } from "../manager/PluginManager";

const manager = new PluginManager();

export const pluginController = {
  install(req: Request, res: Response, next: NextFunction) {
    try {
      const plugin = manager.install(req.body);
      res.json({ ok: true, data: plugin });
    } catch (err) { next(err); }
  },

  list(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: manager.listPlugins() }); } catch (err) { next(err); }
  },

  get(req: Request, res: Response, next: NextFunction) {
    try {
      const plugin = manager.getPlugin(req.params.id);
      if (!plugin) return res.status(404).json({ ok: false, error: "No encontrado" });
      res.json({ ok: true, data: plugin });
    } catch (err) { next(err); }
  },

  enable(req: Request, res: Response, next: NextFunction) {
    try {
      const plugin = manager.enable(req.params.id);
      if (!plugin) return res.status(400).json({ ok: false, error: "No se pudo habilitar" });
      res.json({ ok: true, data: plugin });
    } catch (err) { next(err); }
  },

  disable(req: Request, res: Response, next: NextFunction) {
    try {
      const plugin = manager.disable(req.params.id);
      if (!plugin) return res.status(400).json({ ok: false, error: "No se pudo deshabilitar" });
      res.json({ ok: true, data: plugin });
    } catch (err) { next(err); }
  },

  remove(req: Request, res: Response, next: NextFunction) {
    try {
      const plugin = manager.remove(req.params.id);
      if (!plugin) return res.status(400).json({ ok: false, error: "No se pudo eliminar" });
      res.json({ ok: true, data: plugin });
    } catch (err) { next(err); }
  },

  capabilities(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: manager.capabilities.listCapabilities() }); } catch (err) { next(err); }
  },

  health(req: Request, res: Response, next: NextFunction) {
    try {
      const h = manager.getHealth(req.params.id);
      if (!h) return res.status(404).json({ ok: false, error: "No encontrado" });
      res.json({ ok: true, data: h });
    } catch (err) { next(err); }
  },

  stats(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: manager.getStats() }); } catch (err) { next(err); }
  },
};
