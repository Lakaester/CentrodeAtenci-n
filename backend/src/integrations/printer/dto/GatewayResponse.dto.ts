/**
 * DTO para respuestas del gateway Printer.
 * Pendiente de implementar en FASE 2.
 */
export interface GatewayResponseDTO<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timingMs: number;
}
