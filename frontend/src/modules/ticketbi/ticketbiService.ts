import { api } from "@/lib/api";

/**
 * Servicio de catálogos para el formulario de Ticket.
 *
 * Capa desacoplada: el formulario NO conoce la fuente de los datos.
 * - Categoría / Subcategoría / Nivel / Áreas: provienen del backend COPE
 *   (catálogo local, sin tablas por ahora).
 * - Proyectos / Tipos / Dev / Estados: provienen de Tareabi (Micro-Services)
 *   vía backend.
 *
 * Cuando se confirmen los endpoints reales de Micro-Services, solo se cambia
 * la implementación de estas funciones sin tocar el componente.
 */

export async function obtenerCategorias(): Promise<string[]> {
  const res = await api.get("/atenciones/ticket-catalogos/categorias");
  return res.data?.data ?? [];
}

export async function obtenerSubcategorias(categoria: string): Promise<string[]> {
  const res = await api.get("/atenciones/ticket-catalogos/subcategorias", { params: { categoria } });
  return res.data?.data ?? [];
}

export async function obtenerNiveles(): Promise<string[]> {
  const res = await api.get("/atenciones/ticket-catalogos/niveles");
  return res.data?.data ?? [];
}

export async function obtenerAreas(): Promise<string[]> {
  const res = await api.get("/atenciones/ticket-catalogos/areas");
  return res.data?.data ?? [];
}

/** Proyectos de tarea desde Tareabi (obtenerDatosEstaticos). */
export async function obtenerProyectos(): Promise<string[]> {
  const res = await api.get("/tareabi/proyectos");
  return res.data?.data ?? [];
}

/** Tipos de tarea desde Tareabi (obtenerDatosEstaticos). */
export async function obtenerTipos(): Promise<string[]> {
  const res = await api.get("/tareabi/tipos");
  return res.data?.data ?? [];
}

/** Desarrolladores/responsables desde Tareabi. */
export async function obtenerDev(): Promise<string[]> {
  const res = await api.get("/tareabi/dev");
  return res.data?.data ?? [];
}