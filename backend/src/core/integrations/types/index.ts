/**
 * IntegrationCapability — Declara qué funcionalidades ofrece una integración.
 *
 * Cada Adapter define sus propias capacidades.
 * El sistema las usa para determinar qué acciones están disponibles.
 *
 * Ejemplos:
 *   PrinterAdapter → ["logs", "feature-flags", "config"]
 *   MicroserviceAdapter → ["versions", "apps", "deploy"]
 *   RestaFactAdapter → ["folios", "licenses", "pending-fe"]
 */
export interface IntegrationCapability {
  /** Identificador único (ej: "logs", "feature-flags") */
  name: string;
  /** Descripción legible (ej: "Obtener logs de error") */
  description: string;
}

/**
 * IntegrationHealth — Resultado de la verificación de salud.
 */
export interface IntegrationHealth {
  ok: boolean;
  message?: string;
  timestamp: string;
}
