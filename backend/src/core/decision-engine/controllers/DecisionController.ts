import { Request, Response, NextFunction } from "express";
import { RuleRegistry } from "../registry/RuleRegistry";
import { RuleEngine } from "../engine/RuleEngine";
import { DiskSpaceRule } from "../rules/DiskSpaceRule";

const registry = new RuleRegistry();
const engine = new RuleEngine(registry);

engine.register(new DiskSpaceRule());

export const decisionController = {
  async evaluate(req: Request, res: Response, next: NextFunction) {
    try {
      const { dominio } = req.body;
      if (!dominio) return res.status(400).json({ ok: false, error: "Dominio requerido" });
      const context = req.body.context ?? {};
      const result = await engine.evaluate(dominio, context);
      res.json({ ok: true, data: result });
    } catch (err) { next(err); }
  },

  async listRules(_req: Request, res: Response, next: NextFunction) {
    try {
      const rules = registry.list().map((r) => r.getDefinition());
      res.json({ ok: true, data: rules });
    } catch (err) { next(err); }
  },
};
