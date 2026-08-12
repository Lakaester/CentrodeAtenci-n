/**
 * Tipos compartidos del backend.
 * El contrato de filtros vive aquí para que controllers,
 * services y repositories hablen el mismo idioma.
 */

/** Filtros globales que cualquier endpoint del dashboard acepta. */
export interface DashboardFilters {
  fechaHoraInicio?: string;   // YYYY-MM-DD HH:mm (datetime ISO)
  fechaHoraFin?: string;      // YYYY-MM-DD HH:mm (datetime ISO)
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
  rangoPrimeraRespuesta?: string[];
  search?: string;
  pagina?: number;
  limite?: number;
}

/** Respuesta estándar de la API. */
export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

/* ──────── País / Country Matrix (snake_case para coincidir con SQL) ──────── */

export interface PaisRow {
  pais: string;
  wpp_total: number;
  wpp_en_proceso: number;
  wpp_cerradas: number;
  wpp_avg_espera: number | null;
  wpp_avg_atencion: number | null;
  wpp_avg_total: number | null;
  wpp_sla_esp_1: number; wpp_sla_esp_2: number; wpp_sla_esp_3: number;
  wpp_sla_esp_4: number; wpp_sla_esp_5: number; wpp_sla_esp_t: number;
  wpp_sla_ate_1: number; wpp_sla_ate_2: number; wpp_sla_ate_3: number;
  wpp_sla_ate_4: number; wpp_sla_ate_5: number; wpp_sla_ate_t: number;
  corr_total: number;
  corr_en_proceso: number;
  corr_cerradas: number;
  corr_avg_espera: number | null;
  corr_avg_atencion: number | null;
  corr_avg_total: number | null;
  corr_sla_pr_1: number; corr_sla_pr_2: number; corr_sla_pr_3: number;
  corr_sla_pr_4: number; corr_sla_pr_5: number; corr_sla_pr_t: number;
  corr_sla_ate_1: number; corr_sla_ate_2: number; corr_sla_ate_3: number;
  corr_sla_ate_4: number; corr_sla_ate_5: number; corr_sla_ate_t: number;
}

export interface PaisCanalFila {
  pais: string;
  canal: string;
  categoria: string;
  total: number;
}

export interface PaisCanalSubFila {
  pais: string;
  canal: string;
  categoria: string;
  subcategoria: string;
  total: number;
}

export interface PaisResponse {
  filas: PaisRow[];
  totales: PaisRow;
  paisCanal: PaisCanalFila[];
  paisCanalSub: PaisCanalSubFila[];
}

export interface AsesorRow {
  asesor: string;
  wpp_total: number;
  wpp_en_proceso: number;
  wpp_cerradas: number;
  wpp_avg_espera: number | null;
  wpp_avg_atencion: number | null;
  wpp_avg_total: number | null;
  wpp_sla_esp_1: number; wpp_sla_esp_2: number; wpp_sla_esp_3: number;
  wpp_sla_esp_4: number; wpp_sla_esp_5: number; wpp_sla_esp_t: number;
  wpp_sla_ate_1: number; wpp_sla_ate_2: number; wpp_sla_ate_3: number;
  wpp_sla_ate_4: number; wpp_sla_ate_5: number; wpp_sla_ate_t: number;
  corr_total: number;
  corr_en_proceso: number;
  corr_cerradas: number;
  corr_avg_espera: number | null;
  corr_avg_atencion: number | null;
  corr_avg_total: number | null;
  corr_sla_pr_1: number; corr_sla_pr_2: number; corr_sla_pr_3: number;
  corr_sla_pr_4: number; corr_sla_pr_5: number; corr_sla_pr_t: number;
  corr_sla_ate_1: number; corr_sla_ate_2: number; corr_sla_ate_3: number;
  corr_sla_ate_4: number; corr_sla_ate_5: number; corr_sla_ate_t: number;
}

export interface AsesoresMatrixResponse {
  filas: AsesorRow[];
  totales: AsesorRow;
}

