import { z } from "zod";

export const microserviceClienteSchema = z.object({
  dominio: z.string(),
  razonSocial: z.string().optional(),
  ruc: z.string().optional(),
  pais: z.string().optional(),
  tipoCliente: z.string().optional(),
  estado: z.string().optional(),
  productos: z.array(z.string()),
  ltv: z.string().optional(),
  cantidadLocales: z.number().optional(),
  estadoSalud: z.string().optional(),
});

export const microserviceSoporteSchema = z.object({
  historial: z.array(z.object({ fecha: z.string(), tipo: z.string(), descripcion: z.string() })),
  ultimasIncidencias: z.array(z.object({ fecha: z.string(), categoria: z.string(), estado: z.string() })),
  reincidencias: z.number(),
});

export const microserviceDesarrolloSchema = z.object({
  tickets: z.array(z.object({
    id: z.string(), proyecto: z.string(), estado: z.string(),
    prioridad: z.string(), responsable: z.string(),
  })),
});

export const microserviceComercialSchema = z.object({
  csm: z.string().optional(),
  reuniones: z.number(),
  churn: z.string().optional(),
  estadoComercial: z.string().optional(),
});

export const microserviceResponseSchema = z.object({
  cliente: microserviceClienteSchema,
  soporte: microserviceSoporteSchema,
  desarrollo: microserviceDesarrolloSchema,
  comercial: microserviceComercialSchema,
});

export type MicroserviceClienteDTO = z.infer<typeof microserviceClienteSchema>;
export type MicroserviceSoporteDTO = z.infer<typeof microserviceSoporteSchema>;
export type MicroserviceDesarrolloDTO = z.infer<typeof microserviceDesarrolloSchema>;
export type MicroserviceComercialDTO = z.infer<typeof microserviceComercialSchema>;
export type MicroserviceResponseDTO = z.infer<typeof microserviceResponseSchema>;
