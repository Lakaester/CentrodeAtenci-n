import { CustomerRepository } from "../repositories/CustomerRepository";
import type { CustomerContext, CustomerResolution } from "../types";

/**
 * CustomerResolver — Único componente autorizado para resolver
 * la información técnica de un cliente a partir de su dominio.
 *
 * Todas las integraciones (Printer, Microservice, RestaFact, etc.)
 * deben pasar por aquí. Ninguna debe conocer IP, puerto o device_id
 * directamente.
 *
 * Flujo futuro:
 *   Frontend → dominio → CustomerResolver → CustomerContext → Integración
 */
export class CustomerResolver {
  private repository = new CustomerRepository();

  /**
   * Resuelve un dominio y devuelve el contexto completo del cliente.
   * @param dominio - Identificador único del cliente (ej: "cliente.restaurant.pe")
   * @returns CustomerResolution con los datos del cliente o error
   */
  async resolve(dominio: string): Promise<CustomerResolution> {
    try {
      const [identity, connection] = await Promise.all([
        this.repository.findIdentity(dominio),
        this.repository.findConnection(dominio),
      ]);

      if (!identity && !connection) {
        return {
          success: false,
          error: `No se encontró información para el dominio: ${dominio}`,
        };
      }

      const context: CustomerContext = {
        identity: identity ?? {
          dominio,
          razonSocial: null,
          producto: null,
          pais: null,
          estado: null,
        },
        connection: connection ?? {
          ip: "",
          puerto: 0,
          deviceId: "",
          localId: "",
        },
        metadata: {},
      };

      return { success: true, context };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
