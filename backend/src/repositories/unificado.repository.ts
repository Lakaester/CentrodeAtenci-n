/**
 * Repositorio: UNICO lugar que toca la base. Lee v_unificado_norm.
 * Aplica filtros dinámicos, comparación contra el período anterior,
 * y expone las opciones para los desplegables de filtros.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { DashboardFilters, PaisRow, PaisDominioFila, PaisResponse, AsesorRow, AsesoresMatrixResponse, DetalleFila, DetalleResponse, CategoriasV2Response, QuejasDevolucionesResponse, ClientesV2Response, ClientesListaResponse, ClienteCategoriasResponse, ClienteSubcategoriasResponse, ClienteTicketsResponse, ClienteEvolucionResponse, ClienteResumen, ClienteSeguimiento } from "../types";
import { construirWhere, rangoAnterior, comparar, KpiComparado } from "../utils/filtros";
import {
  etiquetaPeriodo as etiquetaPeriodoOp,
  generarPeriodos as generarPeriodosOp,
  inicioPeriodo,
} from "../utils/operacionPeriodos";
import { ASESOR_SIN_ASIGNAR, consolidarAsesor } from "../utils/asesorEquivalencias";
import {
  CLIENTE_KEY,
  CLIENTE_NOMBRE,
  DOMINIO_NORMALIZADO,
  DOMINIO_VALIDO,
  IDENTIFICADO_POR_CORREO,
  SIN_IDENTIFICAR_KEY,
  SIN_IDENTIFICAR_LABEL,
  nombreCliente,
} from "../utils/clientesIdentificacion";

/** Expresiones SQL de normalización (homologación de nombres en toda la app). */
const N_PAIS = Prisma.sql`INITCAP(TRANSLATE(REPLACE(TRIM(pais), '_', ' '), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun'))`;
const N_ASESOR = Prisma.sql`INITCAP(TRANSLATE(SPLIT_PART(REPLACE(asesor, '_', ' '), ' ', 1), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun'))`;
const N_SUBCATEGORIA = Prisma.sql`REPLACE(subcategoria, '_', ' ')`;
const N_CATEGORIA = Prisma.sql`COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría')`;
const N_ASESOR_COALESCE = Prisma.sql`COALESCE(${N_ASESOR}, 'Sin asesor')`;
const OFFICIAL_FILTER = Prisma.sql`${N_ASESOR} = ANY(ARRAY['Alex','Andres','Danilo','Eveling','Lidia','Lisbeth','Sheyla','Victor']::text[])`;

/** Universo del reporte Resumen: atenciones finalizadas (cerradas o resueltas). */
const FINALIZADAS = Prisma.sql`estado_homologado IN ('cerrado', 'resuelto')`;

/**
 * Normalización SQL de dominio — equivalente a normalizeDomain() de JS.
 * Quita: protocolo (http://, https://), paths, query strings, fragments,
 * trailing slashes, trailing dots, espacios, mayúsculas.
 * Fuente única de verdad para GROUP BY / DISTINCT / filtros en SQL.
 */
const N_DOMINIO = Prisma.sql`NULLIF(LOWER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
  REGEXP_REPLACE(TRIM(dominio), '^[[:space:]]*https?://', ''),
  '/.*$', ''), '#.*$', ''), '[?].*$', ''), '[.]\\s*$', '')), '')`;
const N_DOMINIO_COALESCE = Prisma.sql`COALESCE(${N_DOMINIO}, '—')`;

/* ── HOMOLOGACIÓN CENTRAL DE SUBCATEGORÍAS (fuente única de verdad) ──
 * Clave de agrupación: cope_scat_normalizada(subcategoria) — lowercase, sin tildes,
 * espacios colapsados, _ → espacio. Consolida variantes de escritura entre canales.
 * Etiqueta mostrada: INITCAP(cope_scat_normalizada(subcategoria)) — canónico.
 * IMPORTANTE: SCAT_LABEL se construye sobre la MISMA clave normalizada (SCAT_KEY)
 * para que sea funcionalmente dependiente del GROUP BY (requisito de GROUP BY
 * estricto en PostgreSQL y motores SQL). Todas las queries que agrupan por
 * subcategoría usan SCAT_KEY en GROUP BY y SCAT_LABEL en SELECT.
 */
const SCAT_KEY = Prisma.sql`cope_scat_normalizada(subcategoria)`;
const SCAT_LABEL = Prisma.sql`COALESCE(NULLIF(INITCAP(cope_scat_normalizada(subcategoria)), ''), 'Sin subcategoría')`;
/* Alias de agrupación: las queries agrupan por la clave normalizada (SCAT_KEY). */
const SCAT_GROUP = SCAT_KEY;

export interface Desglose {
  etiqueta: string;
  total: number;
}

interface FilaTotales {
  total: number;
  cerrados: number;
  resueltos: number;
  sin_mapear: number;
  prom_primera: number | null;
  prom_resolucion: number | null;
}

export interface ResumenResponse {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  kpis: {
    /** Total de atenciones finalizadas (cerradas + resueltas). */
    total: KpiComparado;
    cerrados: KpiComparado;
    resueltos: KpiComparado;
    cumplimientos: KpiComparado;
    /** Compatibilidad: equivale a cumplimientoPrimeraPct. */
    cumplimientoSlaPct: KpiComparado;

    cumplimientoPrimeraPct: KpiComparado;
    primeraDentro: KpiComparado;
    primeraFuera: KpiComparado;
    primeraConDato: KpiComparado;

    cumplimientoResolucionPct: KpiComparado;
    resolucionDentro: KpiComparado;
    resolucionFuera: KpiComparado;
    resolucionConDato: KpiComparado;

    promPrimeraRespMin: KpiComparado;
    promResolucionMin: KpiComparado;
  };
  porCanal: Desglose[];
  porSubcanal: Desglose[];
  porEstado: Desglose[];
  porPais: Desglose[];
  porAsesor: Desglose[];
  topAsesores: RankingAsesor[];
  topCategorias: Desglose[];
  topSubcategorias: Desglose[];
  tiemposPorCanal: TiempoCanal[];
}

export interface TiempoCanal {
  etiqueta: string;
  total: number;
  promPrimera: number | null;
  promResolucion: number | null;
}

/* =========================================================================
 *  SLA — Cumplimiento de tiempos por canal
 *  ⚙️  AQUÍ SE EDITAN LOS OBJETIVOS DE SLA (en MINUTOS).
 *  Cada canal tiene su propia meta porque WhatsApp y Correo no son comparables.
 *  Cambia solo estos números cuando tengas tus metas reales; nada más.
 * ========================================================================= */
export const SLA_MINUTOS = {
  primeraRespuesta: { whatsapp: 15, correo: 1440, otro: 60 }, // 15 min / 24 h / 1 h
  resolucion: { whatsapp: 120, correo: 1440, otro: 480 }, // PROVISIONAL: aún por definir por categoría
};

/* =========================================================================
 *  PODIO DE ASESORES (Top 3: oro/plata/bronce)
 *  El "performance" combina tres cosas. Ajusta SOLO estos pesos si quieres
 *  darle más importancia a una u otra (deben sumar 1).
 *    - cumplimiento de SLA  (responder/resolver a tiempo)
 *    - velocidad            (tiempos bajos de 1ª respuesta)
 *    - volumen              (cantidad de atenciones)
 *  MIN_CASOS_PODIO evita que alguien con 1 solo caso rapidísimo gane el oro.
 * ========================================================================= */
const PESOS_PODIO = { sla: 0.4, velocidad: 0.3, volumen: 0.3 };
const MIN_CASOS_PODIO = 5;

/** Grupo de canal robusto (no depende de mayúsculas ni del nombre exacto). */
const GRUPO_CANAL = Prisma.sql`
  CASE
    WHEN canal ILIKE '%what%'                                  THEN 'whatsapp'
    WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%'     THEN 'correo'
    ELSE 'otro'
  END`;

/** Umbral (en minutos) que aplica a cada fila según su grupo de canal. */
function umbral(metas: { whatsapp: number; correo: number; otro: number }): Prisma.Sql {
  return Prisma.sql`
    CASE
      WHEN canal ILIKE '%what%'                                THEN ${metas.whatsapp}
      WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%'   THEN ${metas.correo}
      ELSE ${metas.otro}
    END`;
}

export interface SlaFila {
  etiqueta: string;
  total: number;
  cumplePrimeraPct: number | null;
  cumpleResolucionPct: number | null;
  dentroPrimera: number;
  conDatoPrimera: number;
}

interface SlaTotales {
  pr_con_dato: number;
  pr_dentro: number;
  res_con_dato: number;
  res_dentro: number;
}

/** Una fila del podio de asesores, ya con su puntaje de performance (0-100). */
export interface RankingAsesor {
  asesor: string;
  total: number;
  promPrimera: number | null;
  promResolucion: number | null;
  cumpleSlaPct: number | null;
  cumpleResolucionPct: number | null;
  score: number;
}

export interface SlaResponse {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  metas: typeof SLA_MINUTOS;
  kpis: {
    cumplimientoPrimera: KpiComparado; // %
    cumplimientoResolucion: KpiComparado; // %
    dentroPrimera: KpiComparado; // conteo
    fueraPrimera: KpiComparado; // conteo
  };
  porCanal: SlaFila[];
  porAsesor: SlaFila[];
  porPaisWhatsapp: SlaFila[];
  porPaisCorreo: SlaFila[];
  porAsesorWhatsapp: SlaFila[];
  porAsesorCorreo: SlaFila[];
  porCategoriaWhatsapp: SlaFila[];
  porCategoriaCorreo: SlaFila[];
}

export interface OperacionResponse {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  kpis: {
    total: KpiComparado;
    promedioPorDia: KpiComparado;
    diasConDatos: number;
    diasConDatosAnterior: number | null;
    horaPico: string | null;
    horaPicoValor: number | null;
    horaPicoAnterior: string | null;
    horaPicoAnteriorValor: number | null;
    diaCargado: string | null;
    diaCargadoValor: number | null;
    diaCargadoAnterior: string | null;
    diaCargadoAnteriorValor: number | null;
  };
  heatmap: { hora: number; dia: number; total: number }[];
  diasPorDia: { dia: number; dias: number }[];
  porSubcanal: Desglose[];
  duplicadosEntreCanales: number;
  topAsesores: Desglose[];
  topCategorias: Desglose[];
  evolucion: {
    diaria: { actual: OperacionPeriodo[]; anterior: OperacionPeriodo[] };
    semanal: { actual: OperacionPeriodo[]; anterior: OperacionPeriodo[] };
    mensual: { actual: OperacionPeriodo[]; anterior: OperacionPeriodo[] };
    trimestral: { actual: OperacionPeriodo[]; anterior: OperacionPeriodo[] };
  };
}

export type GranularidadOperacion = "diaria" | "semanal" | "mensual" | "trimestral";

export interface OperacionPeriodo {
  periodo: string;
  total: number;
  porSubcanal: { subcanal: string; total: number }[];
}

/* ------------------------------------------------------------------ */
/*  ASESORES                                                          */
/* ------------------------------------------------------------------ */
export interface AsesoresKpis {
  totalAtenciones: number;
  promedioPrimeraRespuesta: number | null;
  promedioResolucion: number | null;
  promedioEspera: number | null;
  fcr: number | null;
  asesoresActivos: number;
  promedioAtencionesPorAsesor: number | null;
  tiempoPromedioPorAtencion: number | null;
}
export interface FilaRanking {
  asesor: string;
  total: number;
  porcentaje: number;
  fcr: number | null;
  promedioPrimeraRespuesta: number | null;
  promedioResolucion: number | null;
  promedioEspera: number | null;
  scoreGlobal: number;
  scoreWhatsapp: number;
  scoreCorreo: number;
  volumenNormalizado: number;
  cumplimientoPrimeraRespuesta: number | null;
  cumplimientoResolucion: number | null;
}
export interface FilaEvolucion {
  periodo: string;
  asesor: string;
  total: number;
}
export interface FilaTiempoCanal {
  asesor: string;
  whatsapp: number | null;
  correo: number | null;
}
export interface FilaMatriz {
  etiqueta: string;
  asesor: string;
  total: number;
}
export interface AsesoresResponse {
  kpis: AsesoresKpis;
  ranking: FilaRanking[];
  volumenPorAsesor: { asesor: string; total: number; porcentaje: number }[];
  evolucionDiaria: FilaEvolucion[];
  evolucionPorHora: FilaEvolucion[];
  evolucionSemanal: FilaEvolucion[];
  evolucionMensual: FilaEvolucion[];
  tiemposPrimeraRespuesta: FilaTiempoCanal[];
  tiemposResolucion: FilaTiempoCanal[];
  matrizCategoria: FilaMatriz[];
  matrizSubcategoria: FilaMatriz[];
  quintiles: { asesor: string; muyRapido: number; rapido: number; normal: number; lento: number; muyLento: number }[];
  performancePais: { pais: string; asesor: string; total: number }[];
  performanceCanal: { canal: string; total: number }[];
  performanceCategoria: FilaMatriz[];
  performanceSubcategoria: FilaMatriz[];
  asesorCanal: { asesor: string; canal: string; categoria: string; total: number }[];
  asesorCanalSub: { asesor: string; canal: string; categoria: string; subcategoria: string; total: number }[];
  detalle: {
    fecha: string; hora: string; asesor: string; canal: string; subcanal: string;
    pais: string; dominio: string; categoria: string; subcategoria: string;
    tiempoPrimeraRespuesta: number | null; tiempoResolucion: number | null;
    tiempoEspera: number | null; estado: string; ticket: string | null;
  }[];
}

export interface OpcionesFiltro {
  canal: string[];
  subcanal: string[];
  pais: string[];
  asesor: string[];
  categoria: string[];
  subcategoria: string[];
  dominio: string[];
  estado: string[];
  tipoCliente: string[];
  rangoAtencion: string[];
}

/* ------------------------------------------------------------------ */
/*  CATEGORÍAS                                                        */
/* ------------------------------------------------------------------ */
export interface CategoriaKpi {
  totalCategorias: number;
  totalSubcategorias: number;
  categoriaLider: { nombre: string; total: number } | null;
  subcategoriaLider: { nombre: string; total: number } | null;
  tiempoEspera: number | null;
  tiempoAtencion: number | null;
  tiempoTotal: number | null;
  slaEspera: number | null;
  slaAtencion: number | null;
}
export interface CategoriaTop {
  categoria: string;
  total: number;
  porcentaje: number;
  tiempoEspera: number | null;
  tiempoAtencion: number | null;
  tiempoTotal: number | null;
  sla: number | null;
}
export interface SubcategoriaTop {
  subcategoria: string;
  total: number;
  porcentaje: number;
  tiempoEspera: number | null;
  tiempoAtencion: number | null;
  tiempoTotal: number | null;
  sla: number | null;
}
export interface CatTiempo {
  categoria: string;
  primeraRespuesta: number | null;
  resolucion: number | null;
  espera: number | null;
}
export interface CatSla {
  categoria: string;
  cumple: number;
  noCumple: number;
  total: number;
  pctCumple: number;
}
export interface SubSla {
  subcategoria: string;
  cumple: number;
  noCumple: number;
  total: number;
  pctCumple: number;
}
export interface CatCanal {
  categoria: string;
  whatsapp: number;
  whaticket: number;
  zendesk: number;
}
export interface CatAsesor {
  categoria: string;
  asesor: string;
  total: number;
}
export interface CatPais {
  categoria: string;
  pais: string;
  total: number;
}
export interface CatDominio {
  categoria: string;
  dominio: string;
  total: number;
}
export interface EvItem {
  periodo: string;
  total: number;
  promPrimera: number | null;
  promResolucion: number | null;
  cumpleSla: number | null;
}
export interface TendenciaCat {
  categoria: string;
  actual: number;
  anterior: number;
  delta: number;
  deltaPct: number | null;
}
export interface Complejidad {
  categoria: string;
  score: number;
  nivel: string;
  tiempoResolucion: number | null;
  tiempoEspera: number | null;
  incumplimientoSla: number | null;
  quintilPromedio: number | null;
}
export interface Oportunidad {
  categoria: string;
  total: number;
  score: number;
  motivo: string;
}
export interface Variabilidad {
  categoria: string;
  mejor: number | null;
  peor: number | null;
  promedio: number | null;
  desviacion: number | null;
  numAsesores: number;
}
export interface FilaEjecutiva {
  categoria: string;
  subcategoria: string;
  total: number;
  porcentaje: number;
  promPrimera: number | null;
  promResolucion: number | null;
  promEspera: number | null;
  fcr: number | null;
  sla: number | null;
  principalAsesor: string;
  principalCanal: string;
  principalPais: string;
  principalDominio: string;
}
export interface CategoriasResponse {
  kpis: CategoriaKpi;
  topCategorias: CategoriaTop[];
  topSubcategorias: SubcategoriaTop[];
  pareto: { categoria: string; total: number; porcentaje: number; acumulado: number; tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null; slaEspera: number | null; slaAtencion: number | null; numAsesores: number }[];
  paretoSub: { subcategoria: string; categoria: string; total: number; porcentaje: number; acumulado: number; tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null; slaAtencion: number | null }[];
  tiemposCategoria: CatTiempo[];
  slaCategoria: CatSla[];
  slaSubcategoria: SubSla[];
  matrizCanal: CatCanal[];
  matrizAsesor: CatAsesor[];
  matrizSubAsesor: { subcategoria: string; asesor: string; total: number }[];
  matrizPais: CatPais[];
  jerarquia: { categoria: string; subcategoria: string; canal: string; total: number; tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null; slaEspera: number | null; slaAtencion: number | null }[];
}

/* ------------------------------------------------------------------ */
/*  CLIENTES                                                          */
/* ------------------------------------------------------------------ */
export interface ClientesKpis {
  clientesUnicos: number;
  totalAtenciones: number;
  clientesConDominio: number;
  clientesSinDominio: number;
  pctConDominio: number;
  pctSinDominio: number;
  clientesWhatsapp: number;
  clientesCorreo: number;
  tiempoPrimeraWhatsapp: number | null;
  tiempoPrimeraCorreo: number | null;
  tiempoResolucionWhatsapp: number | null;
  tiempoResolucionCorreo: number | null;
  cumplimientoSla: number | null;
  fcr: number | null;
}
export interface ClienteRanking {
  cliente: string;
  total: number;
  porcentaje: number;
  tiempoPromedio: number | null;
  sla: number | null;
}
export interface ClienteDetalle {
  cliente: string;
  dominio: string;
  pais: string;
  canalPrincipal: string;
  total: number;
  tiempoResolucion: number | null;
  tiempoPrimera: number | null;
  sla: number | null;
  fcr: number | null;
  categoriaPrincipal: string;
  subcategoriaPrincipal: string;
  ultimaAtencion: string;
}
export interface ClienteCanal {
  cliente: string;
  whatsapp: number;
  whaticket: number;
  zendesk: number;
}
export interface ClienteCategoria {
  cliente: string;
  categoria: string;
  total: number;
}
export interface ClienteTiempo {
  cliente: string;
  primeraRespuesta: number | null;
  resolucion: number | null;
}
export interface ClienteSla {
  cliente: string;
  cumple: number;
  noCumple: number;
  total: number;
  pctCumple: number;
}
export interface ClienteEvolucion {
  periodo: string;
  cliente: string;
  total: number;
}
export interface ConsumoCliente {
  cliente: string;
  total: number;
  tiempoTotal: number;
  tiempoPromedio: number | null;
  categoriasDistintas: number;
  indiceConsumo: number;
}
export interface ComplejidadCliente {
  cliente: string;
  score: number;
  nivel: string;
  tiempoResolucion: number | null;
  incumplimientoSla: number | null;
  categoriasDistintas: number;
  asesoresInvolucrados: number;
}
export interface Repetitiva {
  cliente: string;
  categoria: string;
  total: number;
}
export interface ClienteCapacitacion {
  cliente: string;
  total: number;
  score: number;
  motivo: string;
}
export interface ClienteRiesgo {
  cliente: string;
  score: number;
  nivel: string;
  total: number;
  tiempoResolucion: number | null;
}
export interface TipoClienteComp {
  tipo: string;
  total: number;
  tiempoResolucion: number | null;
  sla: number | null;
}
export interface ClienteAsesor {
  cliente: string;
  asesor: string;
  total: number;
}
export interface TopDominio {
  dominio: string;
  total: number;
  porcentaje: number;
  tiempoPromedio: number | null;
}
export interface DetalleAtencion {
  fecha: string; hora: string; cliente: string; dominio: string;
  pais: string; canal: string; subcanal: string; categoria: string;
  subcategoria: string; asesor: string; tiempoPrimeraRespuesta: number | null;
  tiempoResolucion: number | null; sla: number | null; estado: string; ticket: string | null;
}
export interface ClientesResponse {
  kpis: ClientesKpis;
  distCanal: { canal: string; total: number; porcentaje: number }[];
  distDominio: { grupo: string; total: number; porcentaje: number }[];
  topClientes: ClienteRanking[];
  ranking: ClienteDetalle[];
  clientesPorCanal: ClienteCanal[];
  clientesPorPais: { pais: string; total: number }[];
  matrizClienteCategoria: ClienteCategoria[];
  matrizClienteSubcategoria: ClienteCategoria[];
  tiemposCliente: ClienteTiempo[];
  slaCliente: ClienteSla[];
  evolucion: ClienteEvolucion[];
  consumo: ConsumoCliente[];
  complejidad: ComplejidadCliente[];
  repetitivas: Repetitiva[];
  diversidad: { cliente: string; categorias: number }[];
  capacitacion: ClienteCapacitacion[];
  riesgo: ClienteRiesgo[];
  tipoCliente: TipoClienteComp[];
  clienteAsesor: ClienteAsesor[];
  topDominios: TopDominio[];
  detalle: DetalleAtencion[];
  insights: string[];
}

/* ------------------------------------------------------------------ */
/*  WHATSAPP                                                          */
/* ------------------------------------------------------------------ */
export interface WhatsAppKpis {
  totalConversaciones: number;
  totalWhaticket: number;
  totalWameta: number;
  pctWhaticket: number;
  pctWameta: number;
  primeraN: number;
  primeraCobertura: number;
  primeraPromedio: number | null;
  primeraMediana: number | null;
  primeraP90: number | null;
  resolucionN: number;
  resolucionCobertura: number;
  resolucionPromedio: number | null;
  resolucionMediana: number | null;
  resolucionP90: number | null;
  slaPrimeraCumple: number;
  slaPrimeraEvaluables: number;
  slaPrimeraPct: number | null;
  slaPrimeraUmbral: number;
  cerradas: number;
  abiertas: number;
  sinEstado: number;
  otros: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
}

export interface WhatsAppPlataforma {
  subcanal: string;
  nombre: string;
  total: number;
  porcentaje: number;
  primeraN: number;
  primeraCobertura: number;
  primeraPromedio: number | null;
  primeraMediana: number | null;
  primeraP90: number | null;
  resolucionN: number;
  resolucionCobertura: number;
  resolucionPromedio: number | null;
  resolucionMediana: number | null;
  resolucionP90: number | null;
  slaCumple: number;
  slaEvaluables: number;
  slaPct: number | null;
  cerradas: number;
  abiertas: number;
  sinEstado: number;
  otros: number;
}

export interface WhatsAppEstado {
  estado: "cerrado" | "abierto" | "sin_mapear" | "otro";
  etiqueta: string;
  total: number;
  pct: number;
}

export interface WhatsAppEvolucion {
  actual: { periodo: string; total: number }[];
  anterior: { periodo: string; total: number }[];
  totalActual: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
}

export interface WhatsAppExcepcion {
  contacto: string;
  asesor: string;
  plataforma: string;
  tiempo: number;
  tipoTiempo: "resolucion" | "transcurrido";
  fecha: string;
  estado: string;
  umbral: number;
}

export interface WhatsAppResponse {
  kpis: WhatsAppKpis;
  estados: WhatsAppEstado[];
  plataformas: WhatsAppPlataforma[];
  evolucion: WhatsAppEvolucion;
  horas: { hora: number; total: number }[];
  dias: { dia: number; total: number }[];
  excepciones: WhatsAppExcepcion[];
  insights: string[];
}

/* ------------------------------------------------------------------ */
/*  ZENDESK                                                           */
/* ------------------------------------------------------------------ */
export interface ZendeskKpis {
  totalTickets: number;
  cerrados: number;
  resueltos: number;
  abiertos: number;
  pendientes: number;
  enEspera: number;
  otros: number;
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
  slaPrimeraCumple: number;
  slaPrimeraEvaluables: number;
  slaPrimeraPct: number | null;
  slaPrimeraUmbral: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
}
export interface ZendeskEstado {
  estado: string;
  etiqueta: string;
  total: number;
  pct: number;
}
export interface ZendeskEvolucion {
  actual: { periodo: string; total: number }[];
  anterior: { periodo: string; total: number }[];
  totalActual: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
}
export interface ZendeskBacklog {
  abiertos: number;
  pendientes: number;
  enEspera: number;
  total: number;
  fechaCorte: string;
}
export interface ZendeskResponse {
  kpis: ZendeskKpis;
  estados: ZendeskEstado[];
  evolucion: ZendeskEvolucion;
  backlog: ZendeskBacklog;
  insights: string[];
}

