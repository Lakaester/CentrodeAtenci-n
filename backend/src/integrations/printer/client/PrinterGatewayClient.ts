import { GatewayRequestDTO, GatewayResponseDTO } from "../dto/GatewayRequest.dto";

const GATEWAY_URL = "https://printer.restaurant.pe/ngrok";

/**
 * PrinterGatewayClient — Cliente HTTP genérico hacia el gateway.
 * No conoce Feature Flags ni Logs. Solo construye y envía peticiones.
 */
export class PrinterGatewayClient {
  async execute<T>(req: GatewayRequestDTO): Promise<GatewayResponseDTO<T>> {
    const start = Date.now();
    try {
      const response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await response.json();
      return {
        success: response.ok,
        data: data as T,
        timingMs: Date.now() - start,
        ...(!response.ok && { error: data?.error ?? `HTTP ${response.status}` }),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg, timingMs: Date.now() - start };
    }
  }
}
