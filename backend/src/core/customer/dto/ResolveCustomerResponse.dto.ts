import type { CustomerContext } from "../types";

/**
 * DTO de respuesta del CustomerResolver.
 * Devuelve el contexto completo del cliente.
 */
export interface ResolveCustomerResponseDTO {
  success: boolean;
  data?: CustomerContext;
  error?: string;
}
