import type { ICustomerRepository } from "../interfaces/ICustomerRepository";
import type { CustomerIdentity, CustomerConnection } from "../types";

/**
 * CustomerRepository — Acceso a datos del cliente.
 *
 * Pendiente de implementar. En el futuro consultará:
 * - Tabla clientes_cope (CustomerMemory)
 * - API de microservice
 * - Cache distribuida
 * - Zendesk (campos personalizados)
 */
export class CustomerRepository implements ICustomerRepository {
  async findIdentity(_dominio: string): Promise<CustomerIdentity | null> {
    // TODO: buscar en CustomerMemory, microservice o BD
    return null;
  }

  async findConnection(_dominio: string): Promise<CustomerConnection | null> {
    // TODO: buscar en tabla de conexiones o microservice
    return null;
  }
}
