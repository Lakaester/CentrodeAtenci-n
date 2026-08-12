import { z } from "zod";

export const createGuiaSchema = z.object({
  titulo: z.string().min(3).max(200),
  descripcion: z.string().min(10).max(1000),
  tipoAtencion: z.string().min(1),
  responsable: z.string().min(1),
  etiquetas: z.array(z.string()).default([]),
  objetivo: z.string().default(""),
  informacionNecesaria: z.array(z.string()).default([]),
  posiblesCausas: z.array(z.object({ titulo: z.string(), descripcion: z.string(), prioridad: z.enum(["alta", "media", "baja"]) })).default([]),
  procesoRecomendado: z.array(z.object({ titulo: z.string(), descripcion: z.string(), orden: z.number() })).default([]),
  herramientas: z.array(z.string()).default([]),
  buenasPracticas: z.string().default(""),
  criteriosResolucion: z.array(z.string()).default([]),
  documentos: z.array(z.string()).default([]),
  workspaces: z.array(z.string()).default([]),
});

export const updateGuiaSchema = createGuiaSchema.partial().extend({
  estado: z.enum(["borrador", "en_revision", "publicada", "obsoleta"]).optional(),
  cambios: z.string().optional(),
});

export type CreateGuiaDTO = z.infer<typeof createGuiaSchema>;
export type UpdateGuiaDTO = z.infer<typeof updateGuiaSchema>;
