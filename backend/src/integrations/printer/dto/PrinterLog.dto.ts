import { z } from "zod";

export const printerLogQuerySchema = z.object({
  numeroLineas: z.coerce.number().int().min(1).max(100000).default(100),
  tipoArchivo: z.enum(["controlado", "nocontrolado"]).default("controlado"),
});

export type PrinterLogQueryDTO = z.infer<typeof printerLogQuerySchema>;

export interface PrinterLogDTO {
  contenido: string;
  lineasDevueltas: number;
  nombreArchivo: string;
  rutaCompleta: string;
  totalLineas: number;
  tipoArchivo: string;
  tamañoArchivo: number;
}
