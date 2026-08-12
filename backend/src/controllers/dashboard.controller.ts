/**
 * Controller: traduce HTTP <-> servicio.
 */
import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";
import type { DashboardFilters } from "../types";

export const dashboardController = {
  async resumen(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.resumen(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async sla(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.sla(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async operacion(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.operacion(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async asesores(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.asesores(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async categorias(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.categorias(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },
  async categoriasV2(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.categoriasV2(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async clientes(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.clientes(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },
  async clientesV2(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.clientesV2(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async whatsapp(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.whatsapp(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async zendesk(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.zendesk(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async tendencias(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.tendencias(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async pais(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.pais(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },
  async asesoresMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.asesoresMatrix(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },
  async detalle(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.detalle(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },
  async opciones(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.opciones();
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },
  async quejasDevoluciones(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const data = await dashboardService.quejasDevoluciones(filters);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },
};
