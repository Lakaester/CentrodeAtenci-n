import type { CustomerContext } from "../../customer/types";
import type { IntegrationCapability, IntegrationHealth } from "../types";

/**
 * IntegrationAdapter — Contrato base que toda integración debe implementar.
 *
 * Cualquier sistema externo (Printer, Microservice, RestaFact, etc.)
 * debe implementar esta interfaz para poder ser registrado en COPE.
 *
 * El sistema nunca conoce implementaciones concretas.
 * Siempre trabaja mediante esta interfaz.
 */
export interface IntegrationAdapter {
  /** Nombre único de la integración (ej: "printer", "microservice") */
  getName(): string;

  /** Capacidades que ofrece esta integración */
  getCapabilities(): IntegrationCapability[];

  /** Indica si el adaptador está disponible para ejecutar acciones */
  isAvailable(): boolean;

  /**
   * Conecta el adaptador usando el contexto del cliente.
   * @param ctx - Contexto resuelto por CustomerContextProvider
   */
  connect(ctx: CustomerContext): Promise<boolean>;

  /**
   * Ejecuta una acción en el sistema externo.
   * @param action - Nombre de la acción (ej: "list-feature-flags")
   * @param params - Parámetros específicos de la acción
   */
  execute(action: string, params: unknown): Promise<unknown>;

  /** Desconecta el adaptador liberando recursos */
  disconnect(): Promise<void>;

  /** Verifica el estado de salud de la integración */
  health(): Promise<IntegrationHealth>;
}