export interface DetalleFila {
  fecha: string;
  hora: string;
  canal: string;
  subcanal: string;
  ticket: string | null;
  contacto: string | null;
  numeroCorreo: string | null;
  pais: string;
  asesor: string;
  estado: string;
  categoria: string;
  subcategoria: string;
  primeraRespuesta: number | null;
  resolucion: number | null;
  tiempoPromedio: number | null;
  dominio: string;
  tipoCliente: string | null;
}

export interface DetalleResponse {
  filas: DetalleFila[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/* ──────── Categorías V2 ──────── */

export interface CategoriasV2Response {
  totalCategorias: number;
  totalSubcategorias: number;
  categoriaLider: { nombre: string; volumen: number } | null;
  subcategoriaLider: { nombre: string; volumen: number } | null;
  paretoCategorias: { categoria: string; volumen: number; pct: number; acumulado: number }[];
  paretoSubcategorias: { subcategoria: string; volumen: number; pct: number; acumulado: number }[];
  jerarquia: { categoria: string; subcategoria: string; volumen: number }[];
  categoriasTiempo: { categoria: string; volumen: number; tiempo_resolucion: number | null; tiempo_espera: number | null; tiempo_atencion: number | null; sla: number | null }[];
  subcategoriasTiempo: { subcategoria: string; categoria: string; volumen: number; tiempo_resolucion: number | null; sla: number | null }[];
  categoriasSLA: { categoria: string; volumen: number; sla: number | null }[];
  subcategoriasSLA: { subcategoria: string; categoria: string; volumen: number; sla: number | null }[];
  matrizAsesor: { asesor: string; categoria: string; volumen: number }[];
  matrizSubAsesor: { asesor: string; subcategoria: string; volumen: number }[];
  impacto: { categoria: string; volumen: number; tiempo: number | null; sla: number | null }[];
}

/* ──────── Clientes V2 ──────── */

export interface ClientesV2Response {
  kpis: {
    unicos: number;
    totalAtenciones: number;
    conDominio: number;
    pctConDominio: number;
    sinDominio: number;
    pctSinDominio: number;
    wpp: number;
    pctWpp: number;
    correo: number;
    pctCorreo: number;
    promedioAtenciones: number;
  };
  jerarquia: { cliente: string; canal: string; categoria: string; subcategoria: string; total: number; tiempo_espera: number | null; tiempo_resolucion: number | null; sla: number | null }[];
  ranking: { cliente: string; total: number; pct: number; tiempo_espera: number | null; tiempo_resolucion: number | null; sla: number | null }[];
  rankingTiempo: { cliente: string; tiempo_resolucion: number | null; total: number; sla: number | null }[];
  rankingSLA: { cliente: string; sla: number | null; total: number; tiempo_resolucion: number | null }[];
  riesgo: { cliente: string; score: number; total: number; tiempo_resolucion: number | null; sla: number | null; nivel: string }[];
  evolucion: { cliente: string; periodo: string; total: number }[];
}

/* ──────── Quejas y Devoluciones ──────── */

export interface QuejasDevolucionesResponse {
  totalQuejas: number;
  totalDevoluciones: number;
  totalGeneral: number;
  totalClientesConNombre: number;
  evolucion: { periodo: string; quejas: number; devoluciones: number }[];
  porCanal: { canal: string; quejas: number; devoluciones: number }[];
  porPais: { pais: string; quejas: number; devoluciones: number }[];
  porAsesor: { asesor: string; quejas: number; devoluciones: number }[];
  porCliente: { cliente: string; quejas: number; devoluciones: number }[];
  porDia: { fecha: string; quejas: number; devoluciones: number }[];
  porDiaSemana: { dia: string; orden: number; quejas: number; devoluciones: number }[];
  porHora: { hora: number; quejas: number; devoluciones: number }[];
  tiempos: { tipo: string; primeraRespuestaPromedio: number | null; resolucionPromedio: number | null }[];
  variacion: {
    total:    { actual: number; anterior: number | null; delta: number | null; pct: number | null };
    quejas:   { actual: number; anterior: number | null; delta: number | null; pct: number | null };
    devoluciones: { actual: number; anterior: number | null; delta: number | null; pct: number | null };
  };
}
