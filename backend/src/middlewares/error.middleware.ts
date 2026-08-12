/** Manejador central de errores — formato unificado. */
import { Request, Response, NextFunction } from "express";
import { toErrorResponse, DomainError, ApplicationError, InfrastructureError } from "../core/errors/types";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${err.message}`, err.stack?.slice(0, 500));

  const response = toErrorResponse(err);
  const status = err instanceof InfrastructureError ? err.httpStatus : 500;

  res.status(status).json(response);
}
