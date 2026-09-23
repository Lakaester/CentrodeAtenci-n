import { Request, Response, NextFunction } from "express";
import { ConfigurationRegistry } from "../registry/ConfigurationRegistry";

const registry = new ConfigurationRegistry();

/** Determina si una entrada debe considerarse sensible (por flag o por nombre). */
function esSensible(e: { key?: string; sensitive?: boolean } | undefined | null): boolean {
  if (!e) return false;
  if (e.sensitive) return true;
  const k = (e.key ?? "").toLowerCase();
  return k.includes("token") || k.includes("secret") || k.includes("password") || k.includes("api_key") || k.includes("client_secret");
}

/** Redacta los valores de entradas sensibles antes de exponerlas por la API. */
function redact<T extends object>(entry: T): T {
  if (!esSensible(entry as { key?: string; sensitive?: boolean })) return entry;
  const out = { ...(entry as Record<string, unknown>) };
  if ("value" in out) out.value = "[REDACTED]";
  if ("oldValue" in out) out.oldValue = "[REDACTED]";
  if ("newValue" in out) out.newValue = "[REDACTED]";
  return out as T;
}

export const configController = {
  list(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: registry.list().map(redact) }); } catch (err) { next(err); }
  },

  get(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = registry.get(req.params.key);
      if (!entry) return res.status(404).json({ ok: false, error: "Configuración no encontrada" });
      res.json({ ok: true, data: redact(entry) });
    } catch (err) { next(err); }
  },

  set(req: Request, res: Response, next: NextFunction) {
    try {
      const { key, value, userId } = req.body;
      if (!key) return res.status(400).json({ ok: false, error: "key requerido" });
      const error = registry.set(key, value, userId ?? "api");
      if (error) return res.status(400).json({ ok: false, error });
      res.json({ ok: true, data: redact(registry.get(key)!) });
    } catch (err) { next(err); }
  },

  delete(req: Request, res: Response, next: NextFunction) {
    try {
      registry.delete(req.params.key, req.body?.userId ?? "api");
      res.json({ ok: true });
    } catch (err) { next(err); }
  },

  history(req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: registry.getHistory(req.params.key).map(redact) }); } catch (err) { next(err); }
  },

  audits(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ ok: true, data: registry.getAudits().map(redact) }); } catch (err) { next(err); }
  },

  registerSchema(req: Request, res: Response, next: NextFunction) {
    try {
      registry.registerSchema(req.body);
      res.json({ ok: true });
    } catch (err) { next(err); }
  },
};
