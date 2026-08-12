import { z } from "zod";

export const createAtencionSchema = z.object({
  ticketId: z.string().min(1),
  canal: z.enum(["zendesk", "wameta", "whaticket"]),
  ticketOriginalId: z.string().min(1),
  ticketOriginalStatus: z.string().min(1),
  clienteId: z.string().min(1),
  clienteNombre: z.string().min(1),
  clienteDominio: z.string().min(1),
  clienteEmail: z.string().optional(),
  clienteTelefono: z.string().optional(),
  pais: z.string().optional(),
  tipoCliente: z.enum(["high_touch", "low_touch", "tech_touch"]).optional(),
  asunto: z.string().min(1).max(500),
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  mensajeInicial: z.string().optional(),
});

export const updateAtencionSchema = z.object({
  asunto: z.string().min(1).max(500).optional(),
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
});

export const addActividadSchema = z.object({
  tipo: z.enum(["identificacion", "diagnostico", "consulta", "gestion", "comunicacion", "clasificacion", "cierre"]),
  subtipo: z.string().min(1),
  descripcion: z.string().min(1),
  origen: z.enum(["cliente", "agente", "sistema", "automatico", "integracion"]),
  autor: z.string().min(1),
  autorId: z.string().optional(),
  resultado: z.enum(["ok", "error", "pendiente", "informacion_no_disponible"]).optional(),
  observaciones: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const addHipotesisSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  nivelConfianza: z.enum(["alta", "media", "baja"]),
  confianza: z.number().min(0).max(100),
  causas: z.array(z.string()).optional(),
  recomendaciones: z.array(z.string()).optional(),
});

export const finalizarAtencionSchema = z.object({
  resultado: z.enum(["resuelto", "parcial", "escalado", "pendiente", "sin_respuesta", "duplicado"]),
  resumen: z.string().min(1).max(2000),
  herramientasUtilizadas: z.array(z.string()).optional(),
  lecciones: z.array(z.string()).optional(),
  accionRealizada: z.string().optional(),
  observaciones: z.string().optional(),
});

export type CreateAtencionDTO = z.infer<typeof createAtencionSchema>;
export type UpdateAtencionDTO = z.infer<typeof updateAtencionSchema>;
export type AddActividadDTO = z.infer<typeof addActividadSchema>;
export type AddHipotesisDTO = z.infer<typeof addHipotesisSchema>;
export type FinalizarAtencionDTO = z.infer<typeof finalizarAtencionSchema>;
