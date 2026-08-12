/**
 * DTO + validación (Zod) de los filtros que llegan por querystring.
 * Convierte texto "a,b,c" en arrays y valida fechas/horas.
 * Esto protege las consultas SQL de entradas mal formadas.
 */
import { z } from "zod";

const toArray = (val: unknown) =>
  typeof val === "string" && val.length > 0 ? val.split(",").map((s) => s.trim()) : undefined;

const DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export const filtersSchema = z.object({
  fechaHoraInicio: z.string().regex(DATETIME_RE).optional(),
  fechaHoraFin: z.string().regex(DATETIME_RE).optional(),
  canal: z.preprocess(toArray, z.array(z.string()).optional()),
  subcanal: z.preprocess(toArray, z.array(z.string()).optional()),
  pais: z.preprocess(toArray, z.array(z.string()).optional()),
  asesor: z.preprocess(toArray, z.array(z.string()).optional()),
  categoria: z.preprocess(toArray, z.array(z.string()).optional()),
  subcategoria: z.preprocess(toArray, z.array(z.string()).optional()),
  dominio: z.preprocess(toArray, z.array(z.string()).optional()),
  estado: z.preprocess(toArray, z.array(z.string()).optional()),
  tipoCliente: z.preprocess(toArray, z.array(z.string()).optional()),
  rangoAtencion: z.preprocess(toArray, z.array(z.string()).optional()),
  rangoPrimeraRespuesta: z.preprocess(toArray, z.array(z.string()).optional()),
  search: z.string().max(120).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100000).default(20),
});

export type FiltersDTO = z.infer<typeof filtersSchema>;
