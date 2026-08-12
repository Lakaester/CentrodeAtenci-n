import { z } from "zod";

export const createHerramientaSchema = z.object({
  nombre: z.string().min(2).max(100),
  descripcion: z.string().min(5).max(500),
  icono: z.string().default("Wrench"),
  color: z.string().default("#64748B"),
  categoria: z.string().min(1),
  urlBase: z.string().default(""),
  parametros: z.array(z.object({ nombre: z.string(), etiqueta: z.string(), requerido: z.boolean() })).default([]),
  tipo: z.enum(["pagina_web", "dashboard", "sistema_interno", "api", "plugin", "aplicacion_externa", "documento", "notebooklm"]).default("pagina_web"),
  estado: z.enum(["activo", "inactivo", "mantenimiento"]).default("activo"),
  orden: z.number().default(0),
  visible: z.boolean().default(true),
  tiposAtencion: z.array(z.string()).default([]),
  responsable: z.string().min(1),
});

export const updateHerramientaSchema = createHerramientaSchema.partial();

export type CreateHerramientaDTO = z.infer<typeof createHerramientaSchema>;
export type UpdateHerramientaDTO = z.infer<typeof updateHerramientaSchema>;
