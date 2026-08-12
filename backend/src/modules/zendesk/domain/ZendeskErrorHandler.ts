/** @deprecated Este mÛdulo ha sido reemplazado por modules/zendesk-test/. Se eliminar· en M2. */
export type ZendeskErrorCode =
  | "AUTH_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export interface ZendeskError {
  code: ZendeskErrorCode;
  message: string;
  httpStatus?: number;
  retryable: boolean;
}

export class ZendeskErrorHandler {
  static errorNoConfigurado(): ZendeskError {
    return {
      code: "AUTH_ERROR",
      message: "Zendesk no est√° configurado. Verificar ZENDESK_SUBDOMAIN, ZENDESK_EMAIL y ZENDESK_TOKEN.",
      retryable: false,
    };
  }

  static errorNoEncontrado(recurso: string, id: string): ZendeskError {
    return {
      code: "NOT_FOUND",
      message: `${recurso} no encontrado en Zendesk: ${id}`,
      httpStatus: 404,
      retryable: false,
    };
  }

  static errorRateLimit(): ZendeskError {
    return {
      code: "RATE_LIMIT",
      message: "L√≠mite de peticiones a Zendesk alcanzado. Reintentar m√°s tarde.",
      httpStatus: 429,
      retryable: true,
    };
  }

  static errorRed(): ZendeskError {
    return {
      code: "NETWORK_ERROR",
      message: "No se pudo conectar con Zendesk. Verificar conectividad.",
      retryable: true,
    };
  }

  static errorValidacion(mensaje: string): ZendeskError {
    return {
      code: "VALIDATION_ERROR",
      message: mensaje,
      httpStatus: 400,
      retryable: false,
    };
  }

  static errorDesconocido(error: unknown): ZendeskError {
    return {
      code: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Error desconocido en Zendesk",
      retryable: false,
    };
  }
}

