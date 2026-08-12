import { z } from "zod";

/**
 * DTO de entrada para resolver un cliente.
 * El frontend envía únicamente el dominio.
 */
export const resolveCustomerRequestSchema = z.object({
  dominio: z.string().min(1, "Dominio requerido").regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Formato de dominio inválido"),
});

export type ResolveCustomerRequestDTO = z.infer<typeof resolveCustomerRequestSchema>;
