import { IntegrationRegistry } from "./registry/IntegrationRegistry";
import { PrinterAdapter } from "./adapters/PrinterAdapter";

/**
 * Bootstrap de integraciones — Se ejecuta una vez al iniciar el backend.
 * Registra todos los adaptadores disponibles.
 */
let registry: IntegrationRegistry | null = null;

export function initIntegrations(): IntegrationRegistry {
  if (registry) return registry;

  registry = new IntegrationRegistry();
  registry.register(new PrinterAdapter());

  console.log(`[Integrations] ${registry.count} adaptador(es) registrado(s)`);
  return registry;
}

export function getRegistry(): IntegrationRegistry {
  if (!registry) throw new Error("IntegrationRegistry no inicializado. Ejecute initIntegrations() primero.");
  return registry;
}