async function totales(where: Prisma.Sql): Promise<FilaTotales> {
  const filas = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      COUNT(*)::int                                                  AS total,
      COUNT(*) FILTER (WHERE estado_homologado = 'cerrado')::int     AS cerrados,
      COUNT(*) FILTER (WHERE estado_homologado = 'resuelto')::int    AS resueltos,
      COUNT(*) FILTER (WHERE estado_homologado = 'sin_mapear')::int  AS sin_mapear,
      ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8     AS prom_primera,
      ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8           AS prom_resolucion
    FROM public.v_unificado_norm
    ${where}
  `)) as FilaTotales[];
  return (
    filas[0] ?? {
      total: 0,
      cerrados: 0,
      resueltos: 0,
      sin_mapear: 0,
      prom_primera: null,
      prom_resolucion: null,
    }
  );
}

async function desglose(where: Prisma.Sql, col: Prisma.Sql): Promise<Desglose[]> {
  return (await prisma.$queryRaw(Prisma.sql`
    SELECT COALESCE(${col}, 'Sin dato') AS etiqueta, COUNT(*)::int AS total
    FROM public.v_unificado_norm
    ${where}
    GROUP BY ${col}
    ORDER BY total DESC
  `)) as Desglose[];
}

/** Igual que desglose pero acotado a los N más frecuentes (para los "tops"). */
async function desgloseTop(where: Prisma.Sql, col: Prisma.Sql, limite: number = 10): Promise<Desglose[]> {
  return (await prisma.$queryRaw(Prisma.sql`
    SELECT COALESCE(${col}, 'Sin dato') AS etiqueta, COUNT(*)::int AS total
    FROM public.v_unificado_norm
    ${where}
    GROUP BY ${col}
    ORDER BY total DESC
    LIMIT ${limite}
  `)) as Desglose[];
}

/** Conteos globales de cumplimiento SLA (1ª respuesta y resolución). */
async function slaTotales(where: Prisma.Sql): Promise<SlaTotales> {
  const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
  const uRes = umbral(SLA_MINUTOS.resolucion);
  const filas = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int                          AS pr_con_dato,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                        AND primera_respuesta_min_norm <= ${uPr})::int                             AS pr_dentro,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int                                 AS res_con_dato,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL
                        AND resolucion_min_norm <= ${uRes})::int                                   AS res_dentro
    FROM public.v_unificado_norm
    ${where}
  `)) as SlaTotales[];
  return filas[0] ?? { pr_con_dato: 0, pr_dentro: 0, res_con_dato: 0, res_dentro: 0 };
}

interface FilaGrupo {
  etiqueta: string;
  total: number;
  pr_con_dato: number;
  pr_dentro: number;
  res_con_dato: number;
  res_dentro: number;
}

/** SLA agrupado por una columna (grupo de canal, asesor o país). */
async function slaPorGrupo(where: Prisma.Sql, etiqueta: Prisma.Sql): Promise<SlaFila[]> {
  const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
  const uRes = umbral(SLA_MINUTOS.resolucion);
  const filas = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      ${etiqueta}                                                                                   AS etiqueta,
      COUNT(*)::int                                                                                 AS total,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int                           AS pr_con_dato,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                        AND primera_respuesta_min_norm <= ${uPr})::int                              AS pr_dentro,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int                                  AS res_con_dato,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL
                        AND resolucion_min_norm <= ${uRes})::int                                    AS res_dentro
    FROM public.v_unificado_norm
    ${where}
    GROUP BY ${etiqueta}
    ORDER BY total DESC
  `)) as FilaGrupo[];

  const pct = (dentro: number, con: number) =>
    con > 0 ? Math.round((dentro / con) * 1000) / 10 : null;

  return filas.map((f) => ({
    etiqueta: f.etiqueta ?? "Sin dato",
    total: f.total,
    cumplePrimeraPct: pct(f.pr_dentro, f.pr_con_dato),
    cumpleResolucionPct: pct(f.res_dentro, f.res_con_dato),
    dentroPrimera: f.pr_dentro,
    conDatoPrimera: f.pr_con_dato,
  }));
}

interface FilaAsesor {
  asesor: string;
  total: number;
  prom_primera: number | null;
  prom_resolucion: number | null;
  pr_con_dato: number;
  pr_dentro: number;
  res_con_dato: number;
  res_dentro: number;
}

/**
 * Ranking de asesores con puntaje de performance.
 * Trae conteo, tiempos promedio y cumplimiento SLA por asesor; luego
 * normaliza cada métrica contra el resto del equipo y arma un score 0-100.
 *
 * Fórmula vigente (no se modifica):
 *   score = 100 * (0.40 * cumplimiento_1ra + 0.30 * velocidad + 0.30 * volumen)
 * - cumplimiento_1ra = pr_dentro / pr_con_dato
 * - velocidad = (maxT - promPrimera) / (maxT - minT)
 * - volumen = total / maxTotal
 * - mínimo 5 atenciones finalizadas para entrar al podio.
 */
async function rankingAsesores(where: Prisma.Sql): Promise<RankingAsesor[]> {
  const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
  const uRes = umbral(SLA_MINUTOS.resolucion);
  const raw = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      COALESCE(${N_ASESOR}, 'Sin asesor')                                  AS asesor,
      COUNT(*)::int                                                        AS total,
      ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8           AS prom_primera,
      ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8                  AS prom_resolucion,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int  AS pr_con_dato,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                        AND primera_respuesta_min_norm <= ${uPr})::int     AS pr_dentro,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int         AS res_con_dato,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL
                        AND resolucion_min_norm <= ${uRes})::int           AS res_dentro
    FROM public.v_unificado_norm
    ${where}
    GROUP BY ${N_ASESOR}
  `)) as FilaAsesor[];

  // Consolidar nombres donde uno contiene a otro (ej: "Andres" dentro de "Andres Espinoza")
  const consumido = new Set<number>();
  const filas: FilaAsesor[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (consumido.has(i)) continue;
    let total = raw[i].total;
    let promPri = raw[i].prom_primera;
    let promRes = raw[i].prom_resolucion;
    let prCon = raw[i].pr_con_dato;
    let prDentro = raw[i].pr_dentro;
    let resCon = raw[i].res_con_dato;
    let resDentro = raw[i].res_dentro;
    consumido.add(i);
    for (let j = 0; j < raw.length; j++) {
      if (i === j || consumido.has(j)) continue;
      if (raw[i].asesor.includes(raw[j].asesor)) {
        total += raw[j].total;
        const p = raw[j].prom_primera;
        if (p !== null) {
          promPri = promPri !== null ? (promPri + p) / 2 : p;
        }
        const r = raw[j].prom_resolucion;
        if (r !== null) {
          promRes = promRes !== null ? (promRes + r) / 2 : r;
        }
        prCon += raw[j].pr_con_dato;
        prDentro += raw[j].pr_dentro;
        resCon += raw[j].res_con_dato;
        resDentro += raw[j].res_dentro;
        consumido.add(j);
      }
    }
    filas.push({
      asesor: raw[i].asesor,
      total,
      prom_primera: promPri,
      prom_resolucion: promRes,
      pr_con_dato: prCon,
      pr_dentro: prDentro,
      res_con_dato: resCon,
      res_dentro: resDentro,
    });
  }

  // Solo asesores con un mínimo de casos (evita podios por casualidad).
  const elegibles = filas.filter((f) => f.total >= MIN_CASOS_PODIO && f.asesor !== "Sin asesor");
  if (elegibles.length === 0) return [];

  const pct = (dentro: number, con: number) =>
    con > 0 ? Math.round((dentro / con) * 1000) / 10 : null;

  const maxTotal = Math.max(...elegibles.map((f) => f.total));
  // Para velocidad usamos 1ª respuesta; menor tiempo = mejor.
  const tiempos = elegibles.map((f) => f.prom_primera).filter((x): x is number => x !== null);
  const minT = tiempos.length ? Math.min(...tiempos) : 0;
  const maxT = tiempos.length ? Math.max(...tiempos) : 0;

  const ranking = elegibles.map((f) => {
    const cumpleSlaPct = pct(f.pr_dentro, f.pr_con_dato);
    const cumpleResolucionPct = pct(f.res_dentro, f.res_con_dato);
    const volNorm = maxTotal > 0 ? f.total / maxTotal : 0;
    let velNorm = 0;
    if (f.prom_primera !== null && maxT > minT) {
      velNorm = (maxT - f.prom_primera) / (maxT - minT); // 1 = el más rápido
    } else if (f.prom_primera !== null) {
      velNorm = 1; // todos iguales o uno solo
    }
    const slaNorm = (cumpleSlaPct ?? 0) / 100;
    const score =
      Math.round(
        (PESOS_PODIO.sla * slaNorm + PESOS_PODIO.velocidad * velNorm + PESOS_PODIO.volumen * volNorm) *
          1000,
      ) / 10; // 0-100 con 1 decimal
    return {
      asesor: f.asesor,
      total: f.total,
      promPrimera: f.prom_primera,
      promResolucion: f.prom_resolucion,
      cumpleSlaPct,
      cumpleResolucionPct,
      score,
    };
  });

  ranking.sort((a, b) => b.score - a.score);
  return ranking.slice(0, 3); // oro, plata, bronce
}

/** Promedios de 1ª respuesta y resolución, separados por subcanal operativo. */
async function tiemposPorCanal(where: Prisma.Sql): Promise<TiempoCanal[]> {
  return (await prisma.$queryRaw(Prisma.sql`
    SELECT
      COALESCE(subcanal, 'Sin canal')                                AS etiqueta,
      COUNT(*)::int                                                  AS total,
      ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8      AS "promPrimera",
      ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8             AS "promResolucion"
    FROM public.v_unificado_norm
    ${where}
    GROUP BY subcanal
    ORDER BY total DESC
  `)) as TiempoCanal[];
}

/** Expresión de creación real para Operación. */
const CREACION_OP = Prisma.sql`CASE
  WHEN v.tickets_created_at IS NOT NULL
    THEN (v.tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (v.fecha::date + v.hora::time)
END`;

const ATENCION_KEY_OP = Prisma.sql`CASE
  WHEN UPPER(BTRIM(v.subcanal)) = 'ZENDESK'
    THEN 'ZENDESK:' || v.ticket_id::text
  ELSE 'WA:' || v.ticket_id::text
END`;

const SUB_ORDER_OP = ["WHATMETA", "WHATICKET", "ZENDESK"] as const;
const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/**
 * Deduplicación condicional:
 * - Sin filtro de canal: deduplica los tickets que aparecen en WHATMETA/WHATICKET.
 * - Un solo canal: conserva sus filas reales para no ocultar demanda al filtrar.
 * - Varios canales que incluyen ambos WhatsApp: deduplica esos duplicados.
 */
function dedupeOperacion(filters: DashboardFilters): boolean {
  const sel = (filters.subcanal ?? []).map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (!sel.length) return true;
  return sel.includes("WHATMETA") && sel.includes("WHATICKET");
}

function whereOperacion(filters: DashboardFilters): Prisma.Sql {
  return construirWhere(filters, {
    endExclusive: true,
    fechaExpr: Prisma.sql`creacion`,
  });
}

/** Prefijo SQL con normalización, filtros y selección deduplicada cuando aplica. */
function baseOperacion(where: Prisma.Sql, dedupe: boolean): Prisma.Sql {
  const seleccion = dedupe
    ? Prisma.sql`SELECT DISTINCT ON (atencion_key) * FROM filtrado ORDER BY atencion_key, creacion ASC, subcanal`
    : Prisma.sql`SELECT * FROM filtrado`;
  return Prisma.sql`
    WITH normalizado AS (
      SELECT v.*,
             ${CREACION_OP} AS creacion,
             ${ATENCION_KEY_OP} AS atencion_key
      FROM public.v_unificado_norm v
    ),
    filtrado AS (
      SELECT * FROM normalizado ${where}
    ),
    seleccion AS (
      ${seleccion}
    )
  `;
}

