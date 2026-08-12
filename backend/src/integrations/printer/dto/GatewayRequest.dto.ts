import { z } from "zod";

export const gatewayRequestSchema = z.object({
  ip: z.string().min(1, "IP requerida"),
  puerto: z.number().int().min(1).max(65535),
  dominio: z.string().min(1, "Dominio requerido"),
  local_id: z.string().min(1, "local_id requerido"),
  device_id: z.string().min(1, "device_id requerido"),
  path: z.string().min(1, "path requerido").startsWith("/", "path debe comenzar con /"),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  body: z.unknown().optional(),
});

export type GatewayRequestDTO = z.infer<typeof gatewayRequestSchema>;

export interface GatewayResponseDTO<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timingMs: number;
}
