export class DomainError extends Error {
  constructor(message: string, public readonly code: string = "DOMAIN_ERROR") {
    super(message);
    this.name = "DomainError";
  }
}

export class ApplicationError extends Error {
  constructor(message: string, public readonly code: string = "APPLICATION_ERROR") {
    super(message);
    this.name = "ApplicationError";
  }
}

export class InfrastructureError extends Error {
  constructor(message: string, public readonly code: string = "INFRASTRUCTURE_ERROR", public readonly httpStatus = 500) {
    super(message);
    this.name = "InfrastructureError";
  }
}

export interface ErrorResponse {
  ok: false;
  error: string;
  code: string;
  type: string;
  timestamp: string;
  detail?: string;
}

export function toErrorResponse(err: unknown): ErrorResponse {
  if (err instanceof DomainError) return { ok: false, error: err.message, code: err.code, type: "domain", timestamp: new Date().toISOString() };
  if (err instanceof ApplicationError) return { ok: false, error: err.message, code: err.code, type: "application", timestamp: new Date().toISOString() };
  if (err instanceof InfrastructureError) return { ok: false, error: err.message, code: err.code, type: "infrastructure", timestamp: new Date().toISOString(), detail: `HTTP ${err.httpStatus}` };
  const msg = err instanceof Error ? err.message : "Error desconocido";
  return { ok: false, error: msg, code: "UNKNOWN", type: "unknown", timestamp: new Date().toISOString() };
}