function parseFechaOp(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Días calendario inclusivos del rango; si no hay rango, usa las fechas con datos. */
function diasCalendarioOp(
  inicio: string | null,
  fin: string | null,
  fechas: string[],
): number {
  if (inicio && fin) {
    return Math.floor((parseFechaOp(fin) - parseFechaOp(inicio)) / 86400000) + 1;
  }
  const unicas = [...new Set(fechas)].sort();
  if (!unicas.length) return 0;
  return Math.floor((parseFechaOp(unicas[unicas.length - 1]) - parseFechaOp(unicas[0])) / 86400000) + 1;
}

interface DailyRow {
  fecha: string;
  total: number;
}
interface DailyChannelRow extends DailyRow {
  subcanal: string;
}
type GranularidadEvo = "diaria" | "semanal" | "mensual" | "trimestral";

function buildPeriodosOp(
  totales: DailyRow[],
  canales: DailyChannelRow[],
  inicio: string | null,
  fin: string | null,
  granularidad: GranularidadEvo,
): OperacionPeriodo[] {
  const fechas = totales.map((r) => r.fecha);
  const desde = inicio ?? (fechas.length ? [...fechas].sort()[0] : null);
  const hasta = fin ?? (fechas.length ? [...fechas].sort()[fechas.length - 1] : null);
  if (!desde || !hasta) return [];

  const totalMap = new Map<string, number>();
  for (const r of totales) {
    const k = inicioPeriodo(r.fecha, granularidad);
    totalMap.set(k, (totalMap.get(k) ?? 0) + r.total);
  }
  const canalMap = new Map<string, number>();
  for (const r of canales) {
    const k = `${inicioPeriodo(r.fecha, granularidad)}|${r.subcanal}`;
    canalMap.set(k, (canalMap.get(k) ?? 0) + r.total);
  }

  return generarPeriodosOp(desde, hasta, granularidad).map((bucket) => ({
    periodo: etiquetaPeriodoOp(bucket, granularidad),
    total: totalMap.get(bucket) ?? 0,
    porSubcanal: SUB_ORDER_OP.map((subcanal) => ({
      subcanal,
      total: canalMap.get(`${bucket}|${subcanal}`) ?? 0,
    })),
  }));
}



/** Consolida nombres de asesores: si un nombre simple está contenido
 *  dentro de uno compuesto, suma sus totals al compuesto.
 *  Ej: "Juan" (10) + "Juan Pérez" (5) → "Juan Pérez" (15) */
function consolidarNombres(items: Desglose[]): Desglose[] {
  const entradas = items.map((i) => ({ ...i, consumido: false }));
  for (let i = 0; i < entradas.length; i++) {
    if (entradas[i].consumido) continue;
    for (let j = 0; j < entradas.length; j++) {
      if (i === j || entradas[j].consumido) continue;
      const mayor = entradas[i].etiqueta.length >= entradas[j].etiqueta.length ? i : j;
      const menor = mayor === i ? j : i;
      if (entradas[mayor].etiqueta.includes(entradas[menor].etiqueta)) {
        entradas[mayor].total += entradas[menor].total;
        entradas[menor].consumido = true;
      }
    }
  }
  return entradas
    .filter((e) => !e.consumido)
    .sort((a, b) => b.total - a.total);
}

/** Agrega una condición AND a un WHERE existente (maneja Prisma.empty). */
function whereConCanal(where: Prisma.Sql, condicion: Prisma.Sql): Prisma.Sql {
  return where === Prisma.empty
    ? Prisma.sql`WHERE ${condicion}`
    : Prisma.sql`${where} AND ${condicion}`;
}

/* ════════════════════════════════════════════════════════════════
 *  REPORTE CLIENTES — universo, identificación y agregaciones
 * ════════════════════════════════════════════════════════════════ */

/** Fecha real de creación: Zendesk UTC → America/Lima; WhatsApp local. */
const CREACION_CLIENTE = Prisma.sql`CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END`;

/** WHERE del reporte Clientes: filtros globales + atenciones finalizadas. */
function whereClientes(filters: DashboardFilters): Prisma.Sql {
  return whereConCanal(
    construirWhere(filters, { fechaExpr: CREACION_CLIENTE, endExclusive: true }),
    FINALIZADAS,
  );
}

interface ClienteBaseRow {
  clave: string;
  total: number;
  con_dato: number;
  cumple: number;
  tiempo: number | null;
  ultima: string | null;
  wpp: boolean;
  correo: boolean;
  por_correo: boolean;
  numeros_no_ident: number;
  dominios_invalidos: number;
  prev_total: number;
  max_rec: number;
  subcategoria_recurrente: string | null;
}

/**
 * Agregación por cliente con:
 * - métricas del periodo actual,
 * - total del periodo anterior,
 * - subcategoría con mayor reincidencia.
 * Es la misma base para resumen, ranking, seguimiento y lista del explorador.
 */
function clientesContexto(whereActual: Prisma.Sql, wherePrev: Prisma.Sql | null): Prisma.Sql {
  const uRes = umbral(SLA_MINUTOS.resolucion);
  const prevCte = wherePrev
    ? Prisma.sql`SELECT clave, COUNT(*)::int AS total
        FROM (
          SELECT ${CLIENTE_KEY} AS clave
          FROM public.v_unificado_norm
          ${wherePrev}
        ) p
        GROUP BY clave`
    : Prisma.sql`SELECT NULL::text AS clave, 0::int AS total WHERE false`;

  return Prisma.sql`
    WITH src AS (
      SELECT
        ${CLIENTE_KEY} AS clave,
        ${DOMINIO_NORMALIZADO} AS dom,
        canal,
        resolucion_min_norm,
        numero,
        ${IDENTIFICADO_POR_CORREO} AS por_correo,
        ${CREACION_CLIENTE} AS creacion,
        ${SCAT_LABEL} AS subcategoria
      FROM public.v_unificado_norm
      ${whereActual}
    ),
    base AS (
      SELECT
        clave,
        COUNT(*)::int AS total,
        COUNT(resolucion_min_norm)::int AS con_dato,
        COUNT(*) FILTER (
          WHERE resolucion_min_norm IS NOT NULL
            AND resolucion_min_norm <= ${uRes}
        )::int AS cumple,
        ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempo,
        TO_CHAR(MAX(creacion), 'YYYY-MM-DD') AS ultima,
        BOOL_OR(canal ILIKE '%what%') AS wpp,
        BOOL_OR(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%') AS correo,
        BOOL_OR(por_correo) AS por_correo,
        COUNT(DISTINCT CASE
          WHEN clave = ${SIN_IDENTIFICAR_KEY}
          THEN NULLIF(TRIM(numero), '')
        END)::int AS numeros_no_ident,
        COUNT(DISTINCT CASE
          WHEN clave = ${SIN_IDENTIFICAR_KEY} AND dom <> '—'
          THEN dom
        END)::int AS dominios_invalidos
      FROM src
      GROUP BY clave
    ),
    prev AS (${prevCte}),
    rec AS (
      SELECT clave, subcategoria, n
      FROM (
        SELECT clave, subcategoria, COUNT(*)::int AS n,
               ROW_NUMBER() OVER (
                 PARTITION BY clave
                 ORDER BY COUNT(*) DESC, subcategoria
               ) AS rn
        FROM src
        WHERE clave <> ${SIN_IDENTIFICAR_KEY}
        GROUP BY clave, subcategoria
      ) x
      WHERE rn = 1
    )
    SELECT b.*,
           COALESCE(p.total, 0)::int AS prev_total,
           COALESCE(r.n, 0)::int AS max_rec,
           r.subcategoria AS subcategoria_recurrente
    FROM base b
    LEFT JOIN prev p ON p.clave = b.clave
    LEFT JOIN rec r ON r.clave = b.clave
  `;
}

function mapClienteResumen(
  r: ClienteBaseRow,
  totalIdentificadas: number,
  esNoIdentificado = false,
): ClienteResumen {
  const noCumple = Math.max(0, r.con_dato - r.cumple);
  const pctIncumple =
    r.con_dato > 0 ? Math.round((noCumple / r.con_dato) * 1000) / 10 : null;
  return {
    cliente: esNoIdentificado ? SIN_IDENTIFICAR_LABEL : r.clave,
    clave: r.clave,
    total: r.total,
    pct:
      !esNoIdentificado && totalIdentificadas > 0
        ? Math.round((r.total / totalIdentificadas) * 1000) / 10
        : 0,
    variacionPct:
      r.prev_total > 0
        ? Math.round(((r.total - r.prev_total) / r.prev_total) * 1000) / 10
        : null,
    tiempoPromedio: r.tiempo,
    conDato: r.con_dato,
    noCumple,
    pctIncumple,
    reincidenciaMax: r.max_rec,
    canales: [
      r.wpp ? "whatsapp" : null,
      r.correo ? "correo" : null,
    ].filter(Boolean) as string[],
    esNoIdentificado,
    ultimaAtencion: r.ultima,
  };
}

function peakPorHora(rows: { hora: number; total: number }[]): { hora: number; total: number } | null {
  const map = new Map<number, number>();
  for (const r of rows) map.set(r.hora, (map.get(r.hora) ?? 0) + r.total);
  let best: { hora: number; total: number } | null = null;
  for (const [hora, total] of map) {
    if (!best || total > best.total) best = { hora, total };
  }
  return best;
}

function peakPorDia(rows: { dia: number; total: number }[]): { dia: number; total: number } | null {
  const map = new Map<number, number>();
  for (const r of rows) map.set(r.dia, (map.get(r.dia) ?? 0) + r.total);
  let best: { dia: number; total: number } | null = null;
  for (const [dia, total] of map) {
    if (!best || total > best.total) best = { dia, total };
  }
  return best;
}

const arr = (x: unknown): string[] => (Array.isArray(x) ? (x as string[]) : []);

export const unificadoRepository = {
  async ping(): Promise<boolean> {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  },

  async total(): Promise<number> {
    const rows = (await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm
    `) as { total: number }[];
    return Number(rows[0]?.total ?? 0);
  },

  async resumen(filters: DashboardFilters): Promise<ResumenResponse> {
    // Universo único del reporte: atenciones finalizadas (cerradas + resueltas).
    const whereResumen = whereConCanal(construirWhere(filters), FINALIZADAS);
    const actual = await totales(whereResumen);
    const slaActual = await slaTotales(whereResumen);

    const pct = (dentro: number, con: number) =>
      con > 0 ? Math.round((dentro / con) * 1000) / 10 : null;

    const pctPrimeraActual = pct(slaActual.pr_dentro, slaActual.pr_con_dato);
    const pctResolucionActual = pct(slaActual.res_dentro, slaActual.res_con_dato);

    let anterior: FilaTotales | null = null;
    let slaAnterior: SlaTotales | null = null;
    let rango: ResumenResponse["rango"] = null;
    if (filters.fechaHoraInicio && filters.fechaHoraFin) {
      const prev = rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin);
      const wherePrevResumen = whereConCanal(
        construirWhere(
          {
            ...filters,
            fechaHoraInicio: `${prev.inicio} 00:00`,
            fechaHoraFin: `${prev.fin} 23:59`,
          },
          { endExclusive: true },
        ),
        FINALIZADAS,
      );
      anterior = await totales(wherePrevResumen);
      slaAnterior = await slaTotales(wherePrevResumen);
      rango = { inicio: filters.fechaHoraInicio, fin: filters.fechaHoraFin, comparadoCon: prev };
    }

    const pctPrimeraAnterior = slaAnterior
      ? pct(slaAnterior.pr_dentro, slaAnterior.pr_con_dato)
      : null;
    const pctResolucionAnterior = slaAnterior
      ? pct(slaAnterior.res_dentro, slaAnterior.res_con_dato)
      : null;

    const porCanal = await desglose(whereResumen, Prisma.sql`canal`);
    const porSubcanal = await desglose(whereResumen, Prisma.sql`subcanal`);
    const porEstado = await desglose(whereResumen, Prisma.sql`estado_homologado`);
    const porPais = await desglose(whereResumen, N_PAIS);
    const porAsesor = await desglose(whereResumen, N_ASESOR);
    const topAsesores = await rankingAsesores(whereResumen);
    const topCategorias = await desgloseTop(whereResumen, Prisma.sql`categoria`, 10);
    const topSubcategorias = await desgloseTop(whereResumen, SCAT_LABEL);
    const tiempos = await tiemposPorCanal(whereResumen);

    return {
      rango,
      kpis: {
        total: comparar(actual.total, anterior?.total ?? null),
        cerrados: comparar(actual.cerrados, anterior?.cerrados ?? null),
        resueltos: comparar(actual.resueltos, anterior?.resueltos ?? null),
        cumplimientos: comparar(slaActual.pr_dentro, slaAnterior?.pr_dentro ?? null),
        // Se conserva por compatibilidad; es el mismo valor que primera respuesta.
        cumplimientoSlaPct: comparar(pctPrimeraActual, pctPrimeraAnterior),
        cumplimientoPrimeraPct: comparar(pctPrimeraActual, pctPrimeraAnterior),
        primeraDentro: comparar(slaActual.pr_dentro, slaAnterior?.pr_dentro ?? null),
        primeraFuera: comparar(
          slaActual.pr_con_dato - slaActual.pr_dentro,
          slaAnterior ? slaAnterior.pr_con_dato - slaAnterior.pr_dentro : null,
        ),
        primeraConDato: comparar(slaActual.pr_con_dato, slaAnterior?.pr_con_dato ?? null),
        cumplimientoResolucionPct: comparar(pctResolucionActual, pctResolucionAnterior),
        resolucionDentro: comparar(slaActual.res_dentro, slaAnterior?.res_dentro ?? null),
        resolucionFuera: comparar(
          slaActual.res_con_dato - slaActual.res_dentro,
          slaAnterior ? slaAnterior.res_con_dato - slaAnterior.res_dentro : null,
        ),
        resolucionConDato: comparar(slaActual.res_con_dato, slaAnterior?.res_con_dato ?? null),
        promPrimeraRespMin: comparar(actual.prom_primera, anterior?.prom_primera ?? null),
        promResolucionMin: comparar(actual.prom_resolucion, anterior?.prom_resolucion ?? null),
      },
      porCanal,
      porSubcanal,
      porEstado,
      porPais,
      porAsesor,
      topAsesores,
      topCategorias,
      topSubcategorias,
      tiemposPorCanal: tiempos,
    };
  },

  async sla(filters: DashboardFilters): Promise<SlaResponse> {
    const whereActual = construirWhere(filters);
    const actual = await slaTotales(whereActual);

    const pct = (dentro: number, con: number) =>
      con > 0 ? Math.round((dentro / con) * 1000) / 10 : null;

    let anterior: SlaTotales | null = null;
    let rango: SlaResponse["rango"] = null;
    if (filters.fechaHoraInicio && filters.fechaHoraFin) {
      const prev = rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin);
      anterior = await slaTotales(
        construirWhere({ ...filters, fechaHoraInicio: prev.inicio, fechaHoraFin: prev.fin }),
      );
      rango = { inicio: filters.fechaHoraInicio, fin: filters.fechaHoraFin, comparadoCon: prev };
    }

    const porCanal = await slaPorGrupo(whereActual, GRUPO_CANAL);
    const porAsesor = await slaPorGrupo(whereActual, N_ASESOR_COALESCE);
    const PAIS_ETIQ = Prisma.sql`COALESCE(${N_PAIS}, 'Sin país')`;
    const whereWhatsapp = whereConCanal(whereActual, Prisma.sql`canal ILIKE '%what%'`);
    const whereZendesk = whereConCanal(whereActual, Prisma.sql`(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`);
    const porPaisWhatsapp = await slaPorGrupo(whereWhatsapp, PAIS_ETIQ);
    const porPaisCorreo = await slaPorGrupo(whereZendesk, PAIS_ETIQ);
    const porAsesorWhatsapp = await slaPorGrupo(whereWhatsapp, N_ASESOR_COALESCE);
    const porAsesorCorreo = await slaPorGrupo(whereZendesk, N_ASESOR_COALESCE);
    const porCategoriaWhatsapp = await slaPorGrupo(whereWhatsapp, N_CATEGORIA);
    const porCategoriaCorreo = await slaPorGrupo(whereZendesk, N_CATEGORIA);

    return {
      rango,
      metas: SLA_MINUTOS,
      kpis: {
        cumplimientoPrimera: comparar(
          pct(actual.pr_dentro, actual.pr_con_dato),
          anterior ? pct(anterior.pr_dentro, anterior.pr_con_dato) : null,
        ),
        cumplimientoResolucion: comparar(
          pct(actual.res_dentro, actual.res_con_dato),
          anterior ? pct(anterior.res_dentro, anterior.res_con_dato) : null,
        ),
        dentroPrimera: comparar(actual.pr_dentro, anterior?.pr_dentro ?? null),
        fueraPrimera: comparar(
          actual.pr_con_dato - actual.pr_dentro,
          anterior ? anterior.pr_con_dato - anterior.pr_dentro : null,
        ),
      },
      porCanal,
      porAsesor,
      porPaisWhatsapp,
      porPaisCorreo,
      porAsesorWhatsapp,
      porAsesorCorreo,
      porCategoriaWhatsapp,
      porCategoriaCorreo,
    };
  },

  async operacion(filters: DashboardFilters): Promise<OperacionResponse> {
    const inicio = filters.fechaHoraInicio?.slice(0, 10) ?? null;
    const fin = filters.fechaHoraFin?.slice(0, 10) ?? null;
    const prev = inicio && fin ? rangoAnterior(inicio, fin) : null;
    const dedupe = dedupeOperacion(filters);

    const whereActual = whereOperacion(filters);
    const baseActual = baseOperacion(whereActual, dedupe);

    const wherePrev = prev
      ? whereOperacion({
          ...filters,
          fechaHoraInicio: `${prev.inicio} 00:00`,
          fechaHoraFin: `${prev.fin} 23:59`,
        })
      : null;
    const basePrev = wherePrev ? baseOperacion(wherePrev, dedupe) : null;

    type Heat = { dia: number; hora: number; total: number };
    type Daily = { fecha: string; total: number };
    type DailyCanal = { fecha: string; subcanal: string; total: number };
    type Top = { etiqueta: string; total: number };

    const [
      heatmapActual,
      dailyTotalActual,
      dailyChannelActual,
      topAsesoresRaw,
      topCategorias,
      heatmapPrev,
      dailyTotalPrev,
      dailyChannelPrev,
    ] = await Promise.all([
      prisma.$queryRaw(Prisma.sql`
        ${baseActual}
        SELECT EXTRACT(DOW FROM creacion)::int AS dia,
               EXTRACT(HOUR FROM creacion)::int AS hora,
               COUNT(*)::int AS total
        FROM seleccion
        GROUP BY 1, 2
        ORDER BY 1, 2
      `) as Promise<Heat[]>,

      prisma.$queryRaw(Prisma.sql`
        ${baseActual}
        SELECT TO_CHAR(creacion::date, 'YYYY-MM-DD') AS fecha,
               COUNT(*)::int AS total
        FROM seleccion
        GROUP BY 1
        ORDER BY 1
      `) as Promise<Daily[]>,

      prisma.$queryRaw(Prisma.sql`
        ${baseActual}
        SELECT TO_CHAR(creacion::date, 'YYYY-MM-DD') AS fecha,
               subcanal,
               COUNT(*)::int AS total
        FROM filtrado
        GROUP BY 1, 2
        ORDER BY 1, 2
      `) as Promise<DailyCanal[]>,

      prisma.$queryRaw(Prisma.sql`
        ${baseActual}
        SELECT ${N_ASESOR} AS etiqueta, COUNT(*)::int AS total
        FROM seleccion
        GROUP BY ${N_ASESOR}
        ORDER BY total DESC
        LIMIT 20
      `) as Promise<Top[]>,

      prisma.$queryRaw(Prisma.sql`
        ${baseActual}
        SELECT COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría') AS etiqueta,
               COUNT(*)::int AS total
        FROM seleccion
        GROUP BY 1
        ORDER BY total DESC
        LIMIT 10
      `) as Promise<Top[]>,

      basePrev
        ? (prisma.$queryRaw(Prisma.sql`
            ${basePrev}
            SELECT EXTRACT(DOW FROM creacion)::int AS dia,
                   EXTRACT(HOUR FROM creacion)::int AS hora,
                   COUNT(*)::int AS total
            FROM seleccion
            GROUP BY 1, 2
            ORDER BY 1, 2
          `) as Promise<Heat[]>)
        : Promise.resolve([] as Heat[]),

      basePrev
        ? (prisma.$queryRaw(Prisma.sql`
            ${basePrev}
            SELECT TO_CHAR(creacion::date, 'YYYY-MM-DD') AS fecha,
                   COUNT(*)::int AS total
            FROM seleccion
            GROUP BY 1
            ORDER BY 1
          `) as Promise<Daily[]>)
        : Promise.resolve([] as Daily[]),

      basePrev
        ? (prisma.$queryRaw(Prisma.sql`
            ${basePrev}
            SELECT TO_CHAR(creacion::date, 'YYYY-MM-DD') AS fecha,
                   subcanal,
                   COUNT(*)::int AS total
            FROM filtrado
            GROUP BY 1, 2
            ORDER BY 1, 2
          `) as Promise<DailyCanal[]>)
        : Promise.resolve([] as DailyCanal[]),
    ]);

    const sum = (rows: { total: number }[]) => rows.reduce((s, r) => s + r.total, 0);
    const totalActual = sum(dailyTotalActual);
    const totalPrevio = prev ? sum(dailyTotalPrev) : null;
    const diasActual = diasCalendarioOp(
      inicio,
      fin,
      dailyTotalActual.map((r) => r.fecha),
    );
    const diasPrevio = prev
      ? diasCalendarioOp(
          prev.inicio,
          prev.fin,
          dailyTotalPrev.map((r) => r.fecha),
        )
      : null;
    const promActual = diasActual > 0 ? Math.round((totalActual / diasActual) * 10) / 10 : null;
    const promPrevio =
      diasPrevio && diasPrevio > 0 && totalPrevio !== null
        ? Math.round((totalPrevio / diasPrevio) * 10) / 10
        : null;

    const heatmap = heatmapActual.map((h) => ({ hora: h.hora, dia: h.dia, total: h.total }));

    const diasMap = new Map<number, number>();
    for (const r of dailyTotalActual) {
      const dia = new Date(`${r.fecha}T00:00:00Z`).getUTCDay();
      diasMap.set(dia, (diasMap.get(dia) ?? 0) + 1);
    }
    const diasPorDia = [...diasMap.entries()]
      .map(([dia, dias]) => ({ dia, dias }))
      .sort((a, b) => a.dia - b.dia);

    const canalTotals = new Map<string, number>();
    for (const r of dailyChannelActual) {
      canalTotals.set(r.subcanal, (canalTotals.get(r.subcanal) ?? 0) + r.total);
    }
    const porSubcanal: Desglose[] = SUB_ORDER_OP.map((subcanal) => ({
      etiqueta: subcanal,
      total: canalTotals.get(subcanal) ?? 0,
    }));
    const rawTotal = porSubcanal.reduce((s, r) => s + r.total, 0);
    const duplicadosEntreCanales = Math.max(0, rawTotal - totalActual);

    const peakH = peakPorHora(heatmapActual);
    const peakD = peakPorDia(heatmapActual);
    const peakHPrev = peakPorHora(heatmapPrev);
    const peakDPrev = peakPorDia(heatmapPrev);

    const topAsesores = consolidarNombres(topAsesoresRaw).slice(0, 10);

    const evo = {
      diaria: {
        actual: buildPeriodosOp(dailyTotalActual, dailyChannelActual, inicio, fin, "diaria"),
        anterior: prev
          ? buildPeriodosOp(dailyTotalPrev, dailyChannelPrev, prev.inicio, prev.fin, "diaria")
          : [],
      },
      semanal: {
        actual: buildPeriodosOp(dailyTotalActual, dailyChannelActual, inicio, fin, "semanal"),
        anterior: prev
          ? buildPeriodosOp(dailyTotalPrev, dailyChannelPrev, prev.inicio, prev.fin, "semanal")
          : [],
      },
      mensual: {
        actual: buildPeriodosOp(dailyTotalActual, dailyChannelActual, inicio, fin, "mensual"),
        anterior: prev
          ? buildPeriodosOp(dailyTotalPrev, dailyChannelPrev, prev.inicio, prev.fin, "mensual")
          : [],
      },
      trimestral: {
        actual: buildPeriodosOp(dailyTotalActual, dailyChannelActual, inicio, fin, "trimestral"),
        anterior: prev
          ? buildPeriodosOp(dailyTotalPrev, dailyChannelPrev, prev.inicio, prev.fin, "trimestral")
          : [],
      },
    };

    const rango: OperacionResponse["rango"] =
      filters.fechaHoraInicio && filters.fechaHoraFin
        ? {
            inicio: filters.fechaHoraInicio,
            fin: filters.fechaHoraFin,
            comparadoCon: prev ?? { inicio: "", fin: "" },
          }
        : null;

    return {
      rango: prev ? rango : null,
      kpis: {
        total: comparar(totalActual, totalPrevio),
        promedioPorDia: comparar(promActual, promPrevio),
        diasConDatos: dailyTotalActual.length,
        diasConDatosAnterior: prev ? dailyTotalPrev.length : null,
        horaPico: peakH ? `${String(peakH.hora).padStart(2, "0")}:00` : null,
        horaPicoValor: peakH?.total ?? null,
        horaPicoAnterior: peakHPrev ? `${String(peakHPrev.hora).padStart(2, "0")}:00` : null,
        horaPicoAnteriorValor: peakHPrev?.total ?? null,
        diaCargado: peakD ? DIAS_LARGOS[peakD.dia] : null,
        diaCargadoValor: peakD?.total ?? null,
        diaCargadoAnterior: peakDPrev ? DIAS_LARGOS[peakDPrev.dia] : null,
        diaCargadoAnteriorValor: peakDPrev?.total ?? null,
      },
      heatmap,
      diasPorDia,
      porSubcanal,
      duplicadosEntreCanales,
      topAsesores,
      topCategorias,
      evolucion: evo,
    };
  },

  async asesores(filters: DashboardFilters): Promise<AsesoresResponse> {
    const whereActual = whereConCanal(construirWhere(filters), OFFICIAL_FILTER);

    const A_N = Prisma.sql`INITCAP(TRANSLATE(SPLIT_PART(REPLACE(asesor, '_', ' '), ' ', 1), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun'))`;
    const A_COL = Prisma.sql`COALESCE(${A_N}, 'Sin asesor')`;
    const P_COL = Prisma.sql`COALESCE(INITCAP(TRANSLATE(REPLACE(TRIM(pais), '_', ' '), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun')), 'Sin país')`;
    const C_COL = Prisma.sql`COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría')`;
    const SC_COL = SCAT_LABEL;

    const [
      totalActual,
      rankingRaw,
      evolucionDias,
      evolucionHoras,
      evolucionSemanas,
      evolucionMeses,
      tiemposRaw,
      /* 7 */ matrizCat,
      /* 8 */ matrizSub,
      /* 9 */ quintilRaw,
      /* 10 */ perfPais,
      /* 11 */ perfCanal,
      /* 12 */ asesorCanalRaw,
      /* 13 */ asesorCanalSubRaw,
    ] = await Promise.all([
      /* 0 - totals */
      totales(whereActual),

      /* 1 - ranking (raw counts, score se calcula en TypeScript) */
      prisma.$queryRaw`
        SELECT ${A_COL} AS asesor,
               COUNT(*)::int AS total,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS prom_primera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS prom_resolucion,
               COUNT(*) FILTER (WHERE canal ILIKE '%what%')::int AS vol_wpp,
               COUNT(*) FILTER (WHERE (canal ILIKE '%zendesk%' OR canal ILIKE '%correo%'))::int AS vol_corr,
               COUNT(*) FILTER (WHERE canal ILIKE '%what%'
                 AND primera_respuesta_min_norm IS NOT NULL
                 AND primera_respuesta_min_norm <= ${SLA_MINUTOS.primeraRespuesta.whatsapp})::int AS wpp_cumple_pr,
               COUNT(*) FILTER (WHERE canal ILIKE '%what%'
                 AND primera_respuesta_min_norm IS NOT NULL)::int AS wpp_con_dato_pr,
               COUNT(*) FILTER (WHERE canal ILIKE '%what%'
                 AND resolucion_min_norm IS NOT NULL
                 AND resolucion_min_norm <= ${SLA_MINUTOS.resolucion.whatsapp})::int AS wpp_cumple_res,
               COUNT(*) FILTER (WHERE canal ILIKE '%what%'
                 AND resolucion_min_norm IS NOT NULL)::int AS wpp_con_dato_res,
               COUNT(*) FILTER (WHERE (canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')
                 AND primera_respuesta_min_norm IS NOT NULL
                 AND primera_respuesta_min_norm <= ${SLA_MINUTOS.primeraRespuesta.correo})::int AS corr_cumple_pr,
               COUNT(*) FILTER (WHERE (canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')
                 AND primera_respuesta_min_norm IS NOT NULL)::int AS corr_con_dato_pr,
               COUNT(*) FILTER (WHERE (canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')
                 AND resolucion_min_norm IS NOT NULL
                 AND resolucion_min_norm <= ${SLA_MINUTOS.resolucion.correo})::int AS corr_cumple_res,
               COUNT(*) FILTER (WHERE (canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')
                 AND resolucion_min_norm IS NOT NULL)::int AS corr_con_dato_res,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado','resuelto'))::int AS resueltos
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY ${A_COL}
        ORDER BY total DESC
      `,

      /* 2 - evolucion diaria */
      prisma.$queryRaw`
        SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS periodo,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY fecha::date, ${A_COL}
        ORDER BY periodo
      `,

      /* 3 - evolucion por hora */
      prisma.$queryRaw`
        SELECT SPLIT_PART(hora::text, ':', 1) AS periodo,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY SPLIT_PART(hora::text, ':', 1), ${A_COL}
        ORDER BY periodo
      `,

      /* 3b - evolucion semanal (ISO week) */
      prisma.$queryRaw`
        SELECT TO_CHAR(fecha, 'IYYY-"W"IW') AS periodo,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY TO_CHAR(fecha, 'IYYY-"W"IW'), ${A_COL}
        ORDER BY periodo
      `,

      /* 3c - evolucion mensual */
      prisma.$queryRaw`
        SELECT TO_CHAR(fecha, 'YYYY-MM') AS periodo,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY TO_CHAR(fecha, 'YYYY-MM'), ${A_COL}
        ORDER BY periodo
      `,

      /* 4 - tiempos por canal (whatsapp / correo) */
      prisma.$queryRaw`
        SELECT ${A_COL} AS asesor,
               CASE WHEN canal ILIKE '%what%' THEN 'whatsapp'
                    WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN 'correo'
                    ELSE 'otro' END AS canal_grupo,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS prom_primera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8        AS prom_resolucion
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY ${A_COL}, canal_grupo
        ORDER BY asesor, canal_grupo
      `,

      /* 5 - matriz categoria */
      prisma.$queryRaw`
        SELECT ${C_COL} AS etiqueta,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY ${C_COL}, ${A_COL}
        ORDER BY total DESC
      `,

      /* 6 - matriz subcategoria */
      prisma.$queryRaw`
        SELECT ${SC_COL} AS etiqueta,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY ${SCAT_KEY}, ${A_COL}
        ORDER BY total DESC
      `,

      /* 7 - quintiles globales de velocidad */
      prisma.$queryRaw`
        SELECT asesor,
               COUNT(*) FILTER (WHERE quintil = 1)::int AS muy_rapido,
               COUNT(*) FILTER (WHERE quintil = 2)::int AS rapido,
               COUNT(*) FILTER (WHERE quintil = 3)::int AS normal,
               COUNT(*) FILTER (WHERE quintil = 4)::int AS lento,
               COUNT(*) FILTER (WHERE quintil = 5)::int AS muy_lento
        FROM (
          SELECT ${A_COL} AS asesor,
                 NTILE(5) OVER (ORDER BY primera_respuesta_min_norm) AS quintil
          FROM public.v_unificado_norm
          ${whereConCanal(whereActual, Prisma.sql`primera_respuesta_min_norm IS NOT NULL`)}
        ) sub
        GROUP BY asesor
        ORDER BY asesor
      `,

      /* 8 - performance pais */
      prisma.$queryRaw`
        SELECT ${P_COL} AS pais,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY ${P_COL}, ${A_COL}
        ORDER BY pais, total DESC
      `,

      /* 9 - performance canal (subcanal) */
      prisma.$queryRaw`
        SELECT COALESCE(NULLIF(TRIM(subcanal), ''), 'Sin subcanal') AS canal,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY subcanal
        ORDER BY total DESC
      `,

      /* 10 - asesorCanal (para navegación jerárquica) */
      prisma.$queryRaw`
        SELECT ${A_COL} AS asesor,
               CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END AS canal,
               ${C_COL} AS categoria,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY ${A_COL}, canal, ${C_COL}
        ORDER BY asesor, canal, total DESC
      `,

      /* 11 - asesorCanalSub (subcategorías) */
      prisma.$queryRaw`
        SELECT ${A_COL} AS asesor,
               CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END AS canal,
               ${C_COL} AS categoria,
               ${SC_COL} AS subcategoria,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereActual}
        GROUP BY ${A_COL}, canal, ${C_COL}, ${SCAT_KEY}
        ORDER BY asesor, canal, categoria, total DESC
      `,
    ]);

    /* ── Top 10 categorías con breakdown por asesor ── */
    const topCat = (await prisma.$queryRaw`
      SELECT ${C_COL} AS cat, COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${whereActual}
      GROUP BY ${C_COL}
      ORDER BY total DESC
      LIMIT 10
    `) as { cat: string; total: number }[];
    const cats = topCat.map((c) => c.cat);
    let perfCat: { etiqueta: string; asesor: string; total: number }[] = [];
    if (cats.length > 0) {
      const catFilter = cats.map((c) => Prisma.sql`${c}` as Prisma.Sql);
      const whereCat = whereConCanal(whereActual, Prisma.sql`${C_COL} = ANY(ARRAY[${Prisma.join(catFilter)}]::text[])`);
      perfCat = (await prisma.$queryRaw`
        SELECT ${C_COL} AS etiqueta,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereCat}
        GROUP BY ${C_COL}, ${A_COL}
        ORDER BY etiqueta, total DESC
      `) as { etiqueta: string; asesor: string; total: number }[];
    }

    /* ── Top 15 subcategorías con breakdown por asesor ── */
    const topSub = (await prisma.$queryRaw`
      SELECT ${SC_COL} AS sub, COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${whereActual}
      GROUP BY ${SCAT_KEY}
      ORDER BY total DESC
      LIMIT 15
    `) as { sub: string; total: number }[];
    const subs = topSub.map((s) => s.sub);
    let perfSub: { etiqueta: string; asesor: string; total: number }[] = [];
    if (subs.length > 0) {
      const subFilter = subs.map((s) => Prisma.sql`${s}` as Prisma.Sql);
      const whereSub = whereConCanal(whereActual, Prisma.sql`${SC_COL} = ANY(ARRAY[${Prisma.join(subFilter)}]::text[])`);
      perfSub = (await prisma.$queryRaw`
        SELECT ${SC_COL} AS etiqueta,
               ${A_COL} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm
        ${whereSub}
        GROUP BY ${SCAT_KEY}, ${A_COL}
        ORDER BY etiqueta, total DESC
      `) as { etiqueta: string; asesor: string; total: number }[];
    }

    /* ── Detalle (últimas 500) ── */
    const detalle = (await prisma.$queryRaw`
      SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha,
             SPLIT_PART(hora::text, ':', 1) || ':' || SPLIT_PART(hora::text, ':', 2) AS hora,
             ${A_COL} AS asesor,
             canal,
             COALESCE(NULLIF(TRIM(subcanal), ''), '—') AS subcanal,
             ${P_COL} AS pais,
             COALESCE(NULLIF(TRIM(dominio), ''), '—') AS dominio,
             ${C_COL} AS categoria,
             ${SC_COL} AS subcategoria,
             primera_respuesta_min_norm AS "tiempoPrimeraRespuesta",
             resolucion_min_norm AS "tiempoResolucion",
             primera_respuesta_min_norm AS "tiempoEspera",
             estado_homologado AS estado,
              COALESCE(NULLIF(TRIM(ticket_id::text), ''), NULL) AS ticket
       FROM public.v_unificado_norm
      ${whereActual}
      ORDER BY fecha DESC, hora DESC
      LIMIT 500
    `) as any[];

    /* ── Procesar ranking ── */
    type Raw = {
      asesor: string; total: number;
      prom_primera: number | null; prom_resolucion: number | null; resueltos: number;
      wpp_cumple_pr: number; wpp_con_dato_pr: number; wpp_cumple_res: number; wpp_con_dato_res: number;
      corr_cumple_pr: number; corr_con_dato_pr: number; corr_cumple_res: number; corr_con_dato_res: number;
      vol_wpp: number; vol_corr: number;
    };
    const rankingRaw2 = rankingRaw as Raw[];
    const grandTotal = rankingRaw2.reduce((s, r) => s + r.total, 0);
    const maxVol = Math.max(...rankingRaw2.map((r) => r.total), 1);

    // Score se calcula en TypeScript (no en SQL) para evitar complejidad y errores de compatibilidad PostgreSQL
    const computeScore = (r: Raw, cumplePr: number, conDatoPr: number, cumpleRes: number, conDatoRes: number): number => {
      const volNorm = r.total / maxVol;
      const slaPr = conDatoPr > 0 ? cumplePr / conDatoPr : 0;
      const slaRes = conDatoRes > 0 ? cumpleRes / conDatoRes : 0;
      const fcr = r.total > 0 ? r.resueltos / r.total : 0;
      return Math.round((volNorm * PESOS_PODIO.volumen + slaPr * (PESOS_PODIO.sla / 2) + slaRes * (PESOS_PODIO.sla / 2) + fcr * 0.15) * 1000) / 10;
    };

    const rankingWithScore = rankingRaw2.map((r) => {
      const pct = grandTotal > 0 ? Math.round((r.total / grandTotal) * 1000) / 10 : 0;
      const fcr = r.total > 0 ? Math.round((r.resueltos / r.total) * 1000) / 10 : null;
      const cumplimientoPr = (r.wpp_con_dato_pr + r.corr_con_dato_pr) > 0
        ? Math.round(((r.wpp_cumple_pr + r.corr_cumple_pr) / (r.wpp_con_dato_pr + r.corr_con_dato_pr)) * 1000) / 10 : null;
      const cumplimientoRes = (r.wpp_con_dato_res + r.corr_con_dato_res) > 0
        ? Math.round(((r.wpp_cumple_res + r.corr_cumple_res) / (r.wpp_con_dato_res + r.corr_con_dato_res)) * 1000) / 10 : null;
      const scoreWpp = computeScore(r, r.wpp_cumple_pr, r.wpp_con_dato_pr, r.wpp_cumple_res, r.wpp_con_dato_res);
      const scoreCorr = computeScore(r, r.corr_cumple_pr, r.corr_con_dato_pr, r.corr_cumple_res, r.corr_con_dato_res);
      const volTotal = r.vol_wpp + r.vol_corr;
      const scoreGlobal = volTotal > 0
        ? Math.round(((scoreWpp * r.vol_wpp + scoreCorr * r.vol_corr) / volTotal) * 10) / 10 : 0;
      return {
        asesor: r.asesor, total: r.total, porcentaje: pct, fcr,
        promedioPrimeraRespuesta: r.prom_primera, promedioResolucion: r.prom_resolucion, promedioEspera: r.prom_primera,
        scoreGlobal, scoreWhatsapp: scoreWpp, scoreCorreo: scoreCorr,
        volumenNormalizado: Math.round((r.total / maxVol) * 1000) / 10,
        cumplimientoPrimeraRespuesta: cumplimientoPr, cumplimientoResolucion: cumplimientoRes,
      };
    });

    // Ordenar por scoreGlobal DESC
    rankingWithScore.sort((a, b) => b.scoreGlobal - a.scoreGlobal);
    const ranking = rankingWithScore;

    /* ── Procesar tiempos por canal ── */
    type TiempoRaw = { asesor: string; canal_grupo: string; prom_primera: number | null; prom_resolucion: number | null };
    const tiempos = tiemposRaw as TiempoRaw[];
    const asesoresUnicos = [...new Set(tiempos.map((t) => t.asesor))];
    const armarTiempos = (campo: "prom_primera" | "prom_resolucion") =>
      asesoresUnicos.map((asesor) => {
        const w = tiempos.find((t) => t.asesor === asesor && t.canal_grupo === "whatsapp");
        const c = tiempos.find((t) => t.asesor === asesor && t.canal_grupo === "correo");
        return { asesor, whatsapp: w ? w[campo] : null, correo: c ? c[campo] : null };
      });

    /* ── Procesar quintiles ── */
    type QRaw = { asesor: string; muy_rapido: number; rapido: number; normal: number; lento: number; muy_lento: number };
    const quintiles = (quintilRaw as QRaw[]).map((q) => {
      const total = q.muy_rapido + q.rapido + q.normal + q.lento + q.muy_lento;
      const pct = (v: number) => total > 0 ? Math.round((v / total) * 1000) / 10 : 0;
      return {
        asesor: q.asesor,
        muyRapido: pct(q.muy_rapido),
        rapido: pct(q.rapido),
        normal: pct(q.normal),
        lento: pct(q.lento),
        muyLento: pct(q.muy_lento),
      };
    });

    /* ── Armar respuesta ── */
    const activos = rankingRaw2.filter((r) => r.asesor !== "Sin asesor").length;
    const tPrim = rankingRaw2.map((r) => r.prom_primera).filter((x): x is number => x !== null);
    const tRes = rankingRaw2.map((r) => r.prom_resolucion).filter((x): x is number => x !== null);
    const avgT = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
    const totalResueltos = rankingRaw2.reduce((s, r) => s + r.resueltos, 0);

    return {
      kpis: {
        totalAtenciones: totalActual.total,
        promedioPrimeraRespuesta: totalActual.prom_primera,
        promedioResolucion: totalActual.prom_resolucion,
        promedioEspera: totalActual.prom_primera,
        fcr: totalActual.total > 0 ? Math.round((totalResueltos / totalActual.total) * 1000) / 10 : null,
        asesoresActivos: activos,
        promedioAtencionesPorAsesor: activos > 0 ? Math.round((totalActual.total / activos) * 10) / 10 : null,
        tiempoPromedioPorAtencion: avgT(tPrim),
      },
      ranking,
      volumenPorAsesor: ranking.map((r) => ({ asesor: r.asesor, total: r.total, porcentaje: r.porcentaje })),
      evolucionDiaria: (evolucionDias as any[]).map((e) => ({
        periodo: e.periodo, asesor: e.asesor, total: e.total,
      })),
      evolucionPorHora: (evolucionHoras as any[]).map((e) => ({
        periodo: e.periodo, asesor: e.asesor, total: e.total,
      })),
      evolucionSemanal: (evolucionSemanas as any[]).map((e) => ({
        periodo: e.periodo, asesor: e.asesor, total: e.total,
      })),
      evolucionMensual: (evolucionMeses as any[]).map((e) => ({
        periodo: e.periodo, asesor: e.asesor, total: e.total,
      })),
      tiemposPrimeraRespuesta: armarTiempos("prom_primera"),
      tiemposResolucion: armarTiempos("prom_resolucion"),
      matrizCategoria: (matrizCat as any[]).map((m) => ({
        etiqueta: m.etiqueta, asesor: m.asesor, total: m.total,
      })),
      matrizSubcategoria: (matrizSub as any[]).map((m) => ({
        etiqueta: m.etiqueta, asesor: m.asesor, total: m.total,
      })),
      quintiles,
      performancePais: (perfPais as any[]).map((p) => ({
        pais: p.pais, asesor: p.asesor, total: p.total,
      })),
      performanceCanal: (perfCanal as any[]).map((c) => ({
        canal: c.canal, total: c.total,
      })),
      performanceCategoria: perfCat,
      performanceSubcategoria: perfSub,
      asesorCanal: (asesorCanalRaw as any[]).map((r) => ({
        asesor: r.asesor, canal: r.canal, categoria: r.categoria, total: r.total,
      })),
      asesorCanalSub: (asesorCanalSubRaw as any[]).map((r) => ({
        asesor: r.asesor, canal: r.canal, categoria: r.categoria, subcategoria: r.subcategoria, total: r.total,
      })),
      detalle: detalle.map((d: any) => ({
        fecha: d.fecha, hora: d.hora, asesor: d.asesor, canal: d.canal,
        subcanal: d.subcanal, pais: d.pais, dominio: d.dominio,
        categoria: d.categoria, subcategoria: d.subcategoria,
        tiempoPrimeraRespuesta: d.tiempoPrimeraRespuesta,
        tiempoResolucion: d.tiempoResolucion,
        tiempoEspera: d.tiempoEspera,
        estado: d.estado, ticket: d.ticket,
      })),
    };
  },

  async categorias(filters: DashboardFilters): Promise<CategoriasResponse> {
    const whereActual = construirWhere(filters);
    const CAT = N_CATEGORIA;
    const SCAT = SCAT_LABEL;
    const GRUPO = Prisma.sql`
      CASE
        WHEN canal ILIKE '%what%' THEN 'whatsapp'
        WHEN canal ILIKE '%ticket%' THEN 'whaticket'
        WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN 'zendesk'
        ELSE 'otro'
      END`;
    const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
    const uRes = umbral(SLA_MINUTOS.resolucion);

    const totalActual = await totales(whereActual);

    const [
      activas,
      overallAvgs,
      treemapRaw,
      topCatRaw,
      topCatAllRaw,
      topSubRaw,
      topSubAllRaw,
      subLiderRaw,
      tiemposRaw,
      slaRaw,
      slaSubRaw,
      canalRaw,
      asesorRaw,
      subAsesorRaw,
      paisRaw,
      dominioRaw,
      evolRaw,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT ${CAT})::int AS activas,
               COUNT(DISTINCT ${SCAT})::int AS subactivas
        FROM public.v_unificado_norm ${whereActual}
      ` as Promise<{ activas: number; subactivas: number }[]>,

      prisma.$queryRaw`
        SELECT
          ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS tiempoEspera,
          ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoAtencion,
          ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0) + COALESCE(resolucion_min_norm, 0))::numeric, 1)::float8 AS tiempoTotal,
          COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumpleSlaEspera,
          COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS totalSlaEspera,
          COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${uRes})::int AS cumpleSlaAtencion,
          COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS totalSlaAtencion
        FROM public.v_unificado_norm ${whereActual}
      ` as Promise<{ tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null; cumpleSlaEspera: number; totalSlaEspera: number; cumpleSlaAtencion: number; totalSlaAtencion: number }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria,
               COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS resolucion
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT} ORDER BY total DESC
      ` as Promise<{ categoria: string; total: number; resolucion: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria, COUNT(*)::int AS total,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0))::numeric, 1)::float8 AS tiempoEspera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoAtencion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0) + COALESCE(resolucion_min_norm, 0))::numeric, 1)::float8 AS tiempoTotal,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumpleSlaEspera,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS totalSlaEspera,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${uRes})::int AS cumpleSlaAtencion,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS totalSlaAtencion,
               COUNT(DISTINCT ${N_ASESOR_COALESCE})::int AS numAsesores
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT} ORDER BY total DESC LIMIT 10
      ` as Promise<{ categoria: string; total: number; tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null; cumpleSlaEspera: number; totalSlaEspera: number; cumpleSlaAtencion: number; totalSlaAtencion: number; numAsesores: number }[]>,

      /* All categories (unlimited) for Pareto */
      prisma.$queryRaw`
        SELECT ${CAT} AS categoria, COUNT(*)::int AS total,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0))::numeric, 1)::float8 AS tiempoEspera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoAtencion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0) + COALESCE(resolucion_min_norm, 0))::numeric, 1)::float8 AS tiempoTotal,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumpleSlaEspera,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS totalSlaEspera,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${uRes})::int AS cumpleSlaAtencion,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS totalSlaAtencion,
               COUNT(DISTINCT ${N_ASESOR_COALESCE})::int AS numAsesores
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT} ORDER BY total DESC
      ` as Promise<{ categoria: string; total: number; tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null; cumpleSlaEspera: number; totalSlaEspera: number; cumpleSlaAtencion: number; totalSlaAtencion: number; numAsesores: number }[]>,

      prisma.$queryRaw`
        SELECT ${SCAT} AS subcategoria, ${CAT} AS categoria, COUNT(*)::int AS total,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0))::numeric, 1)::float8 AS tiempoEspera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoAtencion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0) + COALESCE(resolucion_min_norm, 0))::numeric, 1)::float8 AS tiempoTotal,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumpleSlaEspera,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS totalSlaEspera,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${uRes})::int AS cumpleSlaAtencion,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS totalSlaAtencion
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SCAT_GROUP}, ${CAT} ORDER BY total DESC LIMIT 15
      ` as Promise<{ subcategoria: string; categoria: string; total: number; tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null; cumpleSlaEspera: number; totalSlaEspera: number; cumpleSlaAtencion: number; totalSlaAtencion: number }[]>,

      /* All subcategories (unlimited) for Pareto */
      prisma.$queryRaw`
        SELECT ${SCAT} AS subcategoria, ${CAT} AS categoria, COUNT(*)::int AS total,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0))::numeric, 1)::float8 AS tiempoEspera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoAtencion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0) + COALESCE(resolucion_min_norm, 0))::numeric, 1)::float8 AS tiempoTotal,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumpleSlaEspera,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS totalSlaEspera,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${uRes})::int AS cumpleSlaAtencion,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS totalSlaAtencion
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SCAT_GROUP}, ${CAT} ORDER BY total DESC
      ` as Promise<{ subcategoria: string; categoria: string; total: number; tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null; cumpleSlaEspera: number; totalSlaEspera: number; cumpleSlaAtencion: number; totalSlaAtencion: number }[]>,

      prisma.$queryRaw`
        SELECT ${SCAT} AS subcategoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SCAT_GROUP} ORDER BY total DESC LIMIT 1
      ` as Promise<{ subcategoria: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS resolucion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0))::numeric, 1)::float8 AS espera
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT} ORDER BY resolucion DESC
      ` as Promise<{ categoria: string; primera: number | null; resolucion: number | null; espera: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                                AND primera_respuesta_min_norm <= ${uPr})::int AS cumple,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                                AND primera_respuesta_min_norm > ${uPr})::int AS noCumple
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT} ORDER BY total DESC
      ` as Promise<{ categoria: string; total: number; cumple: number; noCumple: number }[]>,

      prisma.$queryRaw`
        SELECT ${SCAT} AS subcategoria,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                                AND primera_respuesta_min_norm <= ${uPr})::int AS cumple,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                                AND primera_respuesta_min_norm > ${uPr})::int AS noCumple
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SCAT_GROUP} ORDER BY total DESC
      ` as Promise<{ subcategoria: string; total: number; cumple: number; noCumple: number }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria,
               ${GRUPO} AS canal,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT}, ${GRUPO} ORDER BY categoria, canal
      ` as Promise<{ categoria: string; canal: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria, ${N_ASESOR_COALESCE} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT}, ${N_ASESOR_COALESCE} ORDER BY categoria, total DESC
      ` as Promise<{ categoria: string; asesor: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${SCAT} AS categoria, ${N_ASESOR_COALESCE} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SCAT_GROUP}, ${N_ASESOR_COALESCE} ORDER BY categoria, total DESC
      ` as Promise<{ categoria: string; asesor: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria, ${N_PAIS} AS pais,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT}, ${N_PAIS} ORDER BY categoria, total DESC
      ` as Promise<{ categoria: string; pais: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria, ${N_DOMINIO_COALESCE} AS dominio,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT}, ${N_DOMINIO} ORDER BY categoria, total DESC
      ` as Promise<{ categoria: string; dominio: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT fecha::date AS periodo, COUNT(*)::int AS total,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS promPrimera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS promResolucion
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date ORDER BY periodo
      ` as Promise<{ periodo: Date; total: number; promPrimera: number | null; promResolucion: number | null }[]>,
    ]);

    /* ── Jerarquía Categoría → Subcategoría → Canal ── */
    const jerarquiaRaw = await prisma.$queryRaw`
      SELECT ${CAT} AS categoria,
             ${SCAT} AS subcategoria,
             CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END AS canal,
             COUNT(*)::int AS total,
             ROUND(AVG(COALESCE(primera_respuesta_min_norm,0))::numeric, 1)::float8 AS tiempoEspera,
             ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoAtencion,
             ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0) + COALESCE(resolucion_min_norm, 0))::numeric, 1)::float8 AS tiempoTotal,
             COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumpleSlaEspera,
             COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS totalSlaEspera,
             COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${uRes})::int AS cumpleSlaAtencion,
             COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS totalSlaAtencion
      FROM public.v_unificado_norm ${whereActual}
      GROUP BY ${CAT}, ${SCAT_GROUP}, CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END
      ORDER BY categoria, subcategoria, total DESC
    ` as {
      categoria: string; subcategoria: string; canal: string; total: number;
      tiempoEspera: number | null; tiempoAtencion: number | null; tiempoTotal: number | null;
      cumpleSlaEspera: number; totalSlaEspera: number; cumpleSlaAtencion: number; totalSlaAtencion: number;
    }[];

    /* ── KPIs ── */
    const grandTotal = topCatRaw.reduce((s, r) => s + r.total, 0);
    const topCat = topCatRaw[0];
    const topSub = subLiderRaw[0];
    const overall = overallAvgs[0];

    const slaPct = (cumple: number, totalSla: number) =>
      totalSla > 0 ? Math.round((cumple / totalSla) * 1000) / 10 : null;

    /* ── Top categorías con % ── */
    const topCategorias = topCatRaw.map((r) => ({
      categoria: r.categoria,
      total: r.total,
      porcentaje: grandTotal > 0 ? Math.round((r.total / grandTotal) * 1000) / 10 : 0,
      tiempoEspera: r.tiempoEspera,
      tiempoAtencion: r.tiempoAtencion,
      tiempoTotal: r.tiempoTotal,
      sla: slaPct(r.cumpleSlaEspera, r.totalSlaEspera),
    }));

    /* ── Top subcategorías con % ── */
    const grandSubTotal = topSubRaw.reduce((s, r) => s + r.total, 0);
    const topSubcategorias = topSubRaw.map((r) => ({
      subcategoria: r.subcategoria,
      total: r.total,
      porcentaje: grandSubTotal > 0 ? Math.round((r.total / grandSubTotal) * 1000) / 10 : 0,
      tiempoEspera: r.tiempoEspera,
      tiempoAtencion: r.tiempoAtencion,
      tiempoTotal: r.tiempoTotal,
      sla: slaPct(r.cumpleSlaEspera, r.totalSlaEspera),
    }));

    /* ── Pareto categorías (todas) ── */
    const allCatTotal = topCatAllRaw.reduce((s, r) => s + r.total, 0);
    const sortedPareto = [...topCatAllRaw].sort((a, b) => b.total - a.total);
    let acum = 0;
    const pareto = sortedPareto.map((r) => {
      acum += r.total;
      return {
        categoria: r.categoria,
        total: r.total,
        porcentaje: allCatTotal > 0 ? Math.round((r.total / allCatTotal) * 1000) / 10 : 0,
        acumulado: allCatTotal > 0 ? Math.round((acum / allCatTotal) * 1000) / 10 : 0,
        tiempoEspera: r.tiempoEspera,
        tiempoAtencion: r.tiempoAtencion,
        tiempoTotal: r.tiempoTotal,
        slaEspera: slaPct(r.cumpleSlaEspera, r.totalSlaEspera),
        slaAtencion: slaPct(r.cumpleSlaAtencion, r.totalSlaAtencion),
        numAsesores: r.numAsesores,
      };
    });

    /* ── Pareto subcategorías (todas) ── */
    const allSubTotal = topSubAllRaw.reduce((s, r) => s + r.total, 0);
    const sortedParetoSub = [...topSubAllRaw].sort((a, b) => b.total - a.total);
    let acumSub = 0;
    const paretoSub = sortedParetoSub.map((r) => {
      acumSub += r.total;
      return {
        subcategoria: r.subcategoria,
        categoria: r.categoria,
        total: r.total,
        porcentaje: allSubTotal > 0 ? Math.round((r.total / allSubTotal) * 1000) / 10 : 0,
        acumulado: allSubTotal > 0 ? Math.round((acumSub / allSubTotal) * 1000) / 10 : 0,
        tiempoEspera: r.tiempoEspera,
        tiempoAtencion: r.tiempoAtencion,
        tiempoTotal: r.tiempoTotal,
        slaAtencion: slaPct(r.cumpleSlaAtencion, r.totalSlaAtencion),
      };
    });

    /* ── Tiempos por categoría ── */
    const tiemposCategoria = tiemposRaw.map((r) => ({
      categoria: r.categoria,
      primeraRespuesta: r.primera,
      resolucion: r.resolucion,
      espera: r.espera,
    }));

    /* ── SLA por categoría ── */
    const slaCategoria = slaRaw.map((r) => ({
      categoria: r.categoria,
      cumple: r.cumple,
      noCumple: r.noCumple,
      total: r.total,
      pctCumple: slaPct(r.cumple, r.cumple + r.noCumple) ?? 0,
    }));

    /* ── SLA por subcategoría ── */
    const slaSubcategoria = slaSubRaw.map((r) => ({
      subcategoria: r.subcategoria,
      cumple: r.cumple,
      noCumple: r.noCumple,
      total: r.total,
      pctCumple: slaPct(r.cumple, r.cumple + r.noCumple) ?? 0,
    }));

    /* ── Matriz Canal ── */
    const canalMap = new Map<string, { whatsapp: number; whaticket: number; zendesk: number }>();
    for (const r of canalRaw) {
      if (!canalMap.has(r.categoria)) canalMap.set(r.categoria, { whatsapp: 0, whaticket: 0, zendesk: 0 });
      const c = canalMap.get(r.categoria)!;
      c[r.canal as "whatsapp" | "whaticket" | "zendesk"] = r.total;
    }
    const matrizCanal = [...canalMap.entries()].map(([categoria, v]) => ({ categoria, ...v }));

    /* ── Matriz Asesor ── */
    const matrizAsesor = asesorRaw.map((r) => ({ categoria: r.categoria, asesor: r.asesor, total: r.total }));

    /* ── Matriz Subcategoría-Asesor ── */
    const matrizSubAsesor = subAsesorRaw.map((r) => ({ subcategoria: r.categoria, asesor: r.asesor, total: r.total }));

    /* ── Matriz País ── */
    const matrizPais = paisRaw.map((r) => ({ categoria: r.categoria, pais: r.pais, total: r.total }));

    return {
      kpis: {
        totalCategorias: activas[0]?.activas ?? 0,
        totalSubcategorias: activas[0]?.subactivas ?? 0,
        categoriaLider: topCat ? { nombre: topCat.categoria, total: topCat.total } : null,
        subcategoriaLider: topSub ? { nombre: topSub.subcategoria, total: topSub.total } : null,
        tiempoEspera: overall?.tiempoEspera ?? null,
        tiempoAtencion: overall?.tiempoAtencion ?? null,
        tiempoTotal: overall?.tiempoTotal ?? null,
        slaEspera: slaPct(overall?.cumpleSlaEspera ?? 0, overall?.totalSlaEspera ?? 0),
        slaAtencion: slaPct(overall?.cumpleSlaAtencion ?? 0, overall?.totalSlaAtencion ?? 0),
      },
      topCategorias,
      topSubcategorias,
      pareto,
      paretoSub,
      tiemposCategoria,
      slaCategoria,
      slaSubcategoria,
      matrizCanal,
      matrizAsesor,
      matrizSubAsesor,
      matrizPais,
      jerarquia: jerarquiaRaw.map((r) => ({
        categoria: r.categoria,
        subcategoria: r.subcategoria,
        canal: r.canal,
        total: r.total,
        tiempoEspera: r.tiempoEspera,
        tiempoAtencion: r.tiempoAtencion,
        tiempoTotal: r.tiempoTotal,
        slaEspera: slaPct(r.cumpleSlaEspera, r.totalSlaEspera),
        slaAtencion: slaPct(r.cumpleSlaAtencion, r.totalSlaAtencion),
      })),
    };
  },

  async categoriasV2(filters: DashboardFilters): Promise<CategoriasV2Response> {
    // Universo único del reporte: atenciones finalizadas (cerradas o resueltas).
    const whereBase = construirWhere(filters, { fechaRangoSargable: true });
    const whereActual = whereConCanal(whereBase, FINALIZADAS);

    const CAT = N_CATEGORIA;
    const SCAT = SCAT_LABEL; // canónico mostrado (homologado central)
    const SCAT_GROUP = SCAT_KEY; // clave de agrupación (homologada central)
    const DOM = N_DOMINIO_COALESCE;
    const uRes = umbral(SLA_MINUTOS.resolucion);
    const TECNICAS = ["SIN HOMOLOGAR", "SIN CATEGORIA EN ORIGEN", "SIN CATEGORÍA EN ORIGEN"];

    const [universoRaw, catsMetricasRaw, jerarquiaRaw, asesorDetalleRaw] =
      await Promise.all([
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS total_rango,
                 COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS total,
                 COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertas,
                 COUNT(*) FILTER (WHERE estado_homologado = 'sin_mapear')::int AS sin_estado
          FROM public.v_unificado_norm ${whereBase}
        ` as Promise<{ total_rango: number; total: number; abiertas: number; sin_estado: number }[]>,

        prisma.$queryRaw`
          SELECT ${CAT} AS categoria,
                 COUNT(*)::int AS volumen,
                 COUNT(resolucion_min_norm)::int AS con_dato,
                 COUNT(*) FILTER (
                   WHERE resolucion_min_norm IS NOT NULL
                     AND resolucion_min_norm <= ${uRes}
                 )::int AS cumple,
                 ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempo_atencion
          FROM public.v_unificado_norm ${whereActual}
          GROUP BY ${CAT}
          ORDER BY volumen DESC
        ` as Promise<{
          categoria: string;
          volumen: number;
          con_dato: number;
          cumple: number;
          tiempo_atencion: number | null;
        }[]>,

        prisma.$queryRaw`
          SELECT ${CAT} AS categoria, ${SCAT} AS subcategoria, ${DOM} AS dominio, COUNT(*)::int AS volumen
          FROM public.v_unificado_norm ${whereActual}
          GROUP BY ${CAT}, ${SCAT_GROUP}, ${DOM}
          ORDER BY categoria, volumen DESC
        ` as Promise<{ categoria: string; subcategoria: string; dominio: string; volumen: number }[]>,

        prisma.$queryRaw`
          SELECT COALESCE(NULLIF(TRIM(asesor), ''), ${ASESOR_SIN_ASIGNAR}) AS asesor,
                 ${CAT} AS categoria,
                 ${SCAT} AS subcategoria,
                 COUNT(*)::int AS volumen
          FROM public.v_unificado_norm ${whereActual}
          GROUP BY 1, 2, 3
          ORDER BY volumen DESC
        ` as Promise<{ asesor: string; categoria: string; subcategoria: string; volumen: number }[]>,
      ]);

    const universo = universoRaw[0] ?? {
      total_rango: 0,
      total: 0,
      abiertas: 0,
      sin_estado: 0,
    };

    /* ── Pareto de categorías ── */
    const totalParetoCat = catsMetricasRaw.reduce((s, r) => s + r.volumen, 0);
    let acum = 0;
    const paretoCategorias = catsMetricasRaw.map((r) => {
      acum += r.volumen;
      return {
        categoria: r.categoria,
        volumen: r.volumen,
        pct: totalParetoCat > 0 ? Math.round((r.volumen / totalParetoCat) * 1000) / 10 : 0,
        acumulado: totalParetoCat > 0 ? Math.round((acum / totalParetoCat) * 1000) / 10 : 0,
        tecnica: TECNICAS.includes(r.categoria.toUpperCase()),
      };
    });

    /* ── Subcategorías: se agregan desde la jerarquía (misma fuente) ── */
    const subMap = new Map<
      string,
      { categoria: string; subcategoria: string; volumen: number }
    >();
    for (const r of jerarquiaRaw) {
      const key = `${r.categoria}|${r.subcategoria}`;
      const actual = subMap.get(key);
      if (actual) {
        actual.volumen += r.volumen;
      } else {
        subMap.set(key, {
          categoria: r.categoria,
          subcategoria: r.subcategoria,
          volumen: r.volumen,
        });
      }
    }
    const paretoSubcategorias = [...subMap.values()].sort((a, b) => b.volumen - a.volumen);
    const subLider = paretoSubcategorias[0];

    /* ── Tiempo y SLA por categoría ── */
    const categoriasTiempo = catsMetricasRaw.map((r) => ({
      categoria: r.categoria,
      volumen: r.volumen,
      conDato: r.con_dato,
      tiempo_atencion: r.tiempo_atencion,
      tecnica: TECNICAS.includes(r.categoria.toUpperCase()),
    }));

    const categoriasSLA = catsMetricasRaw.map((r) => {
      const noCumple = Math.max(0, r.con_dato - r.cumple);
      return {
        categoria: r.categoria,
        volumen: r.volumen,
        conDato: r.con_dato,
        cumple: r.cumple,
        noCumple,
        pctCumple:
          r.con_dato > 0 ? Math.round((r.cumple / r.con_dato) * 1000) / 10 : null,
        pctIncumple:
          r.con_dato > 0 ? Math.round((noCumple / r.con_dato) * 1000) / 10 : null,
        tecnica: TECNICAS.includes(r.categoria.toUpperCase()),
      };
    });

    /* ── Asesores: tabla explícita de equivalencias ── */
    const asesorDetalle = asesorDetalleRaw.map((r) => ({
      asesor: consolidarAsesor(r.asesor),
      categoria: r.categoria,
      subcategoria: r.subcategoria,
      volumen: r.volumen,
    }));

    const trazabilidadMap = new Map<string, number>();
    for (const r of asesorDetalleRaw) {
      const original = r.asesor.trim() || ASESOR_SIN_ASIGNAR;
      trazabilidadMap.set(original, (trazabilidadMap.get(original) ?? 0) + r.volumen);
    }
    const asesorTrazabilidad = [...trazabilidadMap.entries()]
      .map(([original, volumen]) => ({
        original,
        consolidado: consolidarAsesor(original),
        volumen,
      }))
      .sort((a, b) => b.volumen - a.volumen);

    const totalSinAsesor = asesorDetalleRaw
      .filter((r) => r.asesor.trim() === ASESOR_SIN_ASIGNAR)
      .reduce((s, r) => s + r.volumen, 0);

    return {
      universo: {
        total: universo.total,
        totalRango: universo.total_rango,
        excluidas: universo.total_rango - universo.total,
        abiertas: universo.abiertas,
        sinEstado: universo.sin_estado,
      },
      totalCategorias: paretoCategorias.length,
      totalSubcategorias: new Set(paretoSubcategorias.map((r) => r.subcategoria)).size,
      categoriaLider: catsMetricasRaw[0]
        ? { nombre: catsMetricasRaw[0].categoria, volumen: catsMetricasRaw[0].volumen }
        : null,
      subcategoriaLider: subLider
        ? { nombre: subLider.subcategoria, volumen: subLider.volumen }
        : null,
      paretoCategorias,
      paretoSubcategorias,
      jerarquia: jerarquiaRaw.map((r) => ({
        categoria: r.categoria,
        subcategoria: r.subcategoria,
        dominio: r.dominio,
        volumen: r.volumen,
      })),
      categoriasTiempo,
      categoriasSLA,
      slaMetas: SLA_MINUTOS.resolucion,
      asesorDetalle,
      asesorTrazabilidad,
      totalSinAsesor,
    };
  },

  async clientesV2(filters: DashboardFilters): Promise<ClientesV2Response> {
    const whereActual = whereClientes(filters);
    const prev =
      filters.fechaHoraInicio && filters.fechaHoraFin
        ? rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin)
        : null;
    const wherePrev = prev
      ? whereClientes({
          ...filters,
          fechaHoraInicio: `${prev.inicio} 00:00`,
          fechaHoraFin: `${prev.fin} 23:59`,
        })
      : null;

    const [rows, prevTotalRaw] = await Promise.all([
      prisma.$queryRaw(
        Prisma.sql`${clientesContexto(whereActual, wherePrev)} ORDER BY total DESC, clave`,
      ) as Promise<ClienteBaseRow[]>,
      wherePrev
        ? (prisma.$queryRaw(
            Prisma.sql`SELECT COUNT(*)::int AS total FROM public.v_unificado_norm ${wherePrev}`,
          ) as Promise<{ total: number }[]>)
        : Promise.resolve([] as { total: number }[]),
    ]);

    const sinIdent = rows.find((r) => r.clave === SIN_IDENTIFICAR_KEY) ?? null;
    const identificados = rows.filter((r) => r.clave !== SIN_IDENTIFICAR_KEY);
    const atenciones = rows.reduce((s, r) => s + r.total, 0);
    const atencionesIdentificadas = identificados.reduce((s, r) => s + r.total, 0);
    const atencionesNoIdentificadas = sinIdent?.total ?? 0;
    const clientesIdentificados = identificados.length;
    const clientesMulticanal = identificados.filter((r) => r.wpp && r.correo).length;
    const canales = {
      ambos: clientesMulticanal,
      soloWhatsapp: identificados.filter((r) => r.wpp && !r.correo).length,
      soloCorreo: identificados.filter((r) => !r.wpp && r.correo).length,
      total: clientesIdentificados,
    };
    const totalAnterior = prev ? (prevTotalRaw[0]?.total ?? 0) : null;
    const variacionTotal =
      totalAnterior !== null && totalAnterior > 0
        ? Math.round(((atenciones - totalAnterior) / totalAnterior) * 1000) / 10
        : null;

    const ranking = identificados
      .slice(0, 20)
      .map((r) => mapClienteResumen(r, atencionesIdentificadas));

    const seguimiento: ClienteSeguimiento[] = [];
    for (const r of identificados) {
      if (r.total < 3) continue;

      const noCumple = Math.max(0, r.con_dato - r.cumple);
      const pctIncumple =
        r.con_dato > 0 ? Math.round((noCumple / r.con_dato) * 1000) / 10 : null;
      const motivos: string[] = [];

      if (r.con_dato >= 3 && pctIncumple !== null && pctIncumple > 30) {
        motivos.push("Incumplimiento SLA > 30%");
      }
      if (r.con_dato >= 3 && r.tiempo !== null && r.tiempo > 1440) {
        motivos.push("Tiempo promedio > 24 h");
      }
      if (r.total >= 10 && r.prev_total > 0 && r.total >= 2 * r.prev_total) {
        motivos.push("Aumento de demanda ≥ 2×");
      }
      if (r.max_rec >= 4) {
        motivos.push("Reincidencia ≥ 4 tickets en una subcategoría");
      }
      if (motivos.length < 2) continue;

      seguimiento.push({
        cliente: r.clave,
        clave: r.clave,
        total: r.total,
        totalAnterior: r.prev_total,
        variacionPct:
          r.prev_total > 0
            ? Math.round(((r.total - r.prev_total) / r.prev_total) * 1000) / 10
            : null,
        reincidenciaMax: r.max_rec,
        subcategoriaRecurrente: r.subcategoria_recurrente,
        tiempoPromedio: r.tiempo,
        conDato: r.con_dato,
        noCumple,
        pctIncumple,
        motivos,
        senales: motivos.length,
      });
    }

    seguimiento.sort(
      (a, b) =>
        b.senales - a.senales ||
        (b.pctIncumple ?? 0) - (a.pctIncumple ?? 0) ||
        b.total - a.total,
    );

    const pctNoIdentificadas =
      atenciones > 0
        ? Math.round((atencionesNoIdentificadas / atenciones) * 1000) / 10
        : 0;

    return {
      universo: {
        total: atenciones,
        totalAnterior,
        variacionPct: variacionTotal,
        rango:
          prev && filters.fechaHoraInicio && filters.fechaHoraFin
            ? {
                inicio: filters.fechaHoraInicio,
                fin: filters.fechaHoraFin,
                comparadoCon: prev,
              }
            : null,
      },
      kpis: {
        clientesIdentificados,
        atenciones,
        atencionesIdentificadas,
        atencionesNoIdentificadas,
        pctNoIdentificadas,
        promedioAtenciones:
          clientesIdentificados > 0
            ? Math.round((atencionesIdentificadas / clientesIdentificados) * 100) / 100
            : 0,
        clientesConSeguimiento: seguimiento.length,
        clientesMulticanal,
      },
      calidad: {
        atencionesNoIdentificadas,
        pctNoIdentificadas,
        dominiosInvalidos: sinIdent?.dominios_invalidos ?? 0,
        numerosDistintos: sinIdent?.numeros_no_ident ?? 0,
        identificadosPorCorreo: identificados.filter((r) => r.por_correo).length,
      },
      canales,
      ranking,
      rankingTotal: clientesIdentificados,
      seguimiento,
      seguimientoTotal: seguimiento.length,
    };
  },

  async clientesLista(
    filters: DashboardFilters,
    opts: { page?: number; pageSize?: number; search?: string; all?: boolean } = {},
  ): Promise<ClientesListaResponse> {
    const whereActual = whereClientes(filters);
    const prev =
      filters.fechaHoraInicio && filters.fechaHoraFin
        ? rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin)
        : null;
    const wherePrev = prev
      ? whereClientes({
          ...filters,
          fechaHoraInicio: `${prev.inicio} 00:00`,
          fechaHoraFin: `${prev.fin} 23:59`,
        })
      : null;

    const page = opts.all ? 1 : Math.max(1, Math.trunc(opts.page ?? 1));
    const pageSize = opts.all
      ? 5000
      : Math.min(100, Math.max(1, Math.trunc(opts.pageSize ?? 25)));
    const offset = opts.all ? 0 : (page - 1) * pageSize;
    const search = (opts.search ?? "").trim().toLowerCase();

    const [totalesRaw, filasRaw] = await Promise.all([
      prisma.$queryRaw(
        Prisma.sql`
          WITH claves AS (
            SELECT ${CLIENTE_KEY} AS clave
            FROM public.v_unificado_norm
            ${whereActual}
          ), base AS (
            SELECT clave, COUNT(*)::int AS total
            FROM claves
            GROUP BY clave
          )
          SELECT COALESCE(SUM(total) FILTER (WHERE clave <> ${SIN_IDENTIFICAR_KEY}), 0)::int AS atenciones_ident,
                 COUNT(*) FILTER (WHERE clave <> ${SIN_IDENTIFICAR_KEY})::int AS clientes
          FROM base
        `,
      ) as Promise<{ atenciones_ident: number; clientes: number }[]>,
      prisma.$queryRaw(
        Prisma.sql`
          WITH contexto AS (${clientesContexto(whereActual, wherePrev)})
          SELECT *, COUNT(*) OVER()::int AS total_filas
          FROM contexto
          WHERE clave <> ${SIN_IDENTIFICAR_KEY}
            ${search ? Prisma.sql`AND clave ILIKE ${"%" + search + "%"}` : Prisma.empty}
          ORDER BY total DESC, clave
          LIMIT ${pageSize} OFFSET ${offset}
        `,
      ) as Promise<(ClienteBaseRow & { total_filas: number })[]>,
    ]);

    const totalIdent = totalesRaw[0]?.atenciones_ident ?? 0;
    return {
      total: filasRaw[0]?.total_filas ?? 0,
      page,
      pageSize,
      rows: filasRaw.map((r) => mapClienteResumen(r, totalIdent)),
    };
  },

  async clienteCategorias(
    filters: DashboardFilters,
    clave: string,
  ): Promise<ClienteCategoriasResponse> {
    const whereActual = whereClientes(filters);
    const uRes = umbral(SLA_MINUTOS.resolucion);
    const rows = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT ${N_CATEGORIA} AS categoria,
               COUNT(*)::int AS total,
               COUNT(resolucion_min_norm)::int AS con_dato,
               COUNT(*) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND resolucion_min_norm <= ${uRes}
               )::int AS cumple,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempo
        FROM public.v_unificado_norm
        ${whereActual}
        AND ${CLIENTE_KEY} = ${clave}
        GROUP BY ${N_CATEGORIA}
        ORDER BY total DESC
      `,
    )) as {
      categoria: string;
      total: number;
      con_dato: number;
      cumple: number;
      tiempo: number | null;
    }[];

    const total = rows.reduce((s, r) => s + r.total, 0);
    return {
      cliente: nombreCliente(clave),
      clave,
      esNoIdentificado: clave === SIN_IDENTIFICAR_KEY,
      total,
      categorias: rows.map((r) => {
        const noCumple = Math.max(0, r.con_dato - r.cumple);
        return {
          categoria: r.categoria,
          total: r.total,
          pct: total > 0 ? Math.round((r.total / total) * 1000) / 10 : 0,
          tiempoPromedio: r.tiempo,
          conDato: r.con_dato,
          noCumple,
          pctIncumple:
            r.con_dato > 0 ? Math.round((noCumple / r.con_dato) * 1000) / 10 : null,
        };
      }),
    };
  },

  async clienteSubcategorias(
    filters: DashboardFilters,
    clave: string,
    categoria: string,
  ): Promise<ClienteSubcategoriasResponse> {
    const whereActual = whereClientes(filters);
    const uRes = umbral(SLA_MINUTOS.resolucion);
    const rows = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT ${N_CATEGORIA} AS categoria,
               ${SCAT_LABEL} AS subcategoria,
               COUNT(*)::int AS total,
               COUNT(resolucion_min_norm)::int AS con_dato,
               COUNT(*) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND resolucion_min_norm <= ${uRes}
               )::int AS cumple,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempo
        FROM public.v_unificado_norm
        ${whereActual}
        AND ${CLIENTE_KEY} = ${clave}
        AND ${N_CATEGORIA} = ${categoria}
        GROUP BY ${N_CATEGORIA}, ${SCAT_KEY}
        ORDER BY total DESC
      `,
    )) as {
      categoria: string;
      subcategoria: string;
      total: number;
      con_dato: number;
      cumple: number;
      tiempo: number | null;
    }[];

    const total = rows.reduce((s, r) => s + r.total, 0);
    return {
      cliente: nombreCliente(clave),
      clave,
      categoria,
      esNoIdentificado: clave === SIN_IDENTIFICAR_KEY,
      total,
      subcategorias: rows.map((r) => {
        const noCumple = Math.max(0, r.con_dato - r.cumple);
        return {
          categoria: r.categoria,
          subcategoria: r.subcategoria,
          total: r.total,
          pct: total > 0 ? Math.round((r.total / total) * 1000) / 10 : 0,
          tiempoPromedio: r.tiempo,
          conDato: r.con_dato,
          noCumple,
          pctIncumple:
            r.con_dato > 0 ? Math.round((noCumple / r.con_dato) * 1000) / 10 : null,
        };
      }),
    };
  },

  async clienteTickets(
    filters: DashboardFilters,
    params: {
      clave: string;
      categoria: string;
      subcategoria: string;
      page?: number;
      pageSize?: number;
      all?: boolean;
    },
  ): Promise<ClienteTicketsResponse> {
    const whereActual = whereClientes(filters);
    const uRes = umbral(SLA_MINUTOS.resolucion);
    const page = params.all ? 1 : Math.max(1, Math.trunc(params.page ?? 1));
    const pageSize = params.all
      ? 50000
      : Math.min(100, Math.max(1, Math.trunc(params.pageSize ?? 25)));
    const offset = params.all ? 0 : (page - 1) * pageSize;
    const subdomain = (process.env.ZENDESK_SUBDOMAIN ?? "").trim();
    const zendeskValido = /^[a-z0-9-]+$/i.test(subdomain);

    const [totalRaw, rows] = await Promise.all([
      prisma.$queryRaw(
        Prisma.sql`
          SELECT COUNT(*)::int AS total
          FROM public.v_unificado_norm
          ${whereActual}
          AND ${CLIENTE_KEY} = ${params.clave}
          AND ${N_CATEGORIA} = ${params.categoria}
          AND ${SCAT_LABEL} = ${params.subcategoria}
        `,
      ) as Promise<{ total: number }[]>,
      prisma.$queryRaw(
        Prisma.sql`
          SELECT ticket_id::text AS ticket,
                 subcanal AS canal,
                 TO_CHAR(${CREACION_CLIENTE}, 'YYYY-MM-DD HH24:MI') AS fecha,
                 ${N_CATEGORIA} AS categoria,
                 ${SCAT_LABEL} AS subcategoria,
                 ${DOMINIO_NORMALIZADO} AS dominio,
                 NULLIF(TRIM(contacto), '') AS contacto,
                 NULLIF(TRIM(numero), '') AS numero,
                 COALESCE(NULLIF(TRIM(asesor), ''), 'Sin asignar') AS asesor,
                 estado_homologado AS estado,
                 resolucion_min_norm::float8 AS tiempo,
                 CASE
                   WHEN resolucion_min_norm IS NULL THEN NULL
                   WHEN resolucion_min_norm <= ${uRes} THEN true
                   ELSE false
                 END AS cumple_sla,
                 ${uRes}::int AS umbral
          FROM public.v_unificado_norm
          ${whereActual}
          AND ${CLIENTE_KEY} = ${params.clave}
          AND ${N_CATEGORIA} = ${params.categoria}
          AND ${SCAT_LABEL} = ${params.subcategoria}
          ORDER BY ${CREACION_CLIENTE} DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `,
      ) as Promise<{
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
        tiempo: number | null;
        cumple_sla: boolean | null;
        umbral: number;
      }[]>,
    ]);

    return {
      total: totalRaw[0]?.total ?? 0,
      page,
      pageSize,
      rows: rows.map((r) => ({
        ticket: r.ticket,
        canal: r.canal,
        fecha: r.fecha,
        categoria: r.categoria,
        subcategoria: r.subcategoria,
        dominio: r.dominio,
        contacto: r.contacto,
        numero: r.numero,
        asesor: r.asesor,
        estado: r.estado,
        tiempoResolucion: r.tiempo,
        cumpleSla: r.cumple_sla,
        umbralMinutos: r.umbral,
        urlTicket:
          r.canal === "ZENDESK" && zendeskValido && /^\d+$/.test(r.ticket)
            ? `https://${subdomain}.zendesk.com/agent/tickets/${r.ticket}`
            : null,
      })),
    };
  },

  async clienteEvolucion(
    filters: DashboardFilters,
    params: { clave: string; granularidad: "diaria" | "semanal" | "mensual" },
  ): Promise<ClienteEvolucionResponse> {
    const whereActual = whereClientes(filters);
    const prev =
      filters.fechaHoraInicio && filters.fechaHoraFin
        ? rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin)
        : null;
    const wherePrev = prev
      ? whereClientes({
          ...filters,
          fechaHoraInicio: `${prev.inicio} 00:00`,
          fechaHoraFin: `${prev.fin} 23:59`,
        })
      : null;

    if (!wherePrev) {
      return {
        cliente: nombreCliente(params.clave),
        clave: params.clave,
        esNoIdentificado: params.clave === SIN_IDENTIFICAR_KEY,
        granularidad: params.granularidad,
        actual: [],
        anterior: [],
        totalActual: 0,
        totalAnterior: 0,
        variacionPct: null,
      };
    }

    const periodo =
      params.granularidad === "diaria"
        ? Prisma.sql`TO_CHAR(${CREACION_CLIENTE}::date, 'YYYY-MM-DD')`
        : params.granularidad === "semanal"
          ? Prisma.sql`TO_CHAR(DATE_TRUNC('week', ${CREACION_CLIENTE}), 'YYYY-MM-DD')`
          : Prisma.sql`TO_CHAR(DATE_TRUNC('month', ${CREACION_CLIENTE}), 'YYYY-MM')`;

    const [actualRaw, anteriorRaw] = await Promise.all([
      prisma.$queryRaw(
        Prisma.sql`
          SELECT ${periodo} AS periodo, COUNT(*)::int AS total
          FROM public.v_unificado_norm
          ${whereActual}
          AND ${CLIENTE_KEY} = ${params.clave}
          GROUP BY ${periodo}
          ORDER BY periodo
        `,
      ) as Promise<{ periodo: string; total: number }[]>,
      prisma.$queryRaw(
        Prisma.sql`
          SELECT ${periodo} AS periodo, COUNT(*)::int AS total
          FROM public.v_unificado_norm
          ${wherePrev}
          AND ${CLIENTE_KEY} = ${params.clave}
          GROUP BY ${periodo}
          ORDER BY periodo
        `,
      ) as Promise<{ periodo: string; total: number }[]>,
    ]);

    const totalActual = actualRaw.reduce((s, r) => s + r.total, 0);
    const totalAnterior = anteriorRaw.reduce((s, r) => s + r.total, 0);
    return {
      cliente: nombreCliente(params.clave),
      clave: params.clave,
      esNoIdentificado: params.clave === SIN_IDENTIFICAR_KEY,
      granularidad: params.granularidad,
      actual: actualRaw,
      anterior: anteriorRaw,
      totalActual,
      totalAnterior,
      variacionPct:
        totalAnterior > 0
          ? Math.round(((totalActual - totalAnterior) / totalAnterior) * 1000) / 10
          : null,
    };
  },

  async clientes(filters: DashboardFilters): Promise<ClientesResponse> {
    const whereActual = construirWhere(filters);
    const CL = Prisma.sql`COALESCE(NULLIF(TRIM(contacto), ''), 'Sin contacto')`;
    const CL_NORM = Prisma.sql`INITCAP(TRANSLATE(TRIM(contacto), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun'))`;
    const CL_COL = Prisma.sql`COALESCE(NULLIF(${CL_NORM}, ''), 'Sin contacto')`;
    const GRUPO = Prisma.sql`CASE WHEN canal ILIKE '%what%' THEN 'whatsapp' WHEN canal ILIKE '%ticket%' THEN 'whaticket' ELSE 'zendesk' END`;
    const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
    const uRes = umbral(SLA_MINUTOS.resolucion);
    const totalActual = await totales(whereActual);

    const [
      kpiRaw, topRaw, paisRaw, canalRaw, catRaw, subRaw,
      tiemposRaw, slaRaw, evolRaw, dominiosRaw,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT ${CL})::int AS unicos,
               COUNT(*) FILTER (WHERE dominio IS NOT NULL AND TRIM(dominio) <> '' AND dominio <> '—')::int AS conDom,
               COUNT(*) FILTER (WHERE dominio IS NULL OR TRIM(dominio) = '' OR dominio = '—')::int AS sinDom,
               COUNT(DISTINCT CASE WHEN canal ILIKE '%what%' THEN ${CL} END)::int AS wpp,
               COUNT(DISTINCT CASE WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN ${CL} END)::int AS correo
        FROM public.v_unificado_norm ${whereActual}
      ` as Promise<{ unicos: number; conDom: number; sinDom: number; wpp: number; correo: number }[]>,

      prisma.$queryRaw`
        SELECT ${CL_COL} AS cliente, COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoPromedio,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumple,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS conDato
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CL_COL} ORDER BY total DESC LIMIT 50
      ` as Promise<{ cliente: string; total: number; tiempoPromedio: number | null; cumple: number; conDato: number }[]>,

      prisma.$queryRaw`
        SELECT ${CL_COL} AS cliente, ${N_PAIS} AS pais, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CL_COL}, ${N_PAIS} ORDER BY total DESC
      ` as Promise<{ cliente: string; pais: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CL_COL} AS cliente, ${GRUPO} AS canal, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CL_COL}, ${GRUPO} ORDER BY cliente, canal
      ` as Promise<{ cliente: string; canal: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CL_COL} AS cliente, ${N_CATEGORIA} AS categoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CL_COL}, ${N_CATEGORIA} ORDER BY cliente, total DESC
      ` as Promise<{ cliente: string; categoria: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CL_COL} AS cliente, ${SCAT_LABEL} AS categoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CL_COL}, ${SCAT_KEY} ORDER BY cliente, total DESC
      ` as Promise<{ cliente: string; categoria: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CL_COL} AS cliente,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS resolucion
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CL_COL} ORDER BY cliente
      ` as Promise<{ cliente: string; primera: number | null; resolucion: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${CL_COL} AS cliente,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumple,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm > ${uPr})::int AS noCumple
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CL_COL} ORDER BY total DESC
      ` as Promise<{ cliente: string; total: number; cumple: number; noCumple: number }[]>,

      prisma.$queryRaw`
        SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS periodo, ${CL_COL} AS cliente, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date, ${CL_COL} ORDER BY periodo
      ` as Promise<{ periodo: string; cliente: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_DOMINIO_COALESCE} AS dominio, COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoPromedio
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${N_DOMINIO} ORDER BY total DESC LIMIT 30
      ` as Promise<{ dominio: string; total: number; tiempoPromedio: number | null }[]>,
    ]);

    /* Tiempos separados por canal */
    const tiemposCanalRaw = await prisma.$queryRaw`
      SELECT ${GRUPO} AS canal,
             ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS promPrimera,
             ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS promResolucion
      FROM public.v_unificado_norm ${whereActual}
      GROUP BY ${GRUPO}
    ` as { canal: string; promPrimera: number | null; promResolucion: number | null }[];

    /* SLA total */
    const slaTotal = { cumple: 0, total: 0 };
    for (const r of slaRaw) { slaTotal.cumple += r.cumple; slaTotal.total += r.cumple + r.noCumple; }
    const slaPct = slaTotal.total > 0 ? Math.round((slaTotal.cumple / slaTotal.total) * 1000) / 10 : null;

    /* FCR */
    const fcrVal = totalActual.total > 0 ? Math.round(((totalActual.cerrados + totalActual.resueltos) / totalActual.total) * 1000) / 10 : null;

    /* KPIs */
    const k = kpiRaw[0]!;
    const kpis: ClientesKpis = {
      clientesUnicos: k.unicos,
      totalAtenciones: totalActual.total,
      clientesConDominio: k.conDom,
      clientesSinDominio: k.sinDom,
      pctConDominio: k.unicos > 0 ? Math.round((k.conDom / k.unicos) * 1000) / 10 : 0,
      pctSinDominio: k.unicos > 0 ? Math.round((k.sinDom / k.unicos) * 1000) / 10 : 0,
      clientesWhatsapp: k.wpp,
      clientesCorreo: k.correo,
      tiempoPrimeraWhatsapp: tiemposCanalRaw.find((t) => t.canal === "whatsapp")?.promPrimera ?? null,
      tiempoPrimeraCorreo: tiemposCanalRaw.find((t) => t.canal === "zendesk")?.promPrimera ?? null,
      tiempoResolucionWhatsapp: tiemposCanalRaw.find((t) => t.canal === "whatsapp")?.promResolucion ?? null,
      tiempoResolucionCorreo: tiemposCanalRaw.find((t) => t.canal === "zendesk")?.promResolucion ?? null,
      cumplimientoSla: slaPct,
      fcr: fcrVal,
    };

    /* Distribución canal */
    const canalCounts = { whatsapp: 0, whaticket: 0, zendesk: 0 };
    for (const r of canalRaw) {
      const c = r.canal as "whatsapp" | "whaticket" | "zendesk";
      canalCounts[c] += r.total;
    }
    const totalGeneral = Object.values(canalCounts).reduce((s, v) => s + v, 0);
    const distCanal = Object.entries(canalCounts).map(([canal, total]) => ({
      canal, total, porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 1000) / 10 : 0,
    }));

    /* Distribución dominio */
    const distDominio = [
      { grupo: "Con dominio", total: k.conDom, porcentaje: k.unicos > 0 ? Math.round((k.conDom / k.unicos) * 1000) / 10 : 0 },
      { grupo: "Sin dominio", total: k.sinDom, porcentaje: k.unicos > 0 ? Math.round((k.sinDom / k.unicos) * 1000) / 10 : 0 },
    ];

    /* Top 20 clientes */
    const grandTotal = topRaw.reduce((s, r) => s + r.total, 0);
    const topClientes = topRaw.slice(0, 20).map((r) => ({
      cliente: r.cliente, total: r.total,
      porcentaje: grandTotal > 0 ? Math.round((r.total / grandTotal) * 1000) / 10 : 0,
      tiempoPromedio: r.tiempoPromedio,
      sla: r.conDato > 0 ? Math.round((r.cumple / r.conDato) * 1000) / 10 : null,
    }));

    /* Ranking detalle */
    const ranking: ClienteDetalle[] = topRaw.map((r) => {
      const pais = paisRaw.filter((p) => p.cliente === r.cliente).sort((a, b) => b.total - a.total)[0];
      const canal = canalRaw.filter((c) => c.cliente === r.cliente).sort((a, b) => b.total - a.total)[0];
      const cat = catRaw.filter((c) => c.cliente === r.cliente).sort((a, b) => b.total - a.total)[0];
      const sub = subRaw.filter((s) => s.cliente === r.cliente).sort((a, b) => b.total - a.total)[0];
      const ult = evolRaw.filter((e) => e.cliente === r.cliente).sort((a, b) => b.periodo.localeCompare(a.periodo))[0];
      return {
        cliente: r.cliente,
        dominio: pais?.pais ?? "—",
        pais: pais?.pais ?? "—",
        canalPrincipal: canal?.canal ?? "—",
        total: r.total,
        tiempoResolucion: r.tiempoPromedio,
        tiempoPrimera: null,
        sla: r.conDato > 0 ? Math.round((r.cumple / r.conDato) * 1000) / 10 : null,
        fcr: null,
        categoriaPrincipal: cat?.categoria ?? "—",
        subcategoriaPrincipal: sub?.categoria ?? "—",
        ultimaAtencion: ult?.periodo ?? "—",
      };
    });

    /* Tiempos cliente */
    const tiemposCliente = tiemposRaw.map((t) => ({
      cliente: t.cliente, primeraRespuesta: t.primera, resolucion: t.resolucion,
    })).filter((t) => t.resolucion !== null).sort((a, b) => (b.resolucion ?? 0) - (a.resolucion ?? 0));

    /* SLA cliente */
    const slaCliente = slaRaw.map((r) => ({
      cliente: r.cliente, cumple: r.cumple, noCumple: r.noCumple,
      total: r.total, pctCumple: (r.cumple + r.noCumple) > 0 ? Math.round((r.cumple / (r.cumple + r.noCumple)) * 1000) / 10 : 0,
    }));

    /* Consumo */
    const consumo: ConsumoCliente[] = topRaw.map((r) => {
      const t = tiemposRaw.find((x) => x.cliente === r.cliente);
      const cats = catRaw.filter((c) => c.cliente === r.cliente).length;
      const tp = t?.resolucion ?? 0;
      const score = Math.round((r.total * 0.3 + tp * 0.4 + cats * 0.3));
      return {
        cliente: r.cliente, total: r.total, tiempoTotal: Math.round(tp * r.total),
        tiempoPromedio: r.tiempoPromedio, categoriasDistintas: cats, indiceConsumo: score,
      };
    }).sort((a, b) => b.indiceConsumo - a.indiceConsumo);

    /* Complejidad */
    const maxRes = Math.max(...tiemposRaw.map((t) => t.resolucion ?? 0), 1);
    const maxSla = Math.max(...slaRaw.map((s) => s.noCumple), 1);
    const complejidad: ComplejidadCliente[] = topRaw.slice(0, 50).map((r) => {
      const t = tiemposRaw.find((x) => x.cliente === r.cliente);
      const s = slaRaw.find((x) => x.cliente === r.cliente);
      const nCats = catRaw.filter((c) => c.cliente === r.cliente).length;
      const nAses = 0;
      const resol = t?.resolucion ?? 0;
      const incumple = s?.noCumple ?? 0;
      const score = Math.round(((resol / maxRes) * 0.35 + (incumple / maxSla) * 0.35 + Math.min(nCats / 10, 1) * 0.15 + 0.15) * 100);
      const nivel = score >= 80 ? "Crítica" : score >= 60 ? "Alta" : score >= 40 ? "Media" : score >= 20 ? "Baja" : "Muy baja";
      return {
        cliente: r.cliente, score, nivel, tiempoResolucion: resol, incumplimientoSla: incumple,
        categoriasDistintas: nCats, asesoresInvolucrados: nAses,
      };
    }).sort((a, b) => b.score - a.score);

    /* Repetitivas */
    const repetitivas: Repetitiva[] = [];
    for (const r of catRaw) {
      if (r.total >= 3) repetitivas.push({ cliente: r.cliente, categoria: r.categoria, total: r.total });
    }
    repetitivas.sort((a, b) => b.total - a.total);

    /* Diversidad */
    const diversidad = [...new Set(catRaw.map((r) => r.cliente))].map((cl) => ({
      cliente: cl,
      categorias: catRaw.filter((c) => c.cliente === cl).length,
    })).sort((a, b) => b.categorias - a.categorias);

    /* Capacitación */
    const capacitacion: ClienteCapacitacion[] = [];
    for (const r of diversidad) {
      const row = topRaw.find((t) => t.cliente === r.cliente);
      if (row && r.categorias <= 3 && row.total >= 5) {
        const cplx = complejidad.find((c) => c.cliente === r.cliente);
        const score = cplx ? 100 - cplx.score : 50;
        capacitacion.push({
          cliente: r.cliente, total: row.total, score,
          motivo: r.categorias <= 2 ? "Pocas categorías, alta recurrencia" : "Volumen medio, oportunidad de documentación",
        });
      }
    }
    capacitacion.sort((a, b) => b.score - a.score);

    /* Riesgo */
    const maxRiesgo = { total: 1, resol: 1, incumple: 1, cats: 1 };
    const riesgos = topRaw.map((r) => {
      const t = tiemposRaw.find((x) => x.cliente === r.cliente);
      const s = slaRaw.find((x) => x.cliente === r.cliente);
      const nCats = catRaw.filter((c) => c.cliente === r.cliente).length;
      const nReps = repetitivas.filter((x) => x.cliente === r.cliente).length;
      if (r.total > maxRiesgo.total) maxRiesgo.total = r.total;
      if ((t?.resolucion ?? 0) > maxRiesgo.resol) maxRiesgo.resol = t?.resolucion ?? 1;
      if ((s?.noCumple ?? 0) > maxRiesgo.incumple) maxRiesgo.incumple = s?.noCumple ?? 1;
      if (nCats > maxRiesgo.cats) maxRiesgo.cats = nCats;
      return { cliente: r.cliente, total: r.total, resol: t?.resolucion ?? 0, incumple: s?.noCumple ?? 0, cats: nCats, reps: nReps };
    });
    const riesgo: ClienteRiesgo[] = riesgos.map((r) => {
      const score = Math.round(((r.total / maxRiesgo.total) * 0.25 + (r.resol / maxRiesgo.resol) * 0.25 + (r.incumple / maxRiesgo.incumple) * 0.25 + (r.cats / maxRiesgo.cats) * 0.15 + Math.min(r.reps / 5, 1) * 0.1) * 100);
      const nivel = score >= 70 ? "Crítico" : score >= 50 ? "Alto" : score >= 30 ? "Medio" : "Bajo";
      return { cliente: r.cliente, score, nivel, total: r.total, tiempoResolucion: r.resol };
    }).sort((a, b) => b.score - a.score);

    /* Tipo cliente */
    const tipoCliente = await prisma.$queryRaw`
      SELECT COALESCE(NULLIF(TRIM(tipo_cliente), ''), 'Sin tipo') AS tipo,
             COUNT(*)::int AS total,
             ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoResolucion,
             ROUND(AVG(CASE WHEN primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr} THEN 100.0 ELSE 0 END), 1)::float8 AS sla
      FROM public.v_unificado_norm ${whereActual}
      GROUP BY tipo_cliente ORDER BY total DESC
    ` as { tipo: string; total: number; tiempoResolucion: number | null; sla: number }[];

    /* Cliente-Asesor */
    const clienteAsesor = await prisma.$queryRaw`
      SELECT ${CL_COL} AS cliente, ${N_ASESOR_COALESCE} AS asesor, COUNT(*)::int AS total
      FROM public.v_unificado_norm ${whereActual}
      GROUP BY ${CL_COL}, ${N_ASESOR_COALESCE} ORDER BY total DESC
    ` as { cliente: string; asesor: string; total: number }[];

    /* Evolución top 10 clientes */
    const top10Clients = topRaw.slice(0, 10).map((r) => r.cliente);
    const evolucion = evolRaw.filter((e) => top10Clients.includes(e.cliente));

    /* Detalle */
    const detalle = (await prisma.$queryRaw`
      SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha,
             SPLIT_PART(hora::text, ':', 1) || ':' || SPLIT_PART(hora::text, ':', 2) AS hora,
             ${CL_COL} AS cliente,
             ${N_DOMINIO_COALESCE} AS dominio,
             ${N_PAIS} AS pais,
             canal, COALESCE(NULLIF(TRIM(subcanal), ''), '—') AS subcanal,
             ${N_CATEGORIA} AS categoria,
             COALESCE(NULLIF(TRIM(REPLACE(subcategoria, '_', ' ')), ''), '—') AS subcategoria,
             ${N_ASESOR_COALESCE} AS asesor,
             primera_respuesta_min_norm AS "tiempoPrimeraRespuesta",
             resolucion_min_norm AS "tiempoResolucion",
             CASE WHEN primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr} THEN 1 ELSE 0 END AS sla,
             estado_homologado AS estado,
              COALESCE(NULLIF(TRIM(ticket_id::text), ''), NULL) AS ticket
       FROM public.v_unificado_norm ${whereActual}
      ORDER BY fecha DESC, hora DESC LIMIT 500
    `) as DetalleAtencion[];

    /* Top dominios */
    const topDominios = dominiosRaw.map((d) => ({
      dominio: d.dominio, total: d.total,
      porcentaje: totalActual.total > 0 ? Math.round((d.total / totalActual.total) * 1000) / 10 : 0,
      tiempoPromedio: d.tiempoPromedio,
    }));

    /* Insights */
    const insights: string[] = [];
    if (topRaw.length > 0) {
      const top1 = topRaw[0];
      const pct1 = k.unicos > 0 ? Math.round((1 / k.unicos) * 1000) / 10 : 0;
      insights.push(`El cliente "${top1.cliente}" es el mayor consumidor de soporte (${top1.total} atenciones).`);
    }
    const wppPct = distCanal.find((c) => c.canal === "whatsapp")?.porcentaje ?? 0;
    insights.push(`El ${wppPct}% de las atenciones proviene de WhatsApp.`);
    if (k.sinDom > 0) insights.push(`El ${kpis.pctSinDominio}% de los clientes (${k.sinDom}) no tiene dominio asociado.`);
    const top5Sla = [...slaCliente].sort((a, b) => a.pctCumple - b.pctCumple).slice(0, 5);
    if (top5Sla.length > 0) {
      insights.push(`Cinco clientes concentran la mayor cantidad de incumplimientos de SLA: ${top5Sla.map((s) => `"${s.cliente}"`).join(", ")}.`);
    }
    const topReps = repetitivas.slice(0, 3);
    if (topReps.length > 0) {
      insights.push(`Clientes con alta recurrencia: ${topReps.map((r) => `"${r.cliente}" (${r.categoria}: ${r.total})`).join(", ")}.`);
    }
    if (capacitacion.length > 0) {
      insights.push(`Clientes candidatos a capacitación: ${capacitacion.slice(0, 5).map((c) => `"${c.cliente}"`).join(", ")}.`);
    }

    /* Pivot clientesPorCanal */
    const clientesPorCanal: ClienteCanal[] = [...new Set(canalRaw.map((r) => r.cliente))].map((cl) => ({
      cliente: cl,
      whatsapp: canalRaw.filter((r) => r.cliente === cl && r.canal === "whatsapp").reduce((s, r) => s + r.total, 0),
      whaticket: canalRaw.filter((r) => r.cliente === cl && r.canal === "whaticket").reduce((s, r) => s + r.total, 0),
      zendesk: canalRaw.filter((r) => r.cliente === cl && r.canal === "zendesk").reduce((s, r) => s + r.total, 0),
    }));

    return {
      kpis, distCanal, distDominio, topClientes: topClientes.slice(0, 20), ranking,
      clientesPorCanal,
      clientesPorPais: paisRaw as { pais: string; total: number }[],
      matrizClienteCategoria: catRaw as ClienteCategoria[],
      matrizClienteSubcategoria: subRaw as ClienteCategoria[],
      tiemposCliente: tiemposCliente.slice(0, 30),
      slaCliente: slaCliente.filter((s) => s.total > 2),
      evolucion, consumo: consumo.slice(0, 30),
      complejidad: complejidad.slice(0, 30),
      repetitivas: repetitivas.slice(0, 30),
      diversidad: diversidad.slice(0, 30),
      capacitacion: capacitacion.slice(0, 20),
      riesgo: riesgo.slice(0, 30),
      tipoCliente, clienteAsesor, topDominios, detalle, insights,
    };
  },

  async whatsapp(filters: DashboardFilters): Promise<WhatsAppResponse> {
    const WHATSAPP = Prisma.sql`(subcanal IN ('whaticket', 'whatmeta') OR canal ILIKE '%what%')`;
    const whereActual = whereConCanal(construirWhere(filters), WHATSAPP);
    const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
    const SUBC = Prisma.sql`REPLACE(subcanal, '_', ' ')`;

    // Faltante = raw NULL y min 0. Un cero real (raw 0) se conserva.
    const PRIMERA_VALIDA = Prisma.sql`NOT (primera_respuesta IS NULL AND primera_respuesta_min = 0)`;
    const RESOLUCION_VALIDA = Prisma.sql`NOT (resolucion IS NULL AND resolucion_min = 0)`;

    const prev =
      filters.fechaHoraInicio && filters.fechaHoraFin
        ? rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin)
        : null;
    const wherePrev = prev
      ? whereConCanal(
          construirWhere({
            ...filters,
            fechaHoraInicio: `${prev.inicio} 00:00`,
            fechaHoraFin: `${prev.fin} 23:59`,
          }),
          WHATSAPP,
        )
      : null;

    const [
      kpiRaw,
      plataformasRaw,
      evolActualRaw,
      evolAnteriorRaw,
      horasRaw,
      diasRaw,
      excepcionesRaw,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE subcanal ILIKE '%ticket%')::int AS whaticket,
               COUNT(*) FILTER (WHERE subcanal ILIKE '%meta%')::int AS wameta,
               COUNT(*) FILTER (WHERE ${PRIMERA_VALIDA})::int AS primera_n,
               COUNT(*) FILTER (
                 WHERE ${PRIMERA_VALIDA}
                   AND primera_respuesta_min_norm <= ${uPr}
               )::int AS sla_cumple,
               ROUND((AVG(primera_respuesta_min_norm) FILTER (WHERE ${PRIMERA_VALIDA}))::numeric, 1)::float8 AS primera_prom,
               (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE ${PRIMERA_VALIDA}))::float8 AS primera_med,
               (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE ${PRIMERA_VALIDA}))::float8 AS primera_p90,
               COUNT(*) FILTER (WHERE ${RESOLUCION_VALIDA})::int AS resolucion_n,
               ROUND((AVG(resolucion_min_norm) FILTER (WHERE ${RESOLUCION_VALIDA}))::numeric, 1)::float8 AS resolucion_prom,
               (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm)
                 FILTER (WHERE ${RESOLUCION_VALIDA}))::float8 AS resolucion_med,
               (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm)
                 FILTER (WHERE ${RESOLUCION_VALIDA}))::float8 AS resolucion_p90,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS cerradas,
               COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertas,
               COUNT(*) FILTER (WHERE estado_homologado = 'sin_mapear')::int AS sin_estado,
               COUNT(*) FILTER (
                 WHERE estado_homologado NOT IN ('cerrado', 'resuelto', 'abierto', 'sin_mapear')
               )::int AS otros
        FROM public.v_unificado_norm ${whereActual}
      ` as Promise<{
        total: number;
        whaticket: number;
        wameta: number;
        primera_n: number;
        sla_cumple: number;
        primera_prom: number | null;
        primera_med: number | null;
        primera_p90: number | null;
        resolucion_n: number;
        resolucion_prom: number | null;
        resolucion_med: number | null;
        resolucion_p90: number | null;
        cerradas: number;
        abiertas: number;
        sin_estado: number;
        otros: number;
      }[]>,

      prisma.$queryRaw`
        SELECT ${SUBC} AS subcanal,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE ${PRIMERA_VALIDA})::int AS primera_n,
               COUNT(*) FILTER (
                 WHERE ${PRIMERA_VALIDA} AND primera_respuesta_min_norm <= ${uPr}
               )::int AS sla_cumple,
               ROUND((AVG(primera_respuesta_min_norm) FILTER (WHERE ${PRIMERA_VALIDA}))::numeric, 1)::float8 AS primera_prom,
               (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE ${PRIMERA_VALIDA}))::float8 AS primera_med,
               (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE ${PRIMERA_VALIDA}))::float8 AS primera_p90,
               COUNT(*) FILTER (WHERE ${RESOLUCION_VALIDA})::int AS resolucion_n,
               ROUND((AVG(resolucion_min_norm) FILTER (WHERE ${RESOLUCION_VALIDA}))::numeric, 1)::float8 AS resolucion_prom,
               (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm)
                 FILTER (WHERE ${RESOLUCION_VALIDA}))::float8 AS resolucion_med,
               (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm)
                 FILTER (WHERE ${RESOLUCION_VALIDA}))::float8 AS resolucion_p90,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS cerradas,
               COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertas,
               COUNT(*) FILTER (WHERE estado_homologado = 'sin_mapear')::int AS sin_estado,
               COUNT(*) FILTER (
                 WHERE estado_homologado NOT IN ('cerrado', 'resuelto', 'abierto', 'sin_mapear')
               )::int AS otros
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SUBC}
        ORDER BY total DESC
      ` as Promise<{
        subcanal: string;
        total: number;
        primera_n: number;
        sla_cumple: number;
        primera_prom: number | null;
        primera_med: number | null;
        primera_p90: number | null;
        resolucion_n: number;
        resolucion_prom: number | null;
        resolucion_med: number | null;
        resolucion_p90: number | null;
        cerradas: number;
        abiertas: number;
        sin_estado: number;
        otros: number;
      }[]>,

      prisma.$queryRaw`
        SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS periodo, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date
        ORDER BY periodo
      ` as Promise<{ periodo: string; total: number }[]>,

      wherePrev
        ? (prisma.$queryRaw`
            SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS periodo, COUNT(*)::int AS total
            FROM public.v_unificado_norm ${wherePrev}
            GROUP BY fecha::date
            ORDER BY periodo
          ` as Promise<{ periodo: string; total: number }[]>)
        : Promise.resolve([] as { periodo: string; total: number }[]),

      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM hora::time)::int AS hora, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY 1
        ORDER BY 1
      ` as Promise<{ hora: number; total: number }[]>,

      prisma.$queryRaw`
        SELECT EXTRACT(DOW FROM fecha::date)::int AS dia, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY 1
        ORDER BY 1
      ` as Promise<{ dia: number; total: number }[]>,

      prisma.$queryRaw`
        (
          SELECT COALESCE(NULLIF(TRIM(contacto), ''), 'Sin contacto') AS contacto,
                 COALESCE(NULLIF(TRIM(asesor), ''), 'Sin asignar') AS asesor,
                 subcanal,
                 (EXTRACT(EPOCH FROM ((NOW() AT TIME ZONE 'America/Lima') - (fecha::date + hora::time))) / 60.0)::float8 AS tiempo,
                 TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha,
                 'abierto' AS estado,
                 1440 AS umbral,
                 'transcurrido' AS tipo_tiempo
          FROM public.v_unificado_norm
          ${whereActual}
          AND estado_homologado = 'abierto'
          AND (fecha::date + hora::time) < (NOW() AT TIME ZONE 'America/Lima') - interval '24 hours'
        )
        UNION ALL
        (
          SELECT COALESCE(NULLIF(TRIM(contacto), ''), 'Sin contacto') AS contacto,
                 COALESCE(NULLIF(TRIM(asesor), ''), 'Sin asignar') AS asesor,
                 subcanal,
                 resolucion_min_norm::float8 AS tiempo,
                 TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha,
                 CASE WHEN estado_homologado = 'sin_mapear' THEN 'sin_mapear' ELSE 'cerrado' END AS estado,
                 480 AS umbral,
                 'resolucion' AS tipo_tiempo
          FROM public.v_unificado_norm
          ${whereActual}
          AND estado_homologado IN ('cerrado', 'resuelto', 'sin_mapear')
          AND ${RESOLUCION_VALIDA}
          AND resolucion_min_norm > 480
        )
        ORDER BY tiempo DESC
        LIMIT 50
      ` as Promise<{
        contacto: string;
        asesor: string;
        subcanal: string;
        tiempo: number;
        fecha: string;
        estado: string;
        umbral: number;
        tipo_tiempo: string;
      }[]>,
    ]);

    const k = kpiRaw[0]!;
    const total = k.total;

    const completarDiario = (
      rows: { periodo: string; total: number }[],
      desde: string | null,
      hasta: string | null,
    ): { periodo: string; total: number }[] => {
      if (!desde || !hasta) return rows;
      const mapa = new Map(rows.map((r) => [r.periodo, r.total]));
      return generarPeriodosOp(desde, hasta, "diaria").map((periodo) => ({
        periodo,
        total: mapa.get(periodo) ?? 0,
      }));
    };

    const evolActual = completarDiario(
      evolActualRaw,
      filters.fechaHoraInicio?.slice(0, 10) ?? null,
      filters.fechaHoraFin?.slice(0, 10) ?? null,
    );
    const evolAnterior = prev
      ? completarDiario(evolAnteriorRaw, prev.inicio, prev.fin)
      : [];

    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const prevTotal = wherePrev ? evolAnterior.reduce((s, r) => s + r.total, 0) : null;
    const variacionAbs = prevTotal !== null ? total - prevTotal : null;
    const variacionPct =
      prevTotal !== null && prevTotal > 0
        ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10
        : null;

    const kpis: WhatsAppKpis = {
      totalConversaciones: total,
      totalWhaticket: k.whaticket,
      totalWameta: k.wameta,
      pctWhaticket: pct(k.whaticket),
      pctWameta: pct(k.wameta),
      primeraN: k.primera_n,
      primeraCobertura: pct(k.primera_n),
      primeraPromedio: k.primera_prom,
      primeraMediana: k.primera_med,
      primeraP90: k.primera_p90,
      resolucionN: k.resolucion_n,
      resolucionCobertura: pct(k.resolucion_n),
      resolucionPromedio: k.resolucion_prom,
      resolucionMediana: k.resolucion_med,
      resolucionP90: k.resolucion_p90,
      slaPrimeraCumple: k.sla_cumple,
      slaPrimeraEvaluables: k.primera_n,
      slaPrimeraPct:
        k.primera_n > 0 ? Math.round((k.sla_cumple / k.primera_n) * 1000) / 10 : null,
      slaPrimeraUmbral: SLA_MINUTOS.primeraRespuesta.whatsapp,
      cerradas: k.cerradas,
      abiertas: k.abiertas,
      sinEstado: k.sin_estado,
      otros: k.otros,
      totalAnterior: prevTotal,
      variacionAbs,
      variacionPct,
    };

    const plataformaNombre = (subcanal: string) =>
      subcanal.toUpperCase().includes("META") ? "Wameta" : "Whaticket";

    const grand = plataformasRaw.reduce((s, r) => s + r.total, 0);
    const plataformas: WhatsAppPlataforma[] = plataformasRaw.map((r) => ({
      subcanal: r.subcanal,
      nombre: plataformaNombre(r.subcanal),
      total: r.total,
      porcentaje: grand > 0 ? Math.round((r.total / grand) * 1000) / 10 : 0,
      primeraN: r.primera_n,
      primeraCobertura:
        r.total > 0 ? Math.round((r.primera_n / r.total) * 1000) / 10 : 0,
      primeraPromedio: r.primera_prom,
      primeraMediana: r.primera_med,
      primeraP90: r.primera_p90,
      resolucionN: r.resolucion_n,
      resolucionCobertura:
        r.total > 0 ? Math.round((r.resolucion_n / r.total) * 1000) / 10 : 0,
      resolucionPromedio: r.resolucion_prom,
      resolucionMediana: r.resolucion_med,
      resolucionP90: r.resolucion_p90,
      slaCumple: r.sla_cumple,
      slaEvaluables: r.primera_n,
      slaPct:
        r.primera_n > 0 ? Math.round((r.sla_cumple / r.primera_n) * 1000) / 10 : null,
      cerradas: r.cerradas,
      abiertas: r.abiertas,
      sinEstado: r.sin_estado,
      otros: r.otros,
    }));

    const estados: WhatsAppEstado[] = [
      { estado: "cerrado", etiqueta: "Cerradas", total: k.cerradas, pct: pct(k.cerradas) },
      { estado: "abierto", etiqueta: "Abiertas", total: k.abiertas, pct: pct(k.abiertas) },
      {
        estado: "sin_mapear",
        etiqueta: "Sin estado homologado",
        total: k.sin_estado,
        pct: pct(k.sin_estado),
      },
    ];
    if (k.otros > 0) {
      estados.push({
        estado: "otro",
        etiqueta: "Otros estados",
        total: k.otros,
        pct: pct(k.otros),
      });
    }

    const horas = Array.from({ length: 24 }, (_, hora) => ({
      hora,
      total: horasRaw.find((r) => r.hora === hora)?.total ?? 0,
    }));
    const dias = Array.from({ length: 7 }, (_, dia) => ({
      dia,
      total: diasRaw.find((r) => r.dia === dia)?.total ?? 0,
    }));

    const excepciones: WhatsAppExcepcion[] = excepcionesRaw.map((r) => ({
      contacto: r.contacto,
      asesor: r.asesor,
      plataforma: plataformaNombre(r.subcanal),
      tiempo: round1(r.tiempo),
      tipoTiempo: r.tipo_tiempo === "transcurrido" ? "transcurrido" : "resolucion",
      fecha: r.fecha,
      estado:
        r.estado === "abierto"
          ? "Abierta"
          : r.estado === "sin_mapear"
            ? "Sin estado"
            : "Cerrada",
      umbral: r.umbral,
    }));

    const insights: string[] = [];
    if (total > 0) {
      insights.push(
        `WhatsApp registró ${total.toLocaleString("es-PE")} conversaciones: ${kpis.pctWameta}% Wameta y ${kpis.pctWhaticket}% Whaticket.`,
      );
      if (variacionPct !== null && variacionAbs !== null) {
        const dir = variacionPct >= 0 ? "aumentó" : "disminuyó";
        insights.push(
          `La demanda ${dir} ${Math.abs(variacionPct)}% (${variacionAbs > 0 ? "+" : ""}${variacionAbs.toLocaleString("es-PE")}) frente al periodo anterior.`,
        );
      }
      const peakH = [...horas].sort((a, b) => b.total - a.total)[0];
      if (peakH && peakH.total > 0) {
        insights.push(
          `La hora de mayor demanda fue ${String(peakH.hora).padStart(2, "0")}:00, con ${peakH.total.toLocaleString("es-PE")} conversaciones (${pct(peakH.total)}%).`,
        );
      }
      const peakD = [...dias].sort((a, b) => b.total - a.total)[0];
      if (peakD && peakD.total > 0) {
        insights.push(
          `El día de mayor demanda fue ${DIAS_LARGOS[peakD.dia]}, con ${peakD.total.toLocaleString("es-PE")} conversaciones (${pct(peakD.total)}%).`,
        );
      }
      if (k.primera_n > 0 && k.primera_med !== null) {
        insights.push(
          `Primera respuesta: mediana ${round1(k.primera_med)} min y p90 ${
            k.primera_p90 !== null ? round1(k.primera_p90) : "—"
          } min; ${k.primera_n.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")} conversaciones con dato (${kpis.primeraCobertura}%).`,
        );
      }
      if (k.resolucion_n > 0 && k.resolucion_med !== null) {
        insights.push(
          `Resolución: mediana ${round1(k.resolucion_med)} min y p90 ${
            k.resolucion_p90 !== null ? round1(k.resolucion_p90) : "—"
          } min; ${k.resolucion_n.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")} con tiempo válido (${kpis.resolucionCobertura}%).`,
        );
      }
      if (kpis.slaPrimeraPct !== null) {
        insights.push(
          `SLA de primera respuesta ≤15 min: ${kpis.slaPrimeraPct}% (${k.sla_cumple.toLocaleString("es-PE")} de ${k.primera_n.toLocaleString("es-PE")} evaluables).`,
        );
      }
      if (k.abiertas > 0 || k.sin_estado > 0) {
        const partes: string[] = [];
        if (k.abiertas > 0) partes.push(`${k.abiertas} abiertas`);
        if (k.sin_estado > 0) partes.push(`${k.sin_estado} sin estado homologado`);
        insights.push(`Estado: ${partes.join(" y ")}.`);
      }
      if (excepciones.length > 0) {
        insights.push(
          `${excepciones.length} conversaciones superan los umbrales de revisión (abiertas >24 h o cerradas/sin estado >8 h).`,
        );
      }
    }

    return {
      kpis,
      estados,
      plataformas,
      evolucion: {
        actual: evolActual,
        anterior: evolAnterior,
        totalActual: total,
        totalAnterior: prevTotal,
        variacionAbs,
        variacionPct,
      },
      horas,
      dias,
      excepciones,
      insights,
    };
  },

  async zendesk(filters: DashboardFilters): Promise<ZendeskResponse> {
    const ZENDESK = Prisma.sql`(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`;
    const where = whereConCanal(
      construirWhere(filters, { fechaExpr: CREACION_CLIENTE, endExclusive: true }),
      ZENDESK,
    );
    const uPr = SLA_MINUTOS.primeraRespuesta.correo;

    const PRIMERA_VALIDA = Prisma.sql`primera_respuesta_min_norm IS NOT NULL`;
    const RESOLUCION_VALIDA = Prisma.sql`(
      resolucion_min_norm IS NOT NULL
      AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
    )`;

    const prev =
      filters.fechaHoraInicio && filters.fechaHoraFin
        ? rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin)
        : null;
    const wherePrev = prev
      ? whereConCanal(
          construirWhere(
            {
              ...filters,
              fechaHoraInicio: `${prev.inicio} 00:00`,
              fechaHoraFin: `${prev.fin} 23:59`,
            },
            { fechaExpr: CREACION_CLIENTE, endExclusive: true },
          ),
          ZENDESK,
        )
      : null;

    const [
      kpiRaw,
      evolActualRaw,
      evolAnteriorRaw,
      backlogRaw,
      corteRaw,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE estado_homologado = 'cerrado')::int AS cerrados,
               COUNT(*) FILTER (WHERE estado_homologado = 'resuelto')::int AS resueltos,
               COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertos,
               COUNT(*) FILTER (WHERE estado_homologado = 'pendiente')::int AS pendientes,
               COUNT(*) FILTER (WHERE estado_homologado = 'en_espera')::int AS en_espera,
               COUNT(*) FILTER (
                 WHERE estado_homologado NOT IN (
                   'cerrado', 'resuelto', 'abierto', 'pendiente', 'en_espera'
                 )
               )::int AS otros,
               COUNT(*) FILTER (WHERE ${PRIMERA_VALIDA})::int AS primera_n,
               COUNT(*) FILTER (
                 WHERE ${PRIMERA_VALIDA} AND primera_respuesta_min_norm <= ${uPr}
               )::int AS sla_cumple,
               ROUND((AVG(primera_respuesta_min_norm) FILTER (WHERE ${PRIMERA_VALIDA}))::numeric, 1)::float8 AS primera_prom,
               (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE ${PRIMERA_VALIDA}))::float8 AS primera_med,
               (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE ${PRIMERA_VALIDA}))::float8 AS primera_p90,
               COUNT(*) FILTER (WHERE ${RESOLUCION_VALIDA})::int AS resolucion_n,
               COUNT(*) FILTER (
                 WHERE resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL
               )::int AS resolucion_excluidas,
               ROUND((AVG(resolucion_min_norm) FILTER (WHERE ${RESOLUCION_VALIDA}))::numeric, 1)::float8 AS resolucion_prom,
               (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm)
                 FILTER (WHERE ${RESOLUCION_VALIDA}))::float8 AS resolucion_med,
               (PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm)
                 FILTER (WHERE ${RESOLUCION_VALIDA}))::float8 AS resolucion_p90
        FROM public.v_unificado_norm ${where}
      ` as Promise<{
        total: number;
        cerrados: number;
        resueltos: number;
        abiertos: number;
        pendientes: number;
        en_espera: number;
        otros: number;
        primera_n: number;
        sla_cumple: number;
        primera_prom: number | null;
        primera_med: number | null;
        primera_p90: number | null;
        resolucion_n: number;
        resolucion_excluidas: number;
        resolucion_prom: number | null;
        resolucion_med: number | null;
        resolucion_p90: number | null;
      }[]>,

      prisma.$queryRaw`
        SELECT TO_CHAR(${CREACION_CLIENTE}::date, 'YYYY-MM-DD') AS periodo,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY ${CREACION_CLIENTE}::date
        ORDER BY periodo
      ` as Promise<{ periodo: string; total: number }[]>,

      wherePrev
        ? (prisma.$queryRaw`
            SELECT TO_CHAR(${CREACION_CLIENTE}::date, 'YYYY-MM-DD') AS periodo,
                   COUNT(*)::int AS total
            FROM public.v_unificado_norm ${wherePrev}
            GROUP BY ${CREACION_CLIENTE}::date
            ORDER BY periodo
          ` as Promise<{ periodo: string; total: number }[]>)
        : Promise.resolve([] as { periodo: string; total: number }[]),

      prisma.$queryRaw`
        SELECT COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertos,
               COUNT(*) FILTER (WHERE estado_homologado = 'pendiente')::int AS pendientes,
               COUNT(*) FILTER (WHERE estado_homologado = 'en_espera')::int AS en_espera
        FROM public.v_unificado_norm
        WHERE ${ZENDESK}
      ` as Promise<{ abiertos: number; pendientes: number; en_espera: number }[]>,

      prisma.$queryRaw`
        SELECT TO_CHAR(NOW() AT TIME ZONE 'America/Lima', 'YYYY-MM-DD HH24:MI') AS fecha_corte
      ` as Promise<{ fecha_corte: string }[]>,
    ]);

    const k = kpiRaw[0]!;
    const total = k.total;

    const completarDiario = (
      rows: { periodo: string; total: number }[],
      desde: string | null,
      hasta: string | null,
    ): { periodo: string; total: number }[] => {
      if (!desde || !hasta) return rows;
      const mapa = new Map(rows.map((r) => [r.periodo, r.total]));
      return generarPeriodosOp(desde, hasta, "diaria").map((periodo) => ({
        periodo,
        total: mapa.get(periodo) ?? 0,
      }));
    };

    const actual = completarDiario(
      evolActualRaw,
      filters.fechaHoraInicio?.slice(0, 10) ?? null,
      filters.fechaHoraFin?.slice(0, 10) ?? null,
    );
    const anterior = prev ? completarDiario(evolAnteriorRaw, prev.inicio, prev.fin) : [];
    const prevTotal = prev ? anterior.reduce((s, r) => s + r.total, 0) : null;
    const variacionAbs = prevTotal !== null ? total - prevTotal : null;
    const variacionPct =
      prevTotal !== null && prevTotal > 0
        ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10
        : null;

    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
    const kpis: ZendeskKpis = {
      totalTickets: total,
      cerrados: k.cerrados,
      resueltos: k.resueltos,
      abiertos: k.abiertos,
      pendientes: k.pendientes,
      enEspera: k.en_espera,
      otros: k.otros,
      primeraN: k.primera_n,
      primeraCobertura: pct(k.primera_n),
      primeraMediana: k.primera_med,
      primeraP90: k.primera_p90,
      primeraPromedio: k.primera_prom,
      primeraSinDato: total - k.primera_n,
      resolucionN: k.resolucion_n,
      resolucionCobertura: pct(k.resolucion_n),
      resolucionMediana: k.resolucion_med,
      resolucionP90: k.resolucion_p90,
      resolucionPromedio: k.resolucion_prom,
      resolucionExcluidas: k.resolucion_excluidas,
      slaPrimeraCumple: k.sla_cumple,
      slaPrimeraEvaluables: k.primera_n,
      slaPrimeraPct:
        k.primera_n > 0 ? Math.round((k.sla_cumple / k.primera_n) * 1000) / 10 : null,
      slaPrimeraUmbral: uPr,
      totalAnterior: prevTotal,
      variacionAbs,
      variacionPct,
    };

    const estados: ZendeskEstado[] = [
      { estado: "cerrado", etiqueta: "Cerrados", total: k.cerrados, pct: pct(k.cerrados) },
      { estado: "resuelto", etiqueta: "Resueltos", total: k.resueltos, pct: pct(k.resueltos) },
      { estado: "abierto", etiqueta: "Abiertos", total: k.abiertos, pct: pct(k.abiertos) },
      { estado: "pendiente", etiqueta: "Pendientes", total: k.pendientes, pct: pct(k.pendientes) },
      { estado: "en_espera", etiqueta: "En espera", total: k.en_espera, pct: pct(k.en_espera) },
      { estado: "otro", etiqueta: "Otros", total: k.otros, pct: pct(k.otros) },
    ];

    const b = backlogRaw[0] ?? { abiertos: 0, pendientes: 0, en_espera: 0 };
    const backlog: ZendeskBacklog = {
      abiertos: b.abiertos,
      pendientes: b.pendientes,
      enEspera: b.en_espera,
      total: b.abiertos + b.pendientes + b.en_espera,
      fechaCorte: corteRaw[0]?.fecha_corte ?? "",
    };

    const insights: string[] = [];
    if (total > 0) {
      insights.push(
        `Zendesk/Correo recibió ${total.toLocaleString("es-PE")} tickets: ${k.cerrados.toLocaleString("es-PE")} cerrados y ${k.resueltos.toLocaleString("es-PE")} resueltos.`,
      );
      if (variacionPct !== null && variacionAbs !== null) {
        const dir = variacionPct >= 0 ? "aumentó" : "disminuyó";
        insights.push(
          `La demanda ${dir} ${Math.abs(variacionPct)}% (${variacionAbs > 0 ? "+" : ""}${variacionAbs.toLocaleString("es-PE")}) frente al periodo anterior.`,
        );
      }
      if (k.primera_n > 0 && k.primera_med !== null) {
        insights.push(
          `Primera respuesta: mediana ${(Math.round(k.primera_med * 10) / 10).toLocaleString("es-PE")} min y p90 ${k.primera_p90 !== null ? (Math.round(k.primera_p90 * 10) / 10).toLocaleString("es-PE") : "—"} min; ${k.primera_n.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")} con dato (${kpis.primeraCobertura}%).`,
        );
      }
      if (k.resolucion_n > 0 && k.resolucion_med !== null) {
        insights.push(
          `Resolución: mediana ${(Math.round(k.resolucion_med * 10) / 10).toLocaleString("es-PE")} min y p90 ${k.resolucion_p90 !== null ? (Math.round(k.resolucion_p90 * 10) / 10).toLocaleString("es-PE") : "—"} min; ${k.resolucion_n.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")} con tiempo válido (${kpis.resolucionCobertura}%); ${k.resolucion_excluidas} sin tiempo válido.`,
        );
      }
      if (kpis.slaPrimeraPct !== null) {
        insights.push(
          `SLA de primera respuesta ≤${uPr.toLocaleString("es-PE")} min: ${kpis.slaPrimeraPct}% (${k.sla_cumple.toLocaleString("es-PE")} de ${k.primera_n.toLocaleString("es-PE")} evaluables).`,
        );
      }
      insights.push(
        `Backlog al corte ${backlog.fechaCorte}: ${backlog.abiertos} abiertos y ${backlog.pendientes} pendientes.`,
      );
    }

    return {
      kpis,
      estados,
      evolucion: {
        actual,
        anterior,
        totalActual: total,
        totalAnterior: prevTotal,
        variacionAbs,
        variacionPct,
      },
      backlog,
      insights,
    };
  },

  async pais(filters: DashboardFilters): Promise<PaisResponse> {
    const wppCanal = Prisma.sql`canal ILIKE '%what%'`;
    const corrCanal = Prisma.sql`(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`;
    const where = construirWhere(filters);
    const N_PAIS = Prisma.sql`INITCAP(TRANSLATE(REPLACE(TRIM(pais), '_', ' '), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun'))`;

    const filas = (await prisma.$queryRaw`
      SELECT
        ${N_PAIS}                                                                       AS pais,
        /* WhatsApp */
        COUNT(*)    FILTER (WHERE ${wppCanal})::int                                     AS wpp_total,
        COUNT(*)    FILTER (WHERE ${wppCanal} AND estado_homologado != 'cerrado')::int  AS wpp_en_proceso,
        COUNT(*)    FILTER (WHERE ${wppCanal} AND estado_homologado = 'cerrado')::int   AS wpp_cerradas,
        ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${wppCanal})::numeric,1)    AS wpp_avg_espera,
        ROUND(AVG(resolucion_min_norm)        FILTER (WHERE ${wppCanal})::numeric,1)    AS wpp_avg_atencion,
        ROUND((COALESCE(AVG(primera_respuesta_min_norm) FILTER (WHERE ${wppCanal}), 0) + COALESCE(AVG(resolucion_min_norm) FILTER (WHERE ${wppCanal}), 0))::numeric, 1)::float8 AS wpp_avg_total,
        /* WhatsApp SLA Espera (Q1 ≤15 / Q2 16-60 / Q3 61-180 / Q4 181-1440 / Q5 >1440) + totalConDato */
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= 15)::int    AS wpp_sla_esp_1,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 15  AND primera_respuesta_min_norm <= 60)::int           AS wpp_sla_esp_2,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 60  AND primera_respuesta_min_norm <= 180)::int          AS wpp_sla_esp_3,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 180 AND primera_respuesta_min_norm <= 1440)::int         AS wpp_sla_esp_4,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 1440)::int                                              AS wpp_sla_esp_5,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm IS NOT NULL)::int                                          AS wpp_sla_esp_t,
        /* WhatsApp SLA Atención (Q1 ≤20 / Q2 21-40 / Q3 41-60 / Q4 61-120 / Q5 >120) + totalConDato */
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 20)::int     AS wpp_sla_ate_1,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 20  AND resolucion_min_norm <= 40)::int           AS wpp_sla_ate_2,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 40  AND resolucion_min_norm <= 60)::int           AS wpp_sla_ate_3,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 60  AND resolucion_min_norm <= 120)::int          AS wpp_sla_ate_4,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 120)::int                                         AS wpp_sla_ate_5,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm IS NOT NULL)::int                                   AS wpp_sla_ate_t,
        /* Correo */
        COUNT(*)    FILTER (WHERE ${corrCanal})::int                                    AS corr_total,
        COUNT(*)    FILTER (WHERE ${corrCanal} AND estado_homologado != 'cerrado')::int AS corr_en_proceso,
        COUNT(*)    FILTER (WHERE ${corrCanal} AND estado_homologado = 'cerrado')::int  AS corr_cerradas,
        ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${corrCanal})::numeric,1)   AS corr_avg_espera,
        ROUND(AVG(resolucion_min_norm)        FILTER (WHERE ${corrCanal})::numeric,1)   AS corr_avg_atencion,
        ROUND((COALESCE(AVG(primera_respuesta_min_norm) FILTER (WHERE ${corrCanal}), 0) + COALESCE(AVG(resolucion_min_norm) FILTER (WHERE ${corrCanal}), 0))::numeric, 1)::float8 AS corr_avg_total,
        /* Correo SLA Primera Respuesta (Q1 ≤6h / Q2 ≤12h / Q3 ≤24h / Q4 ≤48h / Q5 >48h) */
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= 360)::int   AS corr_sla_pr_1,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 360  AND primera_respuesta_min_norm <= 720)::int        AS corr_sla_pr_2,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 720  AND primera_respuesta_min_norm <= 1440)::int       AS corr_sla_pr_3,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 1440 AND primera_respuesta_min_norm <= 2880)::int       AS corr_sla_pr_4,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 2880)::int                                            AS corr_sla_pr_5,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm IS NOT NULL)::int                                         AS corr_sla_pr_t,
        /* Correo SLA Atención (Q1 ≤6h / Q2 ≤12h / Q3 ≤24h / Q4 ≤48h / Q5 >48h) — basado en SLA existente 1440 min */
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 360)::int   AS corr_sla_ate_1,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 360  AND resolucion_min_norm <= 720)::int        AS corr_sla_ate_2,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 720  AND resolucion_min_norm <= 1440)::int       AS corr_sla_ate_3,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 1440 AND resolucion_min_norm <= 2880)::int       AS corr_sla_ate_4,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 2880)::int                                        AS corr_sla_ate_5,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm IS NOT NULL)::int                                   AS corr_sla_ate_t
      FROM public.v_unificado_norm
      ${where}
      GROUP BY ${N_PAIS}
      ORDER BY wpp_total DESC
    `) as PaisRow[];

    const totales = (await prisma.$queryRaw`
      SELECT
        'TOTAL'                                                                         AS pais,
        COUNT(*)    FILTER (WHERE ${wppCanal})::int                                     AS wpp_total,
        COUNT(*)    FILTER (WHERE ${wppCanal} AND estado_homologado != 'cerrado')::int  AS wpp_en_proceso,
        COUNT(*)    FILTER (WHERE ${wppCanal} AND estado_homologado = 'cerrado')::int   AS wpp_cerradas,
        ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${wppCanal})::numeric,1)    AS wpp_avg_espera,
        ROUND(AVG(resolucion_min_norm)        FILTER (WHERE ${wppCanal})::numeric,1)    AS wpp_avg_atencion,
        ROUND((COALESCE(AVG(primera_respuesta_min_norm) FILTER (WHERE ${wppCanal}), 0) + COALESCE(AVG(resolucion_min_norm) FILTER (WHERE ${wppCanal}), 0))::numeric, 1)::float8 AS wpp_avg_total,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= 15)::int    AS wpp_sla_esp_1,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 15  AND primera_respuesta_min_norm <= 60)::int           AS wpp_sla_esp_2,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 60  AND primera_respuesta_min_norm <= 180)::int          AS wpp_sla_esp_3,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 180 AND primera_respuesta_min_norm <= 1440)::int         AS wpp_sla_esp_4,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 1440)::int                                              AS wpp_sla_esp_5,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm IS NOT NULL)::int                                          AS wpp_sla_esp_t,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 20)::int     AS wpp_sla_ate_1,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 20  AND resolucion_min_norm <= 40)::int           AS wpp_sla_ate_2,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 40  AND resolucion_min_norm <= 60)::int           AS wpp_sla_ate_3,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 60  AND resolucion_min_norm <= 120)::int          AS wpp_sla_ate_4,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 120)::int                                         AS wpp_sla_ate_5,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm IS NOT NULL)::int                                   AS wpp_sla_ate_t,
        COUNT(*)    FILTER (WHERE ${corrCanal})::int                                    AS corr_total,
        COUNT(*)    FILTER (WHERE ${corrCanal} AND estado_homologado != 'cerrado')::int AS corr_en_proceso,
        COUNT(*)    FILTER (WHERE ${corrCanal} AND estado_homologado = 'cerrado')::int  AS corr_cerradas,
        ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${corrCanal})::numeric,1)   AS corr_avg_espera,
        ROUND(AVG(resolucion_min_norm)        FILTER (WHERE ${corrCanal})::numeric,1)   AS corr_avg_atencion,
        ROUND((COALESCE(AVG(primera_respuesta_min_norm) FILTER (WHERE ${corrCanal}), 0) + COALESCE(AVG(resolucion_min_norm) FILTER (WHERE ${corrCanal}), 0))::numeric, 1)::float8 AS corr_avg_total,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= 360)::int   AS corr_sla_pr_1,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 360  AND primera_respuesta_min_norm <= 720)::int        AS corr_sla_pr_2,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 720  AND primera_respuesta_min_norm <= 1440)::int       AS corr_sla_pr_3,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 1440 AND primera_respuesta_min_norm <= 2880)::int       AS corr_sla_pr_4,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 2880)::int                                            AS corr_sla_pr_5,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm IS NOT NULL)::int                                         AS corr_sla_pr_t,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 360)::int   AS corr_sla_ate_1,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 360  AND resolucion_min_norm <= 720)::int        AS corr_sla_ate_2,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 720  AND resolucion_min_norm <= 1440)::int       AS corr_sla_ate_3,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 1440 AND resolucion_min_norm <= 2880)::int       AS corr_sla_ate_4,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 2880)::int                                        AS corr_sla_ate_5,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm IS NOT NULL)::int                                   AS corr_sla_ate_t
      FROM public.v_unificado_norm
      ${where}
    `) as PaisRow[];

    const paisCanal = await prisma.$queryRaw`
      SELECT
        ${N_PAIS} AS pais,
        CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END AS canal,
        INITCAP(TRIM(REPLACE(categoria, '_', ' '))) AS categoria,
        COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${where}
      GROUP BY ${N_PAIS}, canal, categoria
      ORDER BY pais, canal, total DESC
    ` as { pais: string; canal: string; categoria: string; total: number }[];

    const SCAT = SCAT_LABEL;
    const paisCanalSub = await prisma.$queryRaw`
      SELECT
        ${N_PAIS} AS pais,
        CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END AS canal,
        INITCAP(TRIM(REPLACE(categoria, '_', ' '))) AS categoria,
        ${SCAT} AS subcategoria,
        COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${where}
      GROUP BY ${N_PAIS}, canal, categoria, ${SCAT_GROUP}
      ORDER BY pais, canal, categoria, total DESC
    ` as { pais: string; canal: string; categoria: string; subcategoria: string; total: number }[];

    const dominiosPais = await prisma.$queryRaw`
      SELECT
        ${N_PAIS} AS pais,
        ${N_DOMINIO_COALESCE} AS dominio,
        INITCAP(TRIM(REPLACE(categoria, '_', ' '))) AS categoria,
        COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${where}
      GROUP BY 1, ${N_DOMINIO}, 3
    ` as PaisDominioFila[];

    const evolucionRaw = await prisma.$queryRaw`
      SELECT fecha::date AS periodo, ${N_PAIS} AS pais, COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${where}
      GROUP BY fecha::date, ${N_PAIS}
      ORDER BY periodo, total DESC
    ` as { periodo: Date; pais: string; total: number }[];

    const evolucionPais = evolucionRaw.map((r) => ({
      periodo: r.periodo instanceof Date ? r.periodo.toISOString().slice(0, 10) : String(r.periodo),
      pais: r.pais,
      total: r.total,
    }));

    return {
      filas,
      totales: totales[0] ?? filas[0],
      paisCanal,
      paisCanalSub,
      dominiosPais,
      evolucionPais,
    };
  },

  async asesoresMatrix(filters: DashboardFilters): Promise<AsesoresMatrixResponse> {
    const wppCanal = Prisma.sql`canal ILIKE '%what%'`;
    const corrCanal = Prisma.sql`(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`;
    const where = whereConCanal(construirWhere(filters), OFFICIAL_FILTER);
    const ASESOR_COL = Prisma.sql`COALESCE(${N_ASESOR}, 'Sin asesor')`;

    const filas = (await prisma.$queryRaw`
      SELECT
        ${ASESOR_COL}                                                                   AS asesor,
        COUNT(*)    FILTER (WHERE ${wppCanal})::int                                     AS wpp_total,
        COUNT(*)    FILTER (WHERE ${wppCanal} AND estado_homologado != 'cerrado')::int  AS wpp_en_proceso,
        COUNT(*)    FILTER (WHERE ${wppCanal} AND estado_homologado = 'cerrado')::int   AS wpp_cerradas,
        ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${wppCanal})::numeric,1)    AS wpp_avg_espera,
        ROUND(AVG(resolucion_min_norm)        FILTER (WHERE ${wppCanal})::numeric,1)    AS wpp_avg_atencion,
        ROUND((COALESCE(AVG(primera_respuesta_min_norm) FILTER (WHERE ${wppCanal}), 0) + COALESCE(AVG(resolucion_min_norm) FILTER (WHERE ${wppCanal}), 0))::numeric, 1)::float8 AS wpp_avg_total,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= 15)::int    AS wpp_sla_esp_1,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 15  AND primera_respuesta_min_norm <= 60)::int           AS wpp_sla_esp_2,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 60  AND primera_respuesta_min_norm <= 180)::int          AS wpp_sla_esp_3,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 180 AND primera_respuesta_min_norm <= 1440)::int         AS wpp_sla_esp_4,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 1440)::int                                              AS wpp_sla_esp_5,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm IS NOT NULL)::int                                          AS wpp_sla_esp_t,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 20)::int     AS wpp_sla_ate_1,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 20  AND resolucion_min_norm <= 40)::int           AS wpp_sla_ate_2,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 40  AND resolucion_min_norm <= 60)::int           AS wpp_sla_ate_3,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 60  AND resolucion_min_norm <= 120)::int          AS wpp_sla_ate_4,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 120)::int                                         AS wpp_sla_ate_5,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm IS NOT NULL)::int                                   AS wpp_sla_ate_t,
        COUNT(*)    FILTER (WHERE ${corrCanal})::int                                    AS corr_total,
        COUNT(*)    FILTER (WHERE ${corrCanal} AND estado_homologado != 'cerrado')::int AS corr_en_proceso,
        COUNT(*)    FILTER (WHERE ${corrCanal} AND estado_homologado = 'cerrado')::int  AS corr_cerradas,
        ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${corrCanal})::numeric,1)   AS corr_avg_espera,
        ROUND(AVG(resolucion_min_norm)        FILTER (WHERE ${corrCanal})::numeric,1)   AS corr_avg_atencion,
        ROUND((COALESCE(AVG(primera_respuesta_min_norm) FILTER (WHERE ${corrCanal}), 0) + COALESCE(AVG(resolucion_min_norm) FILTER (WHERE ${corrCanal}), 0))::numeric, 1)::float8 AS corr_avg_total,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= 360)::int   AS corr_sla_pr_1,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 360  AND primera_respuesta_min_norm <= 720)::int        AS corr_sla_pr_2,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 720  AND primera_respuesta_min_norm <= 1440)::int       AS corr_sla_pr_3,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 1440 AND primera_respuesta_min_norm <= 2880)::int       AS corr_sla_pr_4,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 2880)::int                                            AS corr_sla_pr_5,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm IS NOT NULL)::int                                         AS corr_sla_pr_t,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 360)::int   AS corr_sla_ate_1,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 360  AND resolucion_min_norm <= 720)::int        AS corr_sla_ate_2,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 720  AND resolucion_min_norm <= 1440)::int       AS corr_sla_ate_3,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 1440 AND resolucion_min_norm <= 2880)::int       AS corr_sla_ate_4,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 2880)::int                                        AS corr_sla_ate_5,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm IS NOT NULL)::int                                   AS corr_sla_ate_t
      FROM public.v_unificado_norm
      ${where}
      GROUP BY ${ASESOR_COL}
      ORDER BY wpp_total DESC
    `) as AsesorRow[];

    const totales = (await prisma.$queryRaw`
      SELECT
        'TOTAL'                                                                         AS asesor,
        COUNT(*)    FILTER (WHERE ${wppCanal})::int                                     AS wpp_total,
        COUNT(*)    FILTER (WHERE ${wppCanal} AND estado_homologado != 'cerrado')::int  AS wpp_en_proceso,
        COUNT(*)    FILTER (WHERE ${wppCanal} AND estado_homologado = 'cerrado')::int   AS wpp_cerradas,
        ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${wppCanal})::numeric,1)    AS wpp_avg_espera,
        ROUND(AVG(resolucion_min_norm)        FILTER (WHERE ${wppCanal})::numeric,1)    AS wpp_avg_atencion,
        ROUND((COALESCE(AVG(primera_respuesta_min_norm) FILTER (WHERE ${wppCanal}), 0) + COALESCE(AVG(resolucion_min_norm) FILTER (WHERE ${wppCanal}), 0))::numeric, 1)::float8 AS wpp_avg_total,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= 15)::int    AS wpp_sla_esp_1,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 15  AND primera_respuesta_min_norm <= 60)::int           AS wpp_sla_esp_2,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 60  AND primera_respuesta_min_norm <= 180)::int          AS wpp_sla_esp_3,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 180 AND primera_respuesta_min_norm <= 1440)::int         AS wpp_sla_esp_4,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm > 1440)::int                                              AS wpp_sla_esp_5,
        COUNT(*) FILTER (WHERE ${wppCanal} AND primera_respuesta_min_norm IS NOT NULL)::int                                          AS wpp_sla_esp_t,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 20)::int     AS wpp_sla_ate_1,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 20  AND resolucion_min_norm <= 40)::int           AS wpp_sla_ate_2,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 40  AND resolucion_min_norm <= 60)::int           AS wpp_sla_ate_3,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 60  AND resolucion_min_norm <= 120)::int          AS wpp_sla_ate_4,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm > 120)::int                                         AS wpp_sla_ate_5,
        COUNT(*) FILTER (WHERE ${wppCanal} AND resolucion_min_norm IS NOT NULL)::int                                   AS wpp_sla_ate_t,
        COUNT(*)    FILTER (WHERE ${corrCanal})::int                                    AS corr_total,
        COUNT(*)    FILTER (WHERE ${corrCanal} AND estado_homologado != 'cerrado')::int AS corr_en_proceso,
        COUNT(*)    FILTER (WHERE ${corrCanal} AND estado_homologado = 'cerrado')::int  AS corr_cerradas,
        ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${corrCanal})::numeric,1)   AS corr_avg_espera,
        ROUND(AVG(resolucion_min_norm)        FILTER (WHERE ${corrCanal})::numeric,1)   AS corr_avg_atencion,
        ROUND((COALESCE(AVG(primera_respuesta_min_norm) FILTER (WHERE ${corrCanal}), 0) + COALESCE(AVG(resolucion_min_norm) FILTER (WHERE ${corrCanal}), 0))::numeric, 1)::float8 AS corr_avg_total,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= 360)::int   AS corr_sla_pr_1,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 360  AND primera_respuesta_min_norm <= 720)::int        AS corr_sla_pr_2,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 720  AND primera_respuesta_min_norm <= 1440)::int       AS corr_sla_pr_3,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 1440 AND primera_respuesta_min_norm <= 2880)::int       AS corr_sla_pr_4,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm > 2880)::int                                            AS corr_sla_pr_5,
        COUNT(*) FILTER (WHERE ${corrCanal} AND primera_respuesta_min_norm IS NOT NULL)::int                                         AS corr_sla_pr_t,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 360)::int   AS corr_sla_ate_1,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 360  AND resolucion_min_norm <= 720)::int        AS corr_sla_ate_2,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 720  AND resolucion_min_norm <= 1440)::int       AS corr_sla_ate_3,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 1440 AND resolucion_min_norm <= 2880)::int       AS corr_sla_ate_4,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm > 2880)::int                                        AS corr_sla_ate_5,
        COUNT(*) FILTER (WHERE ${corrCanal} AND resolucion_min_norm IS NOT NULL)::int                                   AS corr_sla_ate_t
      FROM public.v_unificado_norm
      ${where}
    `) as AsesorRow[];

    return { filas, totales: totales[0] ?? filas[0] };
  },

  async opciones(): Promise<OpcionesFiltro> {
    const PAIS_N = Prisma.sql`INITCAP(TRANSLATE(REPLACE(TRIM(pais), '_', ' '), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun'))`;
    const ASESOR_N = Prisma.sql`TRANSLATE(asesor, 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun')`;
    const SUB_N = SCAT_LABEL;
    const filas = (await prisma.$queryRaw`
      SELECT
        (SELECT array_agg(DISTINCT canal ORDER BY canal) FROM public.v_unificado_norm WHERE canal IS NOT NULL AND canal <> '') AS canal,
        (SELECT array_agg(DISTINCT subcanal ORDER BY subcanal) FROM public.v_unificado_norm WHERE subcanal IS NOT NULL AND subcanal <> '') AS subcanal,
        (SELECT array_agg(DISTINCT ${PAIS_N} ORDER BY ${PAIS_N}) FROM public.v_unificado_norm WHERE pais IS NOT NULL AND pais <> '') AS pais,
        (SELECT array_agg(DISTINCT ${ASESOR_N} ORDER BY ${ASESOR_N}) FROM public.v_unificado_norm WHERE asesor IS NOT NULL AND asesor <> '') AS asesor,
        (SELECT array_agg(DISTINCT categoria ORDER BY categoria) FROM public.v_unificado_norm WHERE categoria IS NOT NULL AND categoria <> '') AS categoria,
        (SELECT array_agg(DISTINCT ${SUB_N} ORDER BY ${SUB_N}) FROM public.v_unificado_norm WHERE subcategoria IS NOT NULL AND subcategoria <> '') AS subcategoria,
        (SELECT array_agg(DISTINCT ${N_DOMINIO_COALESCE} ORDER BY ${N_DOMINIO_COALESCE}) FROM public.v_unificado_norm WHERE dominio IS NOT NULL AND dominio <> '') AS dominio,
        (SELECT array_agg(DISTINCT estado_homologado ORDER BY estado_homologado) FROM public.v_unificado_norm WHERE estado_homologado IS NOT NULL) AS estado,
        (SELECT array_agg(DISTINCT tipo_cliente ORDER BY tipo_cliente) FROM public.v_unificado_norm WHERE tipo_cliente IS NOT NULL AND tipo_cliente <> '') AS tipo_cliente,
        (SELECT array_agg(DISTINCT rango_atencion ORDER BY rango_atencion) FROM public.v_unificado_norm WHERE rango_atencion IS NOT NULL AND rango_atencion <> '') AS rango_atencion
    `) as Record<string, unknown>[];
    const r = filas[0] ?? {};

    const asesoresRaw = arr(r.asesor);
    const asesoresConsolidados = consolidarNombres(
      asesoresRaw.map((n: string) => ({ etiqueta: n, total: 0 })),
    ).map((e) => e.etiqueta);

    return {
      canal: arr(r.canal),
      subcanal: arr(r.subcanal),
      pais: arr(r.pais),
      asesor: asesoresConsolidados,
      categoria: arr(r.categoria),
      subcategoria: arr(r.subcategoria),
      dominio: arr(r.dominio),
      estado: arr(r.estado),
      tipoCliente: arr(r.tipo_cliente),
      rangoAtencion: arr(r.rango_atencion),
    };
  },

  async detalle(filters: DashboardFilters): Promise<DetalleResponse> {
    const whereBase = construirWhere(filters);
    const where =
      filters.universo === "final"
        ? whereConCanal(whereBase, FINALIZADAS)
        : whereBase;
    const pagina = filters.pagina ?? 1;
    const limite = Math.min(filters.limite ?? 20, 100000);
    const offset = (pagina - 1) * limite;

    const A_COL = Prisma.sql`COALESCE(INITCAP(TRANSLATE(SPLIT_PART(asesor, ' ', 1), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun')), 'Sin asesor')`;
    const P_COL = Prisma.sql`COALESCE(INITCAP(TRANSLATE(REPLACE(TRIM(pais), '_', ' '), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun')), 'Sin país')`;
    const C_COL = Prisma.sql`COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría')`;
    const SC_COL = SCAT_LABEL;

    const [countResult] = (await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total FROM public.v_unificado_norm ${where}
    `) as { total: number }[];

    const total = countResult?.total ?? 0;
    const totalPaginas = Math.ceil(total / limite);

    const filas = (await prisma.$queryRaw`
      SELECT
        TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha,
        SPLIT_PART(hora::text, ':', 1) || ':' || SPLIT_PART(hora::text, ':', 2) AS hora,
        canal,
        COALESCE(NULLIF(TRIM(subcanal), ''), '—') AS subcanal,
        COALESCE(NULLIF(TRIM(ticket_id::text), ''), NULL) AS ticket,
        COALESCE(NULLIF(TRIM(contacto), ''), NULL) AS contacto,
        COALESCE(NULLIF(TRIM(numero), ''), NULL) AS "numeroCorreo",
        ${P_COL} AS pais,
        ${A_COL} AS asesor,
        estado_homologado AS estado,
        ${C_COL} AS categoria,
        ${SC_COL} AS subcategoria,
        primera_respuesta_min_norm AS "primeraRespuesta",
        resolucion_min_norm AS resolucion,
        CASE WHEN primera_respuesta_min_norm IS NOT NULL AND resolucion_min_norm IS NOT NULL
          THEN ROUND(((primera_respuesta_min_norm + resolucion_min_norm) / 2)::numeric, 1)::float8
          ELSE COALESCE(primera_respuesta_min_norm, resolucion_min_norm)
        END AS "tiempoPromedio",
        ${N_DOMINIO_COALESCE} AS dominio,
        COALESCE(NULLIF(TRIM(tipo_cliente), ''), NULL) AS "tipoCliente"
      FROM public.v_unificado_norm ${where}
      ORDER BY fecha DESC, hora DESC
      LIMIT ${limite} OFFSET ${offset}
    `) as DetalleFila[];

    return { filas, total, pagina, limite, totalPaginas };
  },

  /** Quejas y Devoluciones — reporte analitico completo */
  async quejasDevoluciones(filters: DashboardFilters): Promise<QuejasDevolucionesResponse> {
    const NORM = Prisma.sql`cope_scat_normalizada(subcategoria)`;
    const TIPO = Prisma.sql`CASE WHEN ${NORM} = 'queja' THEN 'queja' ELSE 'devolucion' END`;
    const FILTRO = Prisma.sql`${N_CATEGORIA} = 'GESTION' AND ${NORM} IN ('queja', 'solicitud de devolucion')`;
    const whereActual = whereConCanal(
      construirWhere(filters, { fechaExpr: CREACION_CLIENTE, endExclusive: true }),
      FILTRO,
    );

    const prev =
      filters.fechaHoraInicio && filters.fechaHoraFin
        ? rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin)
        : null;
    const wherePrev = prev
      ? whereConCanal(
          construirWhere(
            {
              ...filters,
              fechaHoraInicio: `${prev.inicio} 00:00`,
              fechaHoraFin: `${prev.fin} 23:59`,
            },
            { fechaExpr: CREACION_CLIENTE, endExclusive: true },
          ),
          FILTRO,
        )
      : null;

    const [
      totalesRaw,
      estadosRaw,
      canalesRaw,
      asesoresRaw,
      tiemposRaw,
      evolActualRaw,
      evolAnteriorRaw,
      prevTotalRaw,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE ${TIPO} = 'queja')::int AS quejas,
               COUNT(*) FILTER (WHERE ${TIPO} = 'devolucion')::int AS devoluciones,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS primera_n,
               COUNT(*) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
               )::int AS resolucion_n,
               COUNT(*) FILTER (
                 WHERE resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL
               )::int AS resolucion_excluidas,
               ROUND((AVG(primera_respuesta_min_norm)
                 FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_prom,
               ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_med,
               ROUND((PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_p90,
               ROUND((AVG(resolucion_min_norm) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
               ))::numeric, 1)::float8 AS resolucion_prom,
               ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
               ))::numeric, 1)::float8 AS resolucion_med,
               ROUND((PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
               ))::numeric, 1)::float8 AS resolucion_p90
        FROM public.v_unificado_norm ${whereActual}
      ` as Promise<{
        total: number;
        quejas: number;
        devoluciones: number;
        primera_n: number;
        resolucion_n: number;
        resolucion_excluidas: number;
        primera_prom: number | null;
        primera_med: number | null;
        primera_p90: number | null;
        resolucion_prom: number | null;
        resolucion_med: number | null;
        resolucion_p90: number | null;
      }[]>,

      prisma.$queryRaw`
        SELECT COALESCE(estado_homologado, 'otros') AS estado, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY 1
      ` as Promise<{ estado: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END AS canal,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE ${TIPO} = 'queja')::int AS quejas,
               COUNT(*) FILTER (WHERE ${TIPO} = 'devolucion')::int AS devoluciones
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY 1
      ` as Promise<{ canal: string; total: number; quejas: number; devoluciones: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_ASESOR_COALESCE} AS asesor,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE ${TIPO} = 'queja')::int AS quejas,
               COUNT(*) FILTER (WHERE ${TIPO} = 'devolucion')::int AS devoluciones
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${N_ASESOR_COALESCE}
        ORDER BY total DESC
      ` as Promise<{ asesor: string; total: number; quejas: number; devoluciones: number }[]>,

      prisma.$queryRaw`
        SELECT ${TIPO} AS tipo,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS primera_n,
               ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_med,
               ROUND((PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY primera_respuesta_min_norm)
                 FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_p90,
               ROUND((AVG(primera_respuesta_min_norm)
                 FILTER (WHERE primera_respuesta_min_norm IS NOT NULL))::numeric, 1)::float8 AS primera_prom,
               COUNT(*) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
               )::int AS resolucion_n,
               ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolucion_min_norm) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
               ))::numeric, 1)::float8 AS resolucion_med,
               ROUND((PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY resolucion_min_norm) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
               ))::numeric, 1)::float8 AS resolucion_p90,
               ROUND((AVG(resolucion_min_norm) FILTER (
                 WHERE resolucion_min_norm IS NOT NULL
                   AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
               ))::numeric, 1)::float8 AS resolucion_prom
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${TIPO}
      ` as Promise<{
        tipo: string;
        total: number;
        primera_n: number;
        primera_med: number | null;
        primera_p90: number | null;
        primera_prom: number | null;
        resolucion_n: number;
        resolucion_med: number | null;
        resolucion_p90: number | null;
        resolucion_prom: number | null;
      }[]>,

      prisma.$queryRaw`
        SELECT TO_CHAR(${CREACION_CLIENTE}::date, 'YYYY-MM-DD') AS periodo,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE ${TIPO} = 'queja')::int AS quejas,
               COUNT(*) FILTER (WHERE ${TIPO} = 'devolucion')::int AS devoluciones
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CREACION_CLIENTE}::date
        ORDER BY periodo
      ` as Promise<{ periodo: string; total: number; quejas: number; devoluciones: number }[]>,

      wherePrev
        ? (prisma.$queryRaw`
            SELECT TO_CHAR(${CREACION_CLIENTE}::date, 'YYYY-MM-DD') AS periodo,
                   COUNT(*)::int AS total,
                   COUNT(*) FILTER (WHERE ${TIPO} = 'queja')::int AS quejas,
                   COUNT(*) FILTER (WHERE ${TIPO} = 'devolucion')::int AS devoluciones
            FROM public.v_unificado_norm ${wherePrev}
            GROUP BY ${CREACION_CLIENTE}::date
            ORDER BY periodo
          ` as Promise<{ periodo: string; total: number; quejas: number; devoluciones: number }[]>)
        : Promise.resolve([] as { periodo: string; total: number; quejas: number; devoluciones: number }[]),

      wherePrev
        ? (prisma.$queryRaw`
            SELECT COUNT(*)::int AS total FROM public.v_unificado_norm ${wherePrev}
          ` as Promise<{ total: number }[]>)
        : Promise.resolve([] as { total: number }[]),
    ]);

    const t = totalesRaw[0]!;
    const total = t.total;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

    const completar = (
      rows: { periodo: string; total: number; quejas: number; devoluciones: number }[],
      desde: string | null,
      hasta: string | null,
    ): { periodo: string; total: number; quejas: number; devoluciones: number }[] => {
      if (!desde || !hasta) return rows;
      const mapa = new Map(rows.map((r) => [r.periodo, r]));
      return generarPeriodosOp(desde, hasta, "diaria").map(
        (periodo) => mapa.get(periodo) ?? { periodo, total: 0, quejas: 0, devoluciones: 0 },
      );
    };

    const actual = completar(
      evolActualRaw,
      filters.fechaHoraInicio?.slice(0, 10) ?? null,
      filters.fechaHoraFin?.slice(0, 10) ?? null,
    );
    const anterior = prev ? completar(evolAnteriorRaw, prev.inicio, prev.fin) : [];
    const prevTotal = prev ? (prevTotalRaw[0]?.total ?? 0) : null;
    const variacionAbs = prevTotal !== null ? total - prevTotal : null;
    const variacionPct =
      prevTotal !== null && prevTotal > 0
        ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10
        : null;

    const kpis: QuejasDevolucionesResponse["kpis"] = {
      totalCasos: total,
      quejas: t.quejas,
      devoluciones: t.devoluciones,
      pctQuejas: pct(t.quejas),
      totalAnterior: prevTotal,
      variacionAbs,
      variacionPct,
      primeraN: t.primera_n,
      primeraCobertura: pct(t.primera_n),
      primeraMediana: t.primera_med,
      primeraP90: t.primera_p90,
      primeraPromedio: t.primera_prom,
      primeraSinDato: total - t.primera_n,
      resolucionN: t.resolucion_n,
      resolucionCobertura: pct(t.resolucion_n),
      resolucionMediana: t.resolucion_med,
      resolucionP90: t.resolucion_p90,
      resolucionPromedio: t.resolucion_prom,
      resolucionExcluidas: t.resolucion_excluidas,
    };

    const estadosBase: { estado: string; etiqueta: string }[] = [
      { estado: "cerrado", etiqueta: "Cerrados" },
      { estado: "resuelto", etiqueta: "Resueltos" },
      { estado: "abierto", etiqueta: "Abiertos" },
      { estado: "pendiente", etiqueta: "Pendientes" },
      { estado: "en_espera", etiqueta: "En espera" },
      { estado: "sin_mapear", etiqueta: "Sin mapear" },
    ];
    const estadoMap = new Map(estadosRaw.map((r) => [r.estado, r.total]));
    const conocidos = new Set(estadosBase.map((e) => e.estado));
    const otros = estadosRaw
      .filter((r) => !conocidos.has(r.estado))
      .reduce((s, r) => s + r.total, 0);
    const estados = [
      ...estadosBase.map((e) => ({
        ...e,
        total: estadoMap.get(e.estado) ?? 0,
        pct: pct(estadoMap.get(e.estado) ?? 0),
      })),
      { estado: "otros", etiqueta: "Otros", total: otros, pct: pct(otros) },
    ];

    const tipoMap = new Map(
      [
        ["queja", { etiqueta: "Quejas", total: t.quejas }],
        ["devolucion", { etiqueta: "Devoluciones", total: t.devoluciones }],
      ] as const,
    );
    const tipos: QuejasDevolucionesResponse["tipos"] = (
      ["queja", "devolucion"] as const
    ).map((tipo) => {
      const row = tipoMap.get(tipo)!;
      return { tipo, etiqueta: row.etiqueta, total: row.total, pct: pct(row.total) };
    });

    const canalMap = new Map(canalesRaw.map((r) => [r.canal, r]));
    const canales: QuejasDevolucionesResponse["canales"] = ["WhatsApp", "Correo"].map(
      (canal) => {
        const r = canalMap.get(canal);
        return {
          canal,
          quejas: r?.quejas ?? 0,
          devoluciones: r?.devoluciones ?? 0,
          total: r?.total ?? 0,
          pct: pct(r?.total ?? 0),
        };
      },
    );

    const tiempoMap = new Map(tiemposRaw.map((r) => [r.tipo, r]));
    const tiemposPorTipo: QuejasDevolucionesResponse["tiemposPorTipo"] = (
      ["queja", "devolucion"] as const
    ).map((tipo) => {
      const r = tiempoMap.get(tipo);
      return {
        tipo,
        etiqueta: tipo === "queja" ? "Quejas" : "Devoluciones",
        total: r?.total ?? 0,
        primeraN: r?.primera_n ?? 0,
        primeraMediana: r?.primera_med ?? null,
        primeraP90: r?.primera_p90 ?? null,
        primeraPromedio: r?.primera_prom ?? null,
        resolucionN: r?.resolucion_n ?? 0,
        resolucionMediana: r?.resolucion_med ?? null,
        resolucionP90: r?.resolucion_p90 ?? null,
        resolucionPromedio: r?.resolucion_prom ?? null,
      };
    });

    const asesores: QuejasDevolucionesResponse["asesores"] = asesoresRaw.map((r) => ({
      asesor: r.asesor,
      quejas: r.quejas,
      devoluciones: r.devoluciones,
      total: r.total,
      pct: pct(r.total),
    }));

    const insights: string[] = [];
    if (total > 0) {
      insights.push(
        `Quejas y Devoluciones registró ${total.toLocaleString("es-PE")} casos: ${t.quejas.toLocaleString("es-PE")} quejas (${kpis.pctQuejas}%) y ${t.devoluciones.toLocaleString("es-PE")} devoluciones.`,
      );
      if (variacionPct !== null && variacionAbs !== null) {
        const dir = variacionPct >= 0 ? "aumentó" : "disminuyó";
        insights.push(
          `El volumen ${dir} ${Math.abs(variacionPct)}% (${variacionAbs > 0 ? "+" : ""}${variacionAbs.toLocaleString("es-PE")}) frente al periodo anterior.`,
        );
      }
      const topCanal = [...canales].sort((a, b) => b.total - a.total)[0];
      if (topCanal && topCanal.total > 0) {
        insights.push(
          `${topCanal.canal} concentra ${topCanal.total.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")} casos (${topCanal.pct}%).`,
        );
      }
      if (t.primera_n > 0 && t.primera_med !== null) {
        insights.push(
          `Primera respuesta: mediana ${(Math.round(t.primera_med * 10) / 10).toLocaleString("es-PE")} min y p90 ${t.primera_p90 !== null ? (Math.round(t.primera_p90 * 10) / 10).toLocaleString("es-PE") : "—"} min; ${t.primera_n.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")} con dato (${kpis.primeraCobertura}%).`,
        );
      }
      if (t.resolucion_n > 0 && t.resolucion_med !== null) {
        insights.push(
          `Resolución: mediana ${(Math.round(t.resolucion_med * 10) / 10).toLocaleString("es-PE")} min y p90 ${t.resolucion_p90 !== null ? (Math.round(t.resolucion_p90 * 10) / 10).toLocaleString("es-PE") : "—"} min; ${t.resolucion_n.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")} con tiempo válido (${kpis.resolucionCobertura}%); ${t.resolucion_excluidas} sin tiempo válido.`,
        );
      }
      const topAsesor = [...asesores].sort((a, b) => b.total - a.total)[0];
      if (topAsesor && topAsesor.total > 0) {
        insights.push(
          `${topAsesor.asesor} concentra ${topAsesor.total.toLocaleString("es-PE")} casos (${topAsesor.pct}%).`,
        );
      }
    } else {
      insights.push("No se registraron casos de quejas o devoluciones en el periodo seleccionado.");
    }

    return {
      kpis,
      estados,
      tipos,
      canales,
      tiemposPorTipo,
      asesores,
      evolucion: {
        actual,
        anterior,
        totalActual: total,
        totalAnterior: prevTotal,
        variacionAbs,
        variacionPct,
      },
      insights,
    };
  },
};
