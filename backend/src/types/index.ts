/**
 * Tipos compartidos del backend.
 * El contrato de filtros vive aquí para que controllers,
 * services y repositories hablen el mismo idioma.
 */

/** Filtros globales que cualquier endpoint del dashboard acepta. */
export interface DashboardFilters {
  fechaHoraInicio?: string;   // YYYY-MM-DD HH:mm (datetime ISO)
  fechaHoraFin?: string;      // YYYY-MM-DD HH:mm (datetime ISO)
  /** Universo opcional para el detalle. "final" = cerradas + resueltas. */
  universo?: "final" | "todos";
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
  selectedPais?: string;
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

export interface PaisDominioFila {
  pais: string;
  dominio: string;
  categoria: string;
  total: number;
}

export interface PaisEvolucionFila {
  periodo: string;
  pais: string;
  total: number;
}

export interface PaisResponse {
  filas: PaisRow[];
  totales: PaisRow;
  paisCanal: PaisCanalFila[];
  paisCanalSub: PaisCanalSubFila[];
  dominiosPais: PaisDominioFila[];
  evolucionPais: PaisEvolucionFila[];
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
  universo: {
    total: number;
    totalRango: number;
    excluidas: number;
    abiertas: number;
    sinEstado: number;
  };
  totalCategorias: number;
  totalSubcategorias: number;
  categoriaLider: { nombre: string; volumen: number } | null;
  subcategoriaLider: { nombre: string; volumen: number } | null;
  paretoCategorias: {
    categoria: string;
    volumen: number;
    pct: number;
    acumulado: number;
    tecnica: boolean;
  }[];
  paretoSubcategorias: {
    categoria: string;
    subcategoria: string;
    volumen: number;
  }[];
  jerarquia: { categoria: string; subcategoria: string; dominio: string; volumen: number }[];
  categoriasTiempo: {
    categoria: string;
    volumen: number;
    conDato: number;
    tiempo_atencion: number | null;
    tecnica: boolean;
  }[];
  categoriasSLA: {
    categoria: string;
    volumen: number;
    conDato: number;
    cumple: number;
    noCumple: number;
    pctCumple: number | null;
    pctIncumple: number | null;
    tecnica: boolean;
  }[];
  slaMetas: { whatsapp: number; correo: number; otro: number };
  asesorDetalle: { asesor: string; categoria: string; subcategoria: string; volumen: number }[];
  asesorTrazabilidad: { original: string; consolidado: string; volumen: number }[];
  totalSinAsesor: number;
}

/* ──────── Clientes V2 ──────── */

export interface ClienteResumen {
  cliente: string;
  clave: string;
  total: number;
  pct: number;
  variacionPct: number | null;
  tiempoPromedio: number | null;
  conDato: number;
  noCumple: number;
  pctIncumple: number | null;
  reincidenciaMax: number;
  canales: string[];
  esNoIdentificado: boolean;
  ultimaAtencion: string | null;
}

export interface ClienteSeguimiento {
  cliente: string;
  clave: string;
  total: number;
  totalAnterior: number;
  variacionPct: number | null;
  reincidenciaMax: number;
  subcategoriaRecurrente: string | null;
  tiempoPromedio: number | null;
  conDato: number;
  noCumple: number;
  pctIncumple: number | null;
  motivos: string[];
  senales: number;
}

export interface ClientesV2Response {
  universo: {
    total: number;
    totalAnterior: number | null;
    variacionPct: number | null;
    rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  };
  kpis: {
    clientesIdentificados: number;
    atenciones: number;
    atencionesIdentificadas: number;
    atencionesNoIdentificadas: number;
    pctNoIdentificadas: number;
    promedioAtenciones: number;
    clientesConSeguimiento: number;
    clientesMulticanal: number;
  };
  calidad: {
    atencionesNoIdentificadas: number;
    pctNoIdentificadas: number;
    dominiosInvalidos: number;
    numerosDistintos: number;
    identificadosPorCorreo: number;
  };
  canales: {
    ambos: number;
    soloWhatsapp: number;
    soloCorreo: number;
    total: number;
  };
  ranking: ClienteResumen[];
  rankingTotal: number;
  seguimiento: ClienteSeguimiento[];
  seguimientoTotal: number;
}

export interface ClientesListaResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: ClienteResumen[];
}

