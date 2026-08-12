import { AIRequest, type AIRequestData, type AIProviderId } from "./AIRequest";
import { AIResponse, type AIResponseData } from "./AIResponse";
import { AIProviderRegistry } from "./AIProviderRegistry";
import { AIContext, type AIContextData } from "./AIContext";
import type { TipoTareaIA } from "./AITask";

export interface OpcionesEjecucion {
  proveedor?: AIProviderId;
  temperatura?: number;
  idioma?: string;
  metadata?: Record<string, unknown>;
  maxTokens?: number;
  prompt?: string;
}

export class AIOrchestrator {
  private registry: AIProviderRegistry;

  constructor() {
    this.registry = AIProviderRegistry.obtener();
  }

  inicializar(): void {
    this.registry.limpiar();
  }

  async ejecutarTarea(
    tarea: TipoTareaIA,
    contexto: AIContext,
    opciones?: OpcionesEjecucion,
  ): Promise<AIResponse> {
    const request = new AIRequest({
      tarea,
      contexto,
      proveedor: opciones?.proveedor,
      temperatura: opciones?.temperatura,
      idioma: opciones?.idioma,
      metadata: opciones?.metadata,
      maxTokens: opciones?.maxTokens,
      prompt: opciones?.prompt,
    });

    const provider = opciones?.proveedor
      ? this.registry.obtenerProvider(opciones.proveedor)
      : this.registry.obtenerDefault();

    if (!provider) {
      return new AIResponse({
        resultado: "No hay proveedor de IA disponible",
        confianza: 0,
        tiempoEjecucion: 0,
        proveedorUsado: "none",
      });
    }

    return provider.ejecutar(request);
  }

  async ejecutarMultiple(
    tareas: { tarea: TipoTareaIA; contexto: AIContext; opciones?: OpcionesEjecucion }[],
  ): Promise<AIResponse[]> {
    return Promise.all(
      tareas.map((t) => this.ejecutarTarea(t.tarea, t.contexto, t.opciones)),
    );
  }

  registrarProvider(provider: { id: string; nombre: string; modelo: string; disponible: boolean; ejecutar: (req: AIRequest) => Promise<AIResponse> }): void {
    this.registry.registrar({
      id: provider.id,
      nombre: provider.nombre,
      modelo: provider.modelo,
      disponible: provider.disponible,
      ejecutar: provider.ejecutar.bind(provider),
      validarDisponibilidad: async () => provider.disponible,
      obtenerTemperatura: () => 0.3,
    });
  }

  obtenerProvidersDisponibles(): string[] {
    return this.registry.listarDisponibles().map((p) => `${p.id} (${p.modelo})`);
  }
}
