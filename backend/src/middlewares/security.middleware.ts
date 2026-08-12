import { Request, Response, NextFunction } from "express";

/** Security headers middleware */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.removeHeader("X-Powered-By");
  next();
}

/** Simple rate limiter (in-memory) */
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60000;
const MAX_REQUESTS = 100;

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  let entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    requestCounts.set(key, entry);
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      ok: false,
      error: "Demasiadas solicitudes. Intente nuevamente en 60 segundos.",
      code: "RATE_LIMIT_EXCEEDED",
      type: "infrastructure",
      timestamp: new Date().toISOString(),
    });
  }

  next();
}
