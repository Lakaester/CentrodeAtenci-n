import { CustomerResolver } from "./CustomerResolver";
import type { CustomerResolution } from "../types";
import type { ResolveCustomerRequestDTO } from "../dto/ResolveCustomerRequest.dto";

/**
 * CustomerService — Capa de servicio para el módulo Customer.
 * Encapsula el acceso al CustomerResolver.
 */
export class CustomerService {
  private resolver = new CustomerResolver();

  async resolve(data: ResolveCustomerRequestDTO): Promise<CustomerResolution> {
    return this.resolver.resolve(data.dominio);
  }
}
