import { CustomerMemory } from "../../zendesk-test/CustomerMemory";
import type { ISearchProvider } from "../interfaces/ISearchProvider";
import type { SearchResult, SearchQuery } from "../types";

export class CustomerMemorySearchProvider implements ISearchProvider {
  getName(): string {
    return "customer-memory";
  }

  supports(type: string): boolean {
    return ["domain", "email", "phone"].includes(type);
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    if (query.detectedType === "email" || query.detectedType === "domain") {
      const cliente = query.detectedType === "email"
        ? CustomerMemory.buscarPorCorreo(query.raw)
        : CustomerMemory.buscarPorDominio(query.raw);

      if (cliente) {
        results.push({
          id: cliente.id,
          type: query.detectedType,
          label: cliente.nombre,
          description: cliente.correoPrincipal,
          score: 0,
          data: { dominios: cliente.dominios, empresa: cliente.empresa },
          source: "customer-memory",
        });
      }
    }

    return results;
  }
}
