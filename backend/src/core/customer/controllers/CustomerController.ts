import { Request, Response, NextFunction } from "express";
import { CustomerService } from "../services/CustomerService";
import { resolveCustomerRequestSchema } from "../dto/ResolveCustomerRequest.dto";

const service = new CustomerService();

/**
 * CustomerController — Endpoints para resolución de clientes.
 */
export const customerController = {
  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = resolveCustomerRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
      }
      const result = await service.resolve(parsed.data);
      if (!result.success) {
        return res.status(404).json({ ok: false, error: result.error });
      }
      res.json({ ok: true, data: result.context });
    } catch (err) {
      next(err);
    }
  },
};
