import type { IntegrationAdapter } from "../interfaces/IntegrationAdapter";
import type { IntegrationCapability, IntegrationHealth } from "../types";
import type { CustomerContext } from "../../customer/types";
import { PrinterGatewayClient } from "../../../integrations/printer/client/PrinterGatewayClient";

/**
 * PrinterAdapter — Adaptador funcional para el módulo Printer.
 *
 * Primer Adapter real de COPE. Sirve como modelo de referencia
 * para todas las integraciones futuras.
 *
 * Flujo:
 *   registry.get("printer") → PrinterAdapter
 *   adapter.connect(ctx)    → almacena CustomerContext
 *   adapter.execute(action) → usa PrinterGatewayClient con datos del contexto
 */
export class PrinterAdapter implements IntegrationAdapter {
  private client = new PrinterGatewayClient();
  private context: CustomerContext | null = null;

  getName(): string {
    return "printer";
  }

  getCapabilities(): IntegrationCapability[] {
    return [
      { name: "feature-flags", description: "Gestionar feature flags del dispositivo" },
      { name: "logs", description: "Obtener logs de error del servicio local" },
    ];
  }

  isAvailable(): boolean {
    return true;
  }

  async connect(ctx: CustomerContext): Promise<boolean> {
    this.context = ctx;
    return true;
  }

  async execute(action: string, params: unknown): Promise<unknown> {
    if (!this.context) throw new Error("PrinterAdapter no conectado. Ejecute connect() primero.");

    const { connection, identity } = this.context;

    switch (action) {
      case "list-feature-flags": {
        return this.client.execute({
          ip: connection.ip,
          puerto: connection.puerto,
          dominio: identity.dominio,
          local_id: connection.localId,
          device_id: connection.deviceId,
          path: "/api/rest/featureflags/listar",
          method: "GET",
        });
      }

      case "update-feature-flag": {
        const p = params as { nombreFlag: string; habilitado: boolean };
        return this.client.execute({
          ip: connection.ip,
          puerto: connection.puerto,
          dominio: identity.dominio,
          local_id: connection.localId,
          device_id: connection.deviceId,
          path: "/api/rest/featureflags/actualizar",
          method: "POST",
          body: { nombreFlag: p.nombreFlag, habilitado: p.habilitado },
        });
      }

      case "get-logs": {
        const p = params as { numeroLineas: number; tipoArchivo: string };
        return this.client.execute({
          ip: connection.ip,
          puerto: connection.puerto,
          dominio: identity.dominio,
          local_id: connection.localId,
          device_id: connection.deviceId,
          path: `/api/rest/obtenerErrorLogs?numeroLineas=${p.numeroLineas}&tipoArchivo=${p.tipoArchivo}`,
          method: "GET",
        });
      }

      default:
        throw new Error(`Acción no soportada por PrinterAdapter: ${action}`);
    }
  }

  async disconnect(): Promise<void> {
    this.context = null;
  }

  async health(): Promise<IntegrationHealth> {
    if (!this.context) {
      return { ok: false, message: "No conectado", timestamp: new Date().toISOString() };
    }
    return { ok: true, message: "Conectado", timestamp: new Date().toISOString() };
  }
}
