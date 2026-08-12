import type { AIProvider } from "./AIProvider";
import type { AIProviderId } from "./AIRequest";

export class AIProviderRegistry {
  private static instancia: AIProviderRegistry;
  private proveedores: Map<string, AIProvider> = new Map();
  private defaultProvider: string = "mock";

  private constructor() {}

  static obtener(): AIProviderRegistry {
    if (!AIProviderRegistry.instancia) {
      AIProviderRegistry.instancia = new AIProviderRegistry();
    }
    return AIProviderRegistry.instancia;
  }

  registrar(provider: AIProvider): void {
    this.proveedores.set(provider.id, provider);
  }

  obtenerProvider(id: string): AIProvider | undefined {
    return this.proveedores.get(id);
  }

  obtenerDefault(): AIProvider | undefined {
    return this.proveedores.get(this.defaultProvider) ?? this.proveedores.values().next().value;
  }

  setDefault(id: string): void {
    if (this.proveedores.has(id)) {
      this.defaultProvider = id;
    }
  }

  listarProviders(): AIProvider[] {
    return Array.from(this.proveedores.values());
  }

  listarDisponibles(): AIProvider[] {
    return this.listarProviders().filter((p) => p.disponible);
  }

  eliminar(id: string): boolean {
    return this.proveedores.delete(id);
  }

  limpiar(): void {
    this.proveedores.clear();
  }

  get cantidad(): number {
    return this.proveedores.size;
  }
}
