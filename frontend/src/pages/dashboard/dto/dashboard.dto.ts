export interface KpiBackend {
  valor: number | null;
  anterior: number | null;
  deltaPct: number | null;
  direccion: "up" | "down" | "flat" | null;
}

export interface DesgloseBackend {
  etiqueta: string;
  total: number;
}

export interface TiempoCanalBackend {
  etiqueta: string;
  total: number;
  promPrimera: number | null;
  promResolucion: number | null;
}

export interface RankingAsesorBackend {
  asesor: string;
  total: number;
  promPrimera: number | null;
  promResolucion: number | null;
  cumpleSlaPct: number | null;
  score: number;
}

export interface RangoBackend {
  inicio: string;
  fin: string;
  comparadoCon: { inicio: string; fin: string };
}

/** Contrato del endpoint histórico /dashboard/resumen (se conserva). */
export interface ResumenResponse {
  rango: RangoBackend | null;
  kpis: {
    total: KpiBackend;
    cerrados: KpiBackend;
    resueltos: KpiBackend;
    cumplimientos: KpiBackend;
    cumplimientoSlaPct: KpiBackend;
    promPrimeraRespMin: KpiBackend;
    promResolucionMin: KpiBackend;
  };
  porCanal: DesgloseBackend[];
  porSubcanal: DesgloseBackend[];
  porEstado: DesgloseBackend[];
  porPais: DesgloseBackend[];
  porAsesor: DesgloseBackend[];
  topAsesores: RankingAsesorBackend[];
  topCategorias: DesgloseBackend[];
  topSubcategorias: DesgloseBackend[];
  tiemposPorCanal: TiempoCanalBackend[];
}

/* ───────────── Dashboard gerencial ───────────── */

export interface TrendPoint {
  periodo: string;
  total: number;
  gestionadas: number;
  slaPrimeraPct: number | null;
  slaResolucionPct: number | null;
  primera: number | null;
  solucion: number | null;
}

export interface SlaCanalPoint {
  etiqueta: string;
  total: number;
  primeraPct: number | null;
  primeraDentro: number;
  primeraEvaluados: number;
  resolucionPct: number | null;
  resolucionDentro: number;
  resolucionEvaluados: number;
}

export interface AsesorGerencial {
  asesor: string;
  total: number;
  gestionadas: number;
  pendientes: number;
  primera: number | null;
  solucion: number | null;
  slaPrimeraPct: number | null;
  slaPrimeraDentro: number;
  slaPrimeraEvaluados: number;
  slaResolucionPct: number | null;
  slaResolucionDentro: number;
  slaResolucionEvaluados: number;
  efectividadPct: number | null;
  reincidencias: number;
  cargaRelativa: number;
}

export interface CasoAlerta {
  ticketId: string | null;
  fecha: string;
  hora: string;
  canal: string;
  asesor: string;
  contacto: string | null;
  numero: string | null;
  dominio: string | null;
  categoria: string;
  estado: string;
  edadMin: number;
  primera: number | null;
  slaPrimera: number;
  slaResolucion: number;
  critico: boolean;
  fueraSla: boolean;
  proximo: boolean;
  antiguo: boolean;
}

export interface CasoActividad {
  ticketId: string | null;
  fecha: string;
  hora: string;
  canal: string;
  asesor: string;
  contacto: string | null;
  numero: string | null;
  dominio: string | null;
  categoria: string;
  estado: string;
  departamento: string | null;
}

export interface SlaMetas {
  primeraRespuesta: { whatsapp: number; correo: number; otro: number };
  resolucion: { whatsapp: number; correo: number; otro: number };
}

export interface GerencialResponse {
  rango: RangoBackend | null;
  generadoEn: string;
  cobertura: { total: number; desde: string | null; hasta: string | null };
  slaMetas: SlaMetas;
  kpis: {
    recibidas: number;
    gestionadas: number;
    cerradas: number;
    resueltas: number;
    pendientes: number;
    sinMapear: number;
    derivadas: number;
    reincidencias: number;
    backlog: number;
    criticos: number;
    fueraSla: number;
    proximosVencer: number;
    antiguos: number;
    primera: number | null;
    atencion: number | null;
    solucion: number | null;
    slaPrimera: { pct: number | null; dentro: number; evaluados: number };
    slaResolucion: { pct: number | null; dentro: number; evaluados: number };
    efectividad: { pct: number | null; gestionadas: number; recibidas: number };
  };
  comparacion: {
    recibidas: KpiBackend;
    gestionadas: KpiBackend;
    slaPrimeraPct: KpiBackend;
    slaResolucionPct: KpiBackend;
    primera: KpiBackend;
    atencion: KpiBackend;
    solucion: KpiBackend;
  };
  tendencia: {
    diaria: TrendPoint[];
    anterior: TrendPoint[];
    semanal: TrendPoint[];
    mensual: TrendPoint[];
  };
  distribuciones: {
    estado: DesgloseBackend[];
    canal: DesgloseBackend[];
    subcanal: DesgloseBackend[];
    pais: DesgloseBackend[];
    categoria: DesgloseBackend[];
    categoriaAnterior: DesgloseBackend[];
    subcategoria: DesgloseBackend[];
    dominio: DesgloseBackend[];
    asesor: DesgloseBackend[];
    tipoCliente: DesgloseBackend[];
    departamento: DesgloseBackend[];
  };
  horas: { hora: number; total: number }[];
  heatmap: { dia: number; hora: number; total: number }[];
  slaPorCanal: SlaCanalPoint[];
  asesores: AsesorGerencial[];
  alertas: {
    resumen: { backlog: number; criticos: number; fueraSla: number; proximos: number; antiguos: number };
    casos: CasoAlerta[];
  };
  actividad: {
    recientes: CasoActividad[];
    cierres: CasoActividad[];
    derivaciones: CasoActividad[];
  };
  opciones: {
    canal: string[];
    pais: string[];
    asesor: string[];
    categoria: string[];
    subcategoria: string[];
    dominio: string[];
    estado: string[];
    tipoCliente: string[];
  };
  brechas: string[];
}
