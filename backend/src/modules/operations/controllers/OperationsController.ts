import { Request, Response, NextFunction } from "express";
import { OperationsService } from "../dashboard/OperationsService";

const service = new OperationsService();

export const operationsController = {
  async dashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getDashboard();
      res.json({ ok: true, data });
    } catch (err) { next(err); }
  },
};
