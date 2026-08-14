import { Request, Response, NextFunction } from "express";
import { facturacionSourceService } from "../services/facturacionSource.service";

export const facturacionSourceController = {
  async status(_req: Request, res: Response, next: NextFunction) {
    try {
      const status = await facturacionSourceService.status();
      res.json({ ok: true, ...status });
    } catch (err) {
      next(err);
    }
  },
};
