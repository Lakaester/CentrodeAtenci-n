import { Request, Response, NextFunction } from "express";
import { WorkflowEngine } from "../engine/WorkflowEngine";

const engine = new WorkflowEngine();

export const workflowController = {
  createDefinition(req: Request, res: Response, next: NextFunction) {
    try {
      engine.createDefinition(req.body);
      res.json({ ok: true, data: req.body });
    } catch (err) { next(err); }
  },

  listDefinitions(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: engine.registry.list() }); } catch (err) { next(err); }
  },

  getDefinition(req: Request, res: Response, next: NextFunction) {
    try {
      const def = engine.registry.get(req.params.id);
      if (!def) return res.status(404).json({ ok: false, error: "No encontrado" });
      res.json({ ok: true, data: def });
    } catch (err) { next(err); }
  },

  startInstance(req: Request, res: Response, next: NextFunction) {
    try {
      const { definitionId, context } = req.body;
      const instance = engine.startInstance(definitionId, context);
      if (!instance) return res.status(400).json({ ok: false, error: "Definición no encontrada" });
      res.json({ ok: true, data: instance });
    } catch (err) { next(err); }
  },

  async executeStep(req: Request, res: Response, next: NextFunction) {
    try {
      const exec = await engine.executeNextStep(req.params.instanceId);
      if (!exec) return res.status(400).json({ ok: false, error: "No hay paso para ejecutar" });
      res.json({ ok: true, data: exec });
    } catch (err) { next(err); }
  },

  getInstance(req: Request, res: Response, next: NextFunction) {
    try {
      const inst = engine.getInstance(req.params.id);
      if (!inst) return res.status(404).json({ ok: false, error: "No encontrada" });
      res.json({ ok: true, data: inst });
    } catch (err) { next(err); }
  },

  listInstances(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: engine.listInstances() }); } catch (err) { next(err); }
  },

  getMetrics(req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: engine.getMetrics(req.params.definitionId) }); } catch (err) { next(err); }
  },
};
