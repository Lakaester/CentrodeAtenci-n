/**
 * Controller: traduce HTTP <-> servicio.
 */
import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";
import { clientesExportService } from "../services/clientesExport.service";
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

  async clientesLista(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const data = await dashboardService.clientesLista(filters, { page, pageSize, search });
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async clienteCategorias(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const clave = typeof req.query.clave === "string" ? req.query.clave : "";
      if (!clave) {
        res.status(400).json({ ok: false, error: "Falta el parámetro clave" });
        return;
      }
      const data = await dashboardService.clienteCategorias(filters, clave);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async clienteSubcategorias(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const clave = typeof req.query.clave === "string" ? req.query.clave : "";
      const categoria = typeof req.query.cat === "string" ? req.query.cat : "";
      if (!clave || !categoria) {
        res.status(400).json({ ok: false, error: "Faltan clave y categoría" });
        return;
      }
      const data = await dashboardService.clienteSubcategorias(filters, clave, categoria);
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async clienteTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const clave = typeof req.query.clave === "string" ? req.query.clave : "";
      const categoria = typeof req.query.cat === "string" ? req.query.cat : "";
      const subcategoria =
        typeof req.query.subcat === "string" ? req.query.subcat : "";
      if (!clave || !categoria || !subcategoria) {
        res.status(400).json({ ok: false, error: "Faltan clave, categoría y subcategoría" });
        return;
      }
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const data = await dashboardService.clienteTickets(filters, {
        clave,
        categoria,
        subcategoria,
        page,
        pageSize,
      });
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async clienteEvolucion(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const clave = typeof req.query.clave === "string" ? req.query.clave : "";
      if (!clave) {
        res.status(400).json({ ok: false, error: "Falta el parámetro clave" });
        return;
      }
      const granularidadRaw =
        typeof req.query.granularidad === "string" ? req.query.granularidad : "semanal";
      const granularidad =
        granularidadRaw === "diaria" || granularidadRaw === "mensual"
          ? granularidadRaw
          : "semanal";
      const data = await dashboardService.clienteEvolucion(filters, { clave, granularidad });
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  },

  async clientesV2Exportar(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = (req as Request & { filters: DashboardFilters }).filters ?? {};
      const nivelRaw = typeof req.query.nivel === "string" ? req.query.nivel : "clientes";
      const niveles = ["clientes", "categorias", "subcategorias", "tickets"] as const;
      const nivel = niveles.find((n) => n === nivelRaw);
      if (!nivel) {
        res.status(400).json({ ok: false, error: "Nivel de exportación inválido" });
        return;
      }
      const { buffer, nombre, total, contentType } = await clientesExportService.generar(
        filters,
        {
          nivel,
          clave: typeof req.query.clave === "string" ? req.query.clave : undefined,
          categoria: typeof req.query.cat === "string" ? req.query.cat : undefined,
          subcategoria: typeof req.query.subcat === "string" ? req.query.subcat : undefined,
          search: typeof req.query.search === "string" ? req.query.search : undefined,
        },
      );
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
      res.setHeader("X-Export-Total", String(total));
      res.send(buffer);
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
