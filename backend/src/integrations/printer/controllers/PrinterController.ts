import { Request, Response, NextFunction } from "express";
import { PrinterService } from "../services/PrinterService";
import { updateFeatureFlagSchema } from "../dto/FeatureFlag.dto";
import { printerLogQuerySchema } from "../dto/PrinterLog.dto";
import { z } from "zod";

const service = new PrinterService();

const domainSchema = z.object({
  dominio: z.string().min(1, "Dominio requerido"),
});

export const printerController = {
  async listFeatureFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = domainSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: "Dominio requerido" });
      const result = await service.listFeatureFlags(parsed.data.dominio);
      if (!result.success) return res.status(502).json({ ok: false, error: result.error ?? "Error del gateway" });
      res.json({ ok: true, data: result.data });
    } catch (err) { next(err); }
  },

  async updateFeatureFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedDomain = domainSchema.safeParse(req.body);
      if (!parsedDomain.success) return res.status(400).json({ ok: false, error: "Dominio requerido" });
      const parsed = updateFeatureFlagSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const result = await service.updateFeatureFlag(parsedDomain.data.dominio, parsed.data);
      if (!result.success) return res.status(502).json({ ok: false, error: result.error ?? "Error del gateway" });
      res.json({ ok: true, data: result.data });
    } catch (err) { next(err); }
  },

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = printerLogQuerySchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      const dominio = req.query.dominio as string;
      if (!dominio) return res.status(400).json({ ok: false, error: "Dominio requerido (query param)" });
      const result = await service.getLogs(dominio, parsed.data.numeroLineas, parsed.data.tipoArchivo);
      if (!result.success) return res.status(502).json({ ok: false, error: result.error ?? "Error del gateway" });
      res.json({ ok: true, data: result.data });
    } catch (err) { next(err); }
  },
};
