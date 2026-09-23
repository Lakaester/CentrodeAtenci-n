/** Manejador central de errores — formato unificado. */
import { Request, Response, NextFunction } from "express";
import { toErrorResponse, DomainError, ApplicationError, InfrastructureError } from "../core/errors/types";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${err.message}`, err.stack?.slice(0, 500));

  const response = toErrorResponse(err);
  const status = err instanceof InfrastructureError ? err.httpStatus : 500;

  // Contención: en producción no divulgar detalles de errores no controlados.
  if (
    process.env.NODE_ENV === "production" &&
    !(err instanceof DomainError) &&
    !(err instanceof ApplicationError) &&
    !(err instanceof InfrastructureError)
  ) {
    response.error = "Error interno del servidor";
    response.detail = undefined;
  }

  res.status(status).json(response);
}
