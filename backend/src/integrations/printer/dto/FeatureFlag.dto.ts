import { z } from "zod";

export const featureFlagSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string(),
  habilitado: z.boolean(),
  enArchivo: z.boolean(),
});

export type FeatureFlagDTO = z.infer<typeof featureFlagSchema>;

export const updateFeatureFlagSchema = z.object({
  nombreFlag: z.string().min(1, "nombreFlag requerido"),
  habilitado: z.boolean(),
});

export type UpdateFeatureFlagDTO = z.infer<typeof updateFeatureFlagSchema>;