export interface ClienteCategoria {
  categoria: string;
  total: number;
  pct: number;
  tiempoPromedio: number | null;
  conDato: number;
  noCumple: number;
  pctIncumple: number | null;
}

export interface ClienteCategoriasResponse {
  cliente: string;
  clave: string;
  esNoIdentificado: boolean;
  total: number;
  categorias: ClienteCategoria[];
}

export interface ClienteSubcategoria extends ClienteCategoria {
  subcategoria: string;
}

export interface ClienteSubcategoriasResponse {
  cliente: string;
  clave: string;
  categoria: string;
  esNoIdentificado: boolean;
  total: number;
  subcategorias: ClienteSubcategoria[];
}

export interface ClienteTicket {
  ticket: string;
  canal: string;
  fecha: string;
  categoria: string;
  subcategoria: string;
  dominio: string;
  contacto: string | null;
  numero: string | null;
  asesor: string;
  estado: string;
  tiempoResolucion: number | null;
  cumpleSla: boolean | null;
  umbralMinutos: number;
  urlTicket: string | null;
}

export interface ClienteTicketsResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: ClienteTicket[];
}

export interface ClienteEvolucionResponse {
  cliente: string;
  clave: string;
  esNoIdentificado: boolean;
  granularidad: "diaria" | "semanal" | "mensual";
  actual: { periodo: string; total: number }[];
  anterior: { periodo: string; total: number }[];
  totalActual: number;
  totalAnterior: number;
  variacionPct: number | null;
}

/* ──────── Quejas y Devoluciones ──────── */

export interface QuejasDevolucionesKpis {
  totalCasos: number;
  quejas: number;
  devoluciones: number;
  pctQuejas: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
  primeraN: number;
  primeraCobertura: number;
  primeraMediana: number | null;
  primeraP90: number | null;
  primeraPromedio: number | null;
  primeraSinDato: number;
  resolucionN: number;
  resolucionCobertura: number;
  resolucionMediana: number | null;
  resolucionP90: number | null;
  resolucionPromedio: number | null;
  resolucionExcluidas: number;
}

export interface QuejasEstado {
  estado: string;
  etiqueta: string;
  total: number;
  pct: number;
}

export interface QuejasTipo {
  tipo: "queja" | "devolucion";
  etiqueta: string;
  total: number;
  pct: number;
}

export interface QuejasCanal {
  canal: string;
  quejas: number;
  devoluciones: number;
  total: number;
  pct: number;
}

export interface QuejasTiempoTipo {
  tipo: "queja" | "devolucion";
  etiqueta: string;
  total: number;
  primeraN: number;
  primeraMediana: number | null;
  primeraP90: number | null;
  primeraPromedio: number | null;
  resolucionN: number;
  resolucionMediana: number | null;
  resolucionP90: number | null;
  resolucionPromedio: number | null;
}

export interface QuejasAsesor {
  asesor: string;
  quejas: number;
  devoluciones: number;
  total: number;
  pct: number;
}

export interface QuejasEvolucion {
  actual: { periodo: string; quejas: number; devoluciones: number; total: number }[];
  anterior: { periodo: string; quejas: number; devoluciones: number; total: number }[];
  totalActual: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
}

export interface QuejasDevolucionesResponse {
  kpis: QuejasDevolucionesKpis;
  estados: QuejasEstado[];
  tipos: QuejasTipo[];
  canales: QuejasCanal[];
  tiemposPorTipo: QuejasTiempoTipo[];
  asesores: QuejasAsesor[];
  evolucion: QuejasEvolucion;
  insights: string[];
}
