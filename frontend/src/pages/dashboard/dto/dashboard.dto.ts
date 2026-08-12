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
