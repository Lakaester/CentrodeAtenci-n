import { PrinterGatewayClient } from "../client/PrinterGatewayClient";
import { CustomerResolver } from "../../../core/customer/services/CustomerResolver";
import type { GatewayResponseDTO } from "../dto/GatewayRequest.dto";
import type { FeatureFlagDTO, UpdateFeatureFlagDTO } from "../dto/FeatureFlag.dto";
import type { PrinterLogDTO } from "../dto/PrinterLog.dto";

/**
 * PrinterService — Lógica de negocio del módulo Printer.
 *
 * Ahora recibe un dominio y resuelve la conexión mediante CustomerResolver.
 * El frontend nunca envía datos técnicos (ip, puerto, deviceId).
 */
export class PrinterService {
  private client = new PrinterGatewayClient();
  private resolver = new CustomerResolver();

  private async execute<T>(
    dominio: string,
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: unknown,
  ): Promise<GatewayResponseDTO<T>> {
    // 1. Resolver dominio → CustomerContext
    const resolution = await this.resolver.resolve(dominio);
    if (!resolution.success || !resolution.context) {
      return { success: false, error: `No se pudo resolver el dominio: ${dominio}`, timingMs: 0 };
    }

    const { connection, identity } = resolution.context;

    // 2. Ejecutar contra el gateway con los datos resueltos
    return this.client.execute<T>({
      ip: connection.ip,
      puerto: connection.puerto,
      dominio: identity.dominio,
      local_id: connection.localId,
      device_id: connection.deviceId,
      path,
      method,
      body,
    });
  }

  async listFeatureFlags(dominio: string): Promise<GatewayResponseDTO<{ flags: FeatureFlagDTO[] }>> {
    return this.execute<{ flags: FeatureFlagDTO[] }>(dominio, "/api/rest/featureflags/listar");
  }

  async updateFeatureFlag(dominio: string, data: UpdateFeatureFlagDTO): Promise<GatewayResponseDTO<{ flag: FeatureFlagDTO }>> {
    return this.execute<{ flag: FeatureFlagDTO }>(dominio, "/api/rest/featureflags/actualizar", "POST", {
      nombreFlag: data.nombreFlag,
      habilitado: data.habilitado,
    });
  }

  async getLogs(dominio: string, numeroLineas: number, tipoArchivo: string): Promise<GatewayResponseDTO<PrinterLogDTO>> {
    return this.execute<PrinterLogDTO>(
      dominio,
      `/api/rest/obtenerErrorLogs?numeroLineas=${numeroLineas}&tipoArchivo=${tipoArchivo}`,
    );
  }
}
