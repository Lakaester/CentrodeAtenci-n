import { IntegrationRegistry } from "../registry/IntegrationRegistry";
import type { IntegrationAdapter } from "../interfaces/IntegrationAdapter";
import type { CustomerContext } from "../../customer/types";

/**
 * IntegrationService — Capa de servicio para consumir integraciones.
 *
 * Solo conoce el Registry. Nunca implementaciones concretas.
 * Toda acción se ejecuta bajo demanda (lazy loading).
 */
export class IntegrationService {
  constructor(private registry: IntegrationRegistry) {}

  /** Obtiene un adaptador registrado */
  getAdapter(name: string): IntegrationAdapter | undefined {
    return this.registry.get(name);
  }

  /** Lista adaptadores disponibles */
  listAdapters(): IntegrationAdapter[] {
    return this.registry.list();
  }

  /** Verifica si un adaptador existe */
  hasAdapter(name: string): boolean {
    return this.registry.exists(name);
  }

  /**
   * Ejecuta una acción en un adaptador.
   * Flujo: dominio → CustomerContext → Adapter → Sistema externo
   *
   * @param adapterName - Nombre del adaptador
   * @param context - Contexto del cliente (ya resuelto)
   * @param action - Acción a ejecutar
   * @param params - Parámetros de la acción
   */
  async executeAction(
    adapterName: string,
    context: CustomerContext,
    action: string,
    params: unknown,
  ): Promise<unknown> {
    const adapter = this.registry.get(adapterName);
    if (!adapter) {
      throw new Error(`Adaptador no encontrado: ${adapterName}`);
    }

    await adapter.connect(context);
    try {
      const result = await adapter.execute(action, params);
      return result;
    } finally {
      await adapter.disconnect();
    }
  }
}
