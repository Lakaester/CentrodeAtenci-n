/** Tipo de filtros + utilidades compartidas por TODAS las pestañas. */
export interface DashboardFilters {
  fechaHoraInicio?: string;   // YYYY-MM-DD HH:mm
  fechaHoraFin?: string;      // YYYY-MM-DD HH:mm
  canal?: string[];
  subcanal?: string[];
  pais?: string[];
  asesor?: string[];
  categoria?: string[];
  subcategoria?: string[];
  dominio?: string[];
  estado?: string[];
  tipoCliente?: string[];
  rangoAtencion?: string[];
  search?: string;
}

const ESCALARES: (keyof DashboardFilters)[] = [
  "fechaHoraInicio",
  "fechaHoraFin",
  "search",
];
const ARREGLOS: (keyof DashboardFilters)[] = [
  "canal",
  "subcanal",
  "pais",
  "asesor",
  "categoria",
  "subcategoria",
  "dominio",
  "estado",
  "tipoCliente",
  "rangoAtencion",
];

/** Convierte los filtros a parámetros de querystring para la API. */
export function filtersToParams(f: DashboardFilters): Record<string, string> {
  const p: Record<string, string> = {};
  for (const k of ESCALARES) {
    const v = f[k];
    if (typeof v === "string" && v) p[k] = v;
  }
  for (const k of ARREGLOS) {
    const v = f[k];
    if (Array.isArray(v) && v.length) p[k] = v.join(",");
  }
  return p;
}

/** Cuenta cuántos grupos de filtro están activos (para el contador de la barra). */
export function countActive(f: DashboardFilters): number {
  let n = 0;
  if (f.fechaHoraInicio || f.fechaHoraFin) n++;
  if (f.search) n++;
  for (const k of ARREGLOS) {
    if ((f[k] as string[] | undefined)?.length) n++;
  }
  return n;
}
