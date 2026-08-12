import type { IntegrationAdapter } from "../interfaces/IntegrationAdapter";

/**
 * IntegrationRegistry — Registro central de adaptadores.
 *
 * Único responsable de administrar las integraciones registradas.
 * No contiene lógica de negocio. Solo registro y consulta.
 *
 * Cualquier nueva integración solo requiere:
 *   1. Crear el Adapter (implementa IntegrationAdapter)
 *   2. Registrarlo aquí
 *   3. El resto del sistema no se modifica
 */
export class IntegrationRegistry {
  private adapters = new Map<string, IntegrationAdapter>();

  /** Registra un adaptador por su nombre */
  register(adapter: IntegrationAdapter): void {
    const name = adapter.getName();
    if (this.adapters.has(name)) {
      console.warn(`[IntegrationRegistry] El adaptador "${name}" ya está registrado. Se sobrescribirá.`);
    }
    this.adapters.set(name, adapter);
    console.log(`[IntegrationRegistry] Adaptador registrado: ${name}`);
  }

  /** Elimina un adaptador del registro */
  unregister(name: string): void {
    this.adapters.delete(name);
    console.log(`[IntegrationRegistry] Adaptador eliminado: ${name}`);
  }

  /** Obtiene un adaptador por nombre */
  get(name: string): IntegrationAdapter | undefined {
    return this.adapters.get(name);
  }

  /** Lista todos los adaptadores registrados */
  list(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }

  /** Verifica si un adaptador está registrado */
  exists(name: string): boolean {
    return this.adapters.has(name);
  }

  /** Cantidad de adaptadores registrados */
  get count(): number {
    return this.adapters.size;
  }
}
