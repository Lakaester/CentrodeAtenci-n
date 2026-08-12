import type { CustomerIdentity, CustomerConnection } from "../types";

/**
 * ICustomerRepository — Contrato para obtener datos del cliente.
 * Pendiente de implementar. Podrá consultar:
 * - Base de datos local
 * - API de microservice
 * - Cache (Redis / Memoria)
 * - Zendesk (custom fields)
 */
export interface ICustomerRepository {
  findIdentity(dominio: string): Promise<CustomerIdentity | null>;
  findConnection(dominio: string): Promise<CustomerConnection | null>;
}
