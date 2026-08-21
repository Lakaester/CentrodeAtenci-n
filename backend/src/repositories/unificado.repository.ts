/**
 * Repositorio: UNICO lugar que toca la base. Lee v_unificado_norm.
 * Aplica filtros dinámicos, comparación contra el período anterior,
 * y expone las opciones para los desplegables de filtros.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { DashboardFilters, PaisRow, PaisResponse, AsesorRow, AsesoresMatrixResponse, DetalleFila, DetalleResponse, CategoriasV2Response, QuejasDevolucionesResponse } from "../types";
import { construirWhere, rangoAnterior, comparar, KpiComparado } from "../utils/filtros";

/** Expresiones SQL de normalización (homologación de nombres en toda la app). */
const N_PAIS = Prisma.sql`INITCAP(TRANSLATE(REPLACE(TRIM(pais), '_', ' '), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun'))`;
const N_ASESOR = Prisma.sql`INITCAP(TRANSLATE(SPLIT_PART(REPLACE(asesor, '_', ' '), ' ', 1), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun'))`;
const N_SUBCATEGORIA = Prisma.sql`REPLACE(subcategoria, '_', ' ')`;
const N_CATEGORIA = Prisma.sql`COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría')`;
const N_ASESOR_COALESCE = Prisma.sql`COALESCE(${N_ASESOR}, 'Sin asesor')`;
const OFFICIAL_FILTER = Prisma.sql`${N_ASESOR} = ANY(ARRAY['Andres','Danilo','Eveling','Lidia','Lisbeth','Sheyla','Victor']::text[])`;

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
    total: KpiComparado;
    cerrados: KpiComparado;
    resueltos: KpiComparado;
    cumplimientos: KpiComparado;
    cumplimientoSlaPct: KpiComparado;
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
const SLA_MINUTOS = {
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
    horaPico: string | null;
    horaPicoValor: number | null;
    diaCargado: string | null;
    diaCargadoValor: number | null;
    promedioPorDia: KpiComparado;
    total: KpiComparado;
  };
  heatmap: { hora: number; dia: number; total: number }[];
  curvaHora: { hora: number; total: number }[];
  cargaDiaSemana: { dia: number; etiqueta: string; total: number }[];
  tendenciaDiaria: { fecha: string; total: number }[];
  topAsesores: Desglose[];
  topCategorias: Desglose[];
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
  totalWhaticket: number; totalWhatmeta: number;
  pctWhaticket: number; pctWhatmeta: number;
  tiempoPrimeraRespuesta: number | null;
  tiempoResolucion: number | null;
  tiempoEspera: number | null;
  conversacionesAbiertas: number;
  conversacionesCerradas: number;
  cumplimientoSla: number | null;
  fcr: number | null;
  tiempoPromedioAsesor: number | null;
}
export interface ConversacionLarga {
  cliente: string; asesor: string; subcanal: string;
  tiempoResolucion: number | null; fecha: string;
}
export interface WhatsAppResponse {
  kpis: WhatsAppKpis;
  distSubcanal: { subcanal: string; total: number; porcentaje: number; primeraRespuesta: number | null; resolucion: number | null; espera: number | null; sla: number | null; fcr: number | null }[];
  evolucion: { periodo: string; subcanal: string; total: number }[];
  heatmapHora: { hora: number; dia: number; total: number; subcanal: string }[];
  paises: { pais: string; total: number }[];
  treemap: { categoria: string; total: number; tiempoResolucion: number | null }[];
  topSubcategorias: { subcategoria: string; total: number; porcentaje: number }[];
  tiempos: { subcanal: string; primeraRespuesta: number | null; resolucion: number | null; espera: number | null }[];
  asesores: { asesor: string; subcanal: string; total: number; tiempoPromedio: number | null; sla: number | null; fcr: number | null; abiertos: number; pendientes: number }[];
  topClientes: { cliente: string; total: number }[];
  dominios: { dominio: string; total: number }[];
  conversacionesLargas: ConversacionLarga[];
  paisCat: { pais: string; categoria: string; total: number }[];
  catAsesor: { categoria: string; asesor: string; total: number; tiempo: number | null; sla: number | null }[];
  insights: string[];
}

/* ------------------------------------------------------------------ */
/*  ZENDESK                                                           */
/* ------------------------------------------------------------------ */
export interface ZendeskKpis {
  totalTickets: number; ticketsAbiertos: number; ticketsCerrados: number;
  ticketsPendientes: number; tiempoPrimeraRespuesta: number | null;
  tiempoResolucion: number | null; slaPrimeraRespuesta: number | null;
  slaResolucion: number | null; fcr: number | null;
  tiempoPromedioTicket: number | null;
}
export interface TicketAntiguo {
  ticket: string | null; cliente: string; categoria: string; asesor: string;
  fecha: string; horasTranscurridas: number;
}
export interface ZendeskResponse {
  kpis: ZendeskKpis;
  evolucion: { periodo: string; total: number; abiertos: number; cerrados: number }[];
  backlog: { periodo: string; abiertos: number }[];
  estados: { estado: string; total: number; porcentaje: number }[];
  treemap: { categoria: string; total: number; tiempoResolucion: number | null }[];
  topSubcategorias: { subcategoria: string; total: number; porcentaje: number }[];
  asesores: { asesor: string; total: number; tiempoPromedio: number | null; sla: number | null; fcr: number | null }[];
  paises: { pais: string; total: number }[];
  dominios: { dominio: string; total: number }[];
  clientes: { cliente: string; total: number }[];
  slaCategoria: { categoria: string; cumple: number; noCumple: number; total: number; pctCumple: number }[];
  tiemposCategoria: { categoria: string; primeraRespuesta: number | null; resolucion: number | null }[];
  tiemposSubcategoria: { subcategoria: string; primeraRespuesta: number | null; resolucion: number | null }[];
  tiemposAsesor: { asesor: string; primeraRespuesta: number | null; resolucion: number | null }[];
  ticketsAntiguos: { grupo: string; tickets: TicketAntiguo[] };
  incumplimientos: { categoria: string; total: number; pctIncumplimiento: number }[];
  categoriasCriticas: { categoria: string; total: number; tiempoResolucion: number | null; incumplimientoSla: number | null }[];
  tendencia: { periodo: string; actual: number; anterior: number }[];
  insights: string[];
}

/* ------------------------------------------------------------------ */
/*  TENDENCIAS                                                        */
/* ------------------------------------------------------------------ */
export interface TendenciasKpi {
  variacionVolumen: number | null;
  variacionTiempoPrimera: number | null;
  variacionTiempoResolucion: number | null;
  variacionSla: number | null;
  variacionFcr: number | null;
  variacionClientesUnicos: number | null;
}
export interface Alerta {
  tipo: string; mensaje: string; severidad: "alto" | "medio" | "bajo";
}
export interface TendenciasResponse {
  kpis: TendenciasKpi;
  evolucionVolumen: { periodo: string; total: number }[];
  evolucionCanal: { periodo: string; canal: string; total: number }[];
  evolucionSubcanal: { periodo: string; subcanal: string; total: number }[];
  evolucionCategoria: { periodo: string; categoria: string; total: number }[];
  evolucionSubcategoria: { periodo: string; subcategoria: string; total: number }[];
  evolucionAsesor: { periodo: string; asesor: string; total: number }[];
  evolucionPais: { periodo: string; pais: string; total: number }[];
  evolucionDominio: { dominio: string; periodo: string; total: number }[];
  evolucionCliente: { periodo: string; cliente: string; total: number }[];
  tendenciaSla: { periodo: string; pctCumple: number | null }[];
  tendenciaTiempos: { periodo: string; primeraRespuesta: number | null; resolucion: number | null; espera: number | null }[];
  tendenciaQuintiles: { periodo: string; quintil: number; promedio: number | null }[];
  estacionalidad: { hora: number; dia: number; total: number }[];
  estacionalidadMes: { mes: number; dia: number; total: number }[];
  alertas: Alerta[];
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
async function desgloseTop(where: Prisma.Sql, col: Prisma.Sql, limite: number): Promise<Desglose[]> {
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
}

/**
 * Ranking de asesores con puntaje de performance.
 * Trae conteo, tiempos promedio y cumplimiento SLA por asesor; luego
 * normaliza cada métrica contra el resto del equipo y arma un score 0-100.
 */
async function rankingAsesores(where: Prisma.Sql): Promise<RankingAsesor[]> {
  const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
  const raw = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      COALESCE(${N_ASESOR}, 'Sin asesor')                                  AS asesor,
      COUNT(*)::int                                                        AS total,
      ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8           AS prom_primera,
      ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8                  AS prom_resolucion,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int  AS pr_con_dato,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL
                        AND primera_respuesta_min_norm <= ${uPr})::int     AS pr_dentro
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
    consumido.add(i);
    for (let j = 0; j < raw.length; j++) {
      if (i === j || consumido.has(j)) continue;
      if (raw[i].asesor.includes(raw[j].asesor)) {
        total += raw[j].total;
        if (raw[j].prom_primera !== null) {
          promPri = promPri !== null ? (promPri + raw[j].prom_primera) / 2 : raw[j].prom_primera;
        }
        if (raw[j].prom_resolucion !== null) {
          promRes = promRes !== null ? (promRes + raw[j].prom_resolucion) / 2 : raw[j].prom_resolucion;
        }
        prCon += raw[j].pr_con_dato;
        prDentro += raw[j].pr_dentro;
        consumido.add(j);
      }
    }
    filas.push({ asesor: raw[i].asesor, total, prom_primera: promPri, prom_resolucion: promRes, pr_con_dato: prCon, pr_dentro: prDentro });
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
      score,
    };
  });

  ranking.sort((a, b) => b.score - a.score);
  return ranking.slice(0, 3); // oro, plata, bronce
}

/** Promedios de 1ª respuesta y resolución, separados por canal. */
async function tiemposPorCanal(where: Prisma.Sql): Promise<TiempoCanal[]> {
  return (await prisma.$queryRaw(Prisma.sql`
    SELECT
      COALESCE(canal, 'Sin canal')                                AS etiqueta,
      COUNT(*)::int                                               AS total,
      ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8  AS "promPrimera",
      ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8         AS "promResolucion"
    FROM public.v_unificado_norm
    ${where}
    GROUP BY canal
    ORDER BY total DESC
  `)) as TiempoCanal[];
}

const arr = (x: unknown): string[] => (Array.isArray(x) ? (x as string[]) : []);

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
    const whereActual = construirWhere(filters);
    const actual = await totales(whereActual);
    const slaActual = await slaTotales(whereActual);

    const pct = (dentro: number, con: number) =>
      con > 0 ? Math.round((dentro / con) * 1000) / 10 : null;

    let anterior: FilaTotales | null = null;
    let slaAnterior: SlaTotales | null = null;
    let rango: ResumenResponse["rango"] = null;
    if (filters.fechaHoraInicio && filters.fechaHoraFin) {
      const prev = rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin);
      const wherePrev = construirWhere({ ...filters, fechaHoraInicio: prev.inicio, fechaHoraFin: prev.fin });
      anterior = await totales(wherePrev);
      slaAnterior = await slaTotales(wherePrev);
      rango = { inicio: filters.fechaHoraInicio, fin: filters.fechaHoraFin, comparadoCon: prev };
    }

    const porCanal = await desglose(whereActual, Prisma.sql`canal`);
    const porSubcanal = await desglose(whereActual, Prisma.sql`subcanal`);
    const porEstado = await desglose(whereActual, Prisma.sql`estado_homologado`);
    const porPais = await desglose(whereActual, N_PAIS);
    const porAsesor = await desglose(whereActual, N_ASESOR);
    const topAsesores = await rankingAsesores(whereActual);
    const topCategorias = await desgloseTop(whereActual, Prisma.sql`categoria`, 10);
    const topSubcategorias = await desgloseTop(whereActual, SCAT_LABEL);
    const tiempos = await tiemposPorCanal(whereActual);

    return {
      rango,
      kpis: {
        total: comparar(actual.total, anterior?.total ?? null),
        cerrados: comparar(actual.cerrados, anterior?.cerrados ?? null),
        resueltos: comparar(actual.resueltos, anterior?.resueltos ?? null),
        cumplimientos: comparar(slaActual.pr_dentro, slaAnterior?.pr_dentro ?? null),
        cumplimientoSlaPct: comparar(
          pct(slaActual.pr_dentro, slaActual.pr_con_dato),
          slaAnterior ? pct(slaAnterior.pr_dentro, slaAnterior.pr_con_dato) : null,
        ),
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
    const whereActual = construirWhere(filters);
    const totalActual = await totales(whereActual);

    const HORA = Prisma.sql`SPLIT_PART(hora::text, ':', 1)::int`;

    const filaHoraPico = await prisma.$queryRaw`
      SELECT ${HORA} AS hora_num, COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${whereActual}
      GROUP BY ${HORA}
      ORDER BY total DESC
      LIMIT 1
    ` as { hora_num: number; total: number }[];

    const filaDiaCargado = await prisma.$queryRaw`
      SELECT TO_CHAR(fecha::date, 'Day') AS dia_nombre,
             COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${whereActual}
      GROUP BY TO_CHAR(fecha::date, 'Day')
      ORDER BY total DESC
      LIMIT 1
    ` as { dia_nombre: string; total: number }[];

    const filaPromDia = await prisma.$queryRaw`
      SELECT ROUND(COUNT(*)::numeric / GREATEST(COUNT(DISTINCT fecha::date), 1), 1)::float8 AS promedio
      FROM public.v_unificado_norm
      ${whereActual}
    ` as { promedio: number }[];

    const heatmap = await prisma.$queryRaw`
      SELECT ${HORA} AS hora,
             EXTRACT(DOW FROM fecha::date)::int AS dia,
             COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${whereActual}
      GROUP BY ${HORA}, EXTRACT(DOW FROM fecha::date)
      ORDER BY dia, hora
    ` as { hora: number; dia: number; total: number }[];

    const curvaHora = await prisma.$queryRaw`
      SELECT ${HORA} AS hora, COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${whereActual}
      GROUP BY ${HORA}
      ORDER BY hora
    ` as { hora: number; total: number }[];

    const cargaDiaSemana = await prisma.$queryRaw`
      SELECT EXTRACT(DOW FROM fecha::date)::int AS dia,
             TO_CHAR(fecha::date, 'Day') AS etiqueta,
             COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${whereActual}
      GROUP BY EXTRACT(DOW FROM fecha::date), TO_CHAR(fecha::date, 'Day')
      ORDER BY dia
    ` as { dia: number; etiqueta: string; total: number }[];

    const tendenciaDiaria = await prisma.$queryRaw`
      SELECT fecha::date AS fecha, COUNT(*)::int AS total
      FROM public.v_unificado_norm
      ${whereActual}
      GROUP BY fecha::date
      ORDER BY fecha
    ` as { fecha: Date; total: number }[];

    let topAsesores = await desgloseTop(whereActual, N_ASESOR, 20);
    topAsesores = consolidarNombres(topAsesores).slice(0, 10);
    const topCategorias = await desgloseTop(whereActual, Prisma.sql`categoria`, 10);

    let rango: OperacionResponse["rango"] = null;
    let anteriorTotal: number | null = null;
    let anteriorPromedio: number | null = null;

    if (filters.fechaHoraInicio && filters.fechaHoraFin) {
      const prev = rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin);
      const wherePrev = construirWhere({ ...filters, fechaHoraInicio: prev.inicio, fechaHoraFin: prev.fin });
      const totalPrev = await totales(wherePrev);
      anteriorTotal = totalPrev.total;

      const promPrev = await prisma.$queryRaw`
        SELECT ROUND(COUNT(*)::numeric / GREATEST(COUNT(DISTINCT fecha::date), 1), 1)::float8 AS promedio
        FROM public.v_unificado_norm
        ${wherePrev}
      ` as { promedio: number }[];
      anteriorPromedio = promPrev[0]?.promedio ?? null;

      rango = { inicio: filters.fechaHoraInicio, fin: filters.fechaHoraFin, comparadoCon: prev };
    }

    return {
      rango,
      kpis: {
        horaPico: filaHoraPico[0] ? `${String(filaHoraPico[0].hora_num).padStart(2, "0")}:00` : null,
        horaPicoValor: filaHoraPico[0]?.total ?? null,
        diaCargado: filaDiaCargado[0]?.dia_nombre?.trim() ?? null,
        diaCargadoValor: filaDiaCargado[0]?.total ?? null,
        promedioPorDia: comparar(filaPromDia[0]?.promedio ?? null, anteriorPromedio),
        total: comparar(totalActual.total, anteriorTotal),
      },
      heatmap: heatmap.map((h) => ({ hora: h.hora, dia: h.dia, total: h.total })),
      curvaHora: curvaHora.map((h) => ({ hora: h.hora, total: h.total })),
      cargaDiaSemana: cargaDiaSemana.map((d) => ({
        dia: d.dia,
        etiqueta: d.etiqueta?.trim() ?? '',
        total: d.total,
      })),
      tendenciaDiaria: tendenciaDiaria.map((d) => ({
        fecha: d.fecha instanceof Date ? d.fecha.toISOString().slice(0, 10) : String(d.fecha),
        total: d.total,
      })),
      topAsesores,
      topCategorias,
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
        SELECT ${CAT} AS categoria, dominio,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT}, dominio ORDER BY categoria, total DESC
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
    const whereActual = construirWhere(filters);
    const CAT = N_CATEGORIA;
    const SCAT = SCAT_LABEL;   // canónico mostrado (homologado central)
    const SCAT_GROUP = SCAT_KEY; // clave de agrupación (homologada central)
    const DOM = Prisma.sql`COALESCE(NULLIF(TRIM(dominio), ''), '—')`;
    const ASESOR = N_ASESOR_COALESCE;
    const SLA_CASE = Prisma.sql`CASE WHEN resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 20 THEN 1 ELSE 0 END`;

    const [
      totalCat,
      totalSub,
      catLiderRaw,
      subLiderRaw,
      paretoCatRaw,
      paretoSubRaw,
      jerarquiaRaw,
      catsTiempoRaw,
      subsTiempoRaw,
      catsSLARaw,
      subsSLARaw,
      matrizAsesorRaw,
      matrizSubAsesorRaw,
      impactoRaw,
    ] = await Promise.all([

      prisma.$queryRaw`SELECT COUNT(DISTINCT ${CAT})::int AS total FROM public.v_unificado_norm ${whereActual}` as Promise<{ total: number }[]>,

      prisma.$queryRaw`SELECT COUNT(DISTINCT ${SCAT_GROUP})::int AS total FROM public.v_unificado_norm ${whereActual}` as Promise<{ total: number }[]>,

      prisma.$queryRaw`SELECT ${CAT} AS categoria, COUNT(*)::int AS volumen FROM public.v_unificado_norm ${whereActual} GROUP BY ${CAT} ORDER BY volumen DESC LIMIT 1` as Promise<{ categoria: string; volumen: number }[]>,

      prisma.$queryRaw`SELECT ${SCAT} AS subcategoria, COUNT(*)::int AS volumen FROM public.v_unificado_norm ${whereActual} GROUP BY ${SCAT_GROUP} ORDER BY volumen DESC LIMIT 1` as Promise<{ subcategoria: string; volumen: number }[]>,

      prisma.$queryRaw`SELECT ${CAT} AS categoria, COUNT(*)::int AS volumen FROM public.v_unificado_norm ${whereActual} GROUP BY ${CAT} ORDER BY volumen DESC` as Promise<{ categoria: string; volumen: number }[]>,

      prisma.$queryRaw`SELECT ${SCAT} AS subcategoria, COUNT(*)::int AS volumen FROM public.v_unificado_norm ${whereActual} GROUP BY ${SCAT_GROUP} ORDER BY volumen DESC` as Promise<{ subcategoria: string; volumen: number }[]>,

      prisma.$queryRaw`SELECT ${CAT} AS categoria, ${SCAT} AS subcategoria, ${DOM} AS dominio, COUNT(*)::int AS volumen FROM public.v_unificado_norm ${whereActual} GROUP BY ${CAT}, ${SCAT_GROUP}, ${DOM} ORDER BY categoria, volumen DESC` as Promise<{ categoria: string; subcategoria: string; dominio: string; volumen: number }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria, COUNT(*)::int AS volumen,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0)+COALESCE(resolucion_min_norm,0))::numeric,1)::float8 AS tiempo_resolucion,
               ROUND(AVG(primera_respuesta_min_norm)::numeric,1)::float8 AS tiempo_espera,
               ROUND(AVG(resolucion_min_norm)::numeric,1)::float8 AS tiempo_atencion,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT} ORDER BY tiempo_resolucion DESC
      ` as Promise<{ categoria: string; volumen: number; tiempo_resolucion: number | null; tiempo_espera: number | null; tiempo_atencion: number | null; sla: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${SCAT} AS subcategoria, ${CAT} AS categoria, COUNT(*)::int AS volumen,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0)+COALESCE(resolucion_min_norm,0))::numeric,1)::float8 AS tiempo_resolucion,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SCAT_GROUP}, ${CAT} ORDER BY volumen DESC LIMIT 15
      ` as Promise<{ subcategoria: string; categoria: string; volumen: number; tiempo_resolucion: number | null; sla: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria, COUNT(*)::int AS volumen,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT} ORDER BY sla ASC
      ` as Promise<{ categoria: string; volumen: number; sla: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${SCAT} AS subcategoria, ${CAT} AS categoria, COUNT(*)::int AS volumen,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SCAT_GROUP}, ${CAT} ORDER BY volumen DESC LIMIT 15
      ` as Promise<{ subcategoria: string; categoria: string; volumen: number; sla: number | null }[]>,

      prisma.$queryRaw`SELECT ${ASESOR} AS asesor, ${CAT} AS categoria, COUNT(*)::int AS volumen FROM public.v_unificado_norm ${whereActual} GROUP BY ${ASESOR}, ${CAT}` as Promise<{ asesor: string; categoria: string; volumen: number }[]>,

      prisma.$queryRaw`SELECT ${ASESOR} AS asesor, ${SCAT} AS subcategoria, COUNT(*)::int AS volumen FROM public.v_unificado_norm ${whereActual} GROUP BY ${ASESOR}, ${SCAT_GROUP} ORDER BY volumen DESC` as Promise<{ asesor: string; subcategoria: string; volumen: number }[]>,

      prisma.$queryRaw`
        SELECT ${CAT} AS categoria, COUNT(*)::int AS volumen,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0)+COALESCE(resolucion_min_norm,0))::numeric,1)::float8 AS tiempo,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CAT}
      ` as Promise<{ categoria: string; volumen: number; tiempo: number | null; sla: number | null }[]>,
    ]);

    /* ── Calcular % y acumulado para Pareto categorías ── */
    const totalParetoCat = paretoCatRaw.reduce((s, r) => s + r.volumen, 0);
    let acum = 0;
    const paretoCategorias = paretoCatRaw.map((r) => {
      acum += r.volumen;
      return {
        categoria: r.categoria,
        volumen: r.volumen,
        pct: totalParetoCat > 0 ? Math.round((r.volumen / totalParetoCat) * 1000) / 10 : 0,
        acumulado: totalParetoCat > 0 ? Math.round((acum / totalParetoCat) * 1000) / 10 : 0,
      };
    });

    /* ── Calcular % y acumulado para Pareto subcategorías ── */
    const totalParetoSub = paretoSubRaw.reduce((s, r) => s + r.volumen, 0);
    let acumSub = 0;
    const paretoSubcategorias = paretoSubRaw.map((r) => {
      acumSub += r.volumen;
      return {
        subcategoria: r.subcategoria,
        volumen: r.volumen,
        pct: totalParetoSub > 0 ? Math.round((r.volumen / totalParetoSub) * 1000) / 10 : 0,
        acumulado: totalParetoSub > 0 ? Math.round((acumSub / totalParetoSub) * 1000) / 10 : 0,
      };
    });

    return {
      totalCategorias: totalCat[0]?.total ?? 0,
      totalSubcategorias: totalSub[0]?.total ?? 0,
      categoriaLider: catLiderRaw[0] ? { nombre: catLiderRaw[0].categoria, volumen: catLiderRaw[0].volumen } : null,
      subcategoriaLider: subLiderRaw[0] ? { nombre: subLiderRaw[0].subcategoria, volumen: subLiderRaw[0].volumen } : null,
      paretoCategorias,
      paretoSubcategorias,
      jerarquia: jerarquiaRaw.map((r) => ({ categoria: r.categoria, subcategoria: r.subcategoria, dominio: r.dominio, volumen: r.volumen })),
      categoriasTiempo: catsTiempoRaw.map((r) => ({ categoria: r.categoria, volumen: r.volumen, tiempo_resolucion: r.tiempo_resolucion, tiempo_espera: r.tiempo_espera, tiempo_atencion: r.tiempo_atencion, sla: r.sla })),
      subcategoriasTiempo: subsTiempoRaw.map((r) => ({ subcategoria: r.subcategoria, categoria: r.categoria, volumen: r.volumen, tiempo_resolucion: r.tiempo_resolucion, sla: r.sla })),
      categoriasSLA: catsSLARaw.map((r) => ({ categoria: r.categoria, volumen: r.volumen, sla: r.sla })),
      subcategoriasSLA: subsSLARaw.map((r) => ({ subcategoria: r.subcategoria, categoria: r.categoria, volumen: r.volumen, sla: r.sla })),
      matrizAsesor: matrizAsesorRaw.map((r) => ({ asesor: r.asesor, categoria: r.categoria, volumen: r.volumen })),
      matrizSubAsesor: matrizSubAsesorRaw.map((r) => ({ asesor: r.asesor, subcategoria: r.subcategoria, volumen: r.volumen })),
      impacto: impactoRaw.map((r) => ({ categoria: r.categoria, volumen: r.volumen, tiempo: r.tiempo, sla: r.sla })),
    };
  },

  async clientesV2(filters: DashboardFilters): Promise<ClientesV2Response> {
    const whereActual = construirWhere(filters);
    const DOM = Prisma.sql`COALESCE(NULLIF(TRIM(dominio), ''), '-')`;
    const N_CAT = N_CATEGORIA;
    const N_SCAT = SCAT_LABEL;
    const GRUPO = Prisma.sql`CASE WHEN canal ILIKE '%what%' THEN 'whatsapp' WHEN canal ILIKE '%ticket%' THEN 'whaticket' ELSE 'zendesk' END`;
    const WPP = Prisma.sql`canal ILIKE '%what%'`;
    const CORREO = Prisma.sql`(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`;
    const SLA_CASE = Prisma.sql`CASE WHEN resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 20 THEN 1 ELSE 0 END`;

    const [
      kpiRaw,
      jerarquiaRaw,
      rankingRaw,
      riesgoRaw,
      rankingTiempoRaw,
      rankingSLARaw,
      evolRaw,
    ] = await Promise.all([

      prisma.$queryRaw`
        SELECT COUNT(DISTINCT ${DOM})::int AS unicos,
               COUNT(*)::int AS total_atenciones,
               COUNT(DISTINCT CASE WHEN ${DOM} <> '-' THEN ${DOM} END)::int AS con_dominio,
               COUNT(DISTINCT CASE WHEN ${DOM} = '-' THEN ${DOM} END)::int AS sin_dominio,
               COUNT(DISTINCT CASE WHEN ${WPP} THEN ${DOM} END)::int AS wpp,
               COUNT(DISTINCT CASE WHEN ${CORREO} THEN ${DOM} END)::int AS correo
        FROM public.v_unificado_norm ${whereActual}
      ` as Promise<{ unicos: number; total_atenciones: number; con_dominio: number; sin_dominio: number; wpp: number; correo: number }[]>,

      prisma.$queryRaw`
        SELECT ${DOM} AS cliente, ${GRUPO} AS canal, ${N_CAT} AS categoria, ${N_SCAT} AS subcategoria,
               COUNT(*)::int AS total,
               ROUND(AVG(primera_respuesta_min_norm)::numeric,1)::float8 AS tiempo_espera,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0)+COALESCE(resolucion_min_norm,0))::numeric,1)::float8 AS tiempo_resolucion,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${DOM}, ${GRUPO}, ${N_CAT}, ${SCAT_KEY}
        ORDER BY cliente, canal, categoria, subcategoria
      ` as Promise<{ cliente: string; canal: string; categoria: string; subcategoria: string; total: number; tiempo_espera: number | null; tiempo_resolucion: number | null; sla: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${DOM} AS cliente, COUNT(*)::int AS total,
               ROUND(AVG(primera_respuesta_min_norm)::numeric,1)::float8 AS tiempo_espera,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0)+COALESCE(resolucion_min_norm,0))::numeric,1)::float8 AS tiempo_resolucion,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${DOM} ORDER BY total DESC LIMIT 20
      ` as Promise<{ cliente: string; total: number; tiempo_espera: number | null; tiempo_resolucion: number | null; sla: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${DOM} AS cliente, COUNT(*)::int AS total,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0)+COALESCE(resolucion_min_norm,0))::numeric,1)::float8 AS tiempo_resolucion,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${DOM} ORDER BY total DESC
      ` as Promise<{ cliente: string; total: number; tiempo_resolucion: number | null; sla: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${DOM} AS cliente,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0)+COALESCE(resolucion_min_norm,0))::numeric,1)::float8 AS tiempo_resolucion,
               COUNT(*)::int AS total,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${DOM} ORDER BY tiempo_resolucion DESC LIMIT 20
      ` as Promise<{ cliente: string; tiempo_resolucion: number | null; total: number; sla: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${DOM} AS cliente,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla,
               COUNT(*)::int AS total,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0)+COALESCE(resolucion_min_norm,0))::numeric,1)::float8 AS tiempo_resolucion
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${DOM} ORDER BY sla ASC LIMIT 20
      ` as Promise<{ cliente: string; sla: number | null; total: number; tiempo_resolucion: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${DOM} AS cliente, fecha::text AS periodo, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${DOM}, fecha ORDER BY cliente, periodo
      ` as Promise<{ cliente: string; periodo: string; total: number }[]>,
    ]);

    const k = kpiRaw[0];
    const totalDom = (k?.con_dominio ?? 0) + (k?.sin_dominio ?? 0);
    const promAtenciones = (k?.unicos ?? 0) > 0 ? Math.round(((k?.total_atenciones ?? 0) / (k?.unicos ?? 1)) * 10) / 10 : 0;

    /* ── KPI ── */
    const kpis = {
      unicos: k?.unicos ?? 0,
      totalAtenciones: k?.total_atenciones ?? 0,
      conDominio: k?.con_dominio ?? 0,
      pctConDominio: totalDom > 0 ? Math.round((k!.con_dominio / totalDom) * 1000) / 10 : 0,
      sinDominio: k?.sin_dominio ?? 0,
      pctSinDominio: totalDom > 0 ? Math.round((k!.sin_dominio / totalDom) * 1000) / 10 : 0,
      wpp: k?.wpp ?? 0,
      pctWpp: (k?.unicos ?? 0) > 0 ? Math.round((k!.wpp / k!.unicos) * 1000) / 10 : 0,
      correo: k?.correo ?? 0,
      pctCorreo: (k?.unicos ?? 0) > 0 ? Math.round((k!.correo / k!.unicos) * 1000) / 10 : 0,
      promedioAtenciones: promAtenciones,
    };

    /* ── Ranking con % ── */
    const totalRanking = rankingRaw.reduce((s, r) => s + r.total, 0);
    const ranking = rankingRaw.map((r) => ({
      cliente: r.cliente,
      total: r.total,
      pct: totalRanking > 0 ? Math.round((r.total / totalRanking) * 1000) / 10 : 0,
      tiempo_espera: r.tiempo_espera,
      tiempo_resolucion: r.tiempo_resolucion,
      sla: r.sla,
    }));

    /* ── Riesgo ── */
    const maxVol = Math.max(...riesgoRaw.map((r) => r.total), 1);
    const maxRes = Math.max(...riesgoRaw.map((r) => r.tiempo_resolucion ?? 0), 1);
    const riesgo = riesgoRaw.map((r) => {
      const volScore = (r.total / maxVol) * 40;
      const resScore = (1 - ((r.tiempo_resolucion ?? 0) / maxRes)) * 30;
      const slaScore = (r.sla ?? 0) / 100 * 30;
      const score = Math.round(volScore + resScore + slaScore);
      let nivel = "Bajo";
      if (score >= 80) nivel = "Crítico";
      else if (score >= 60) nivel = "Alto";
      else if (score >= 40) nivel = "Medio";
      return { cliente: r.cliente, score, total: r.total, tiempo_resolucion: r.tiempo_resolucion, sla: r.sla, nivel };
    }).sort((a, b) => b.score - a.score);

    return {
      kpis,
      jerarquia: jerarquiaRaw.map((r) => ({ cliente: r.cliente, canal: r.canal, categoria: r.categoria, subcategoria: r.subcategoria, total: r.total, tiempo_espera: r.tiempo_espera, tiempo_resolucion: r.tiempo_resolucion, sla: r.sla })),
      ranking,
      rankingTiempo: rankingTiempoRaw.map((r) => ({ cliente: r.cliente, tiempo_resolucion: r.tiempo_resolucion, total: r.total, sla: r.sla })),
      rankingSLA: rankingSLARaw.map((r) => ({ cliente: r.cliente, sla: r.sla, total: r.total, tiempo_resolucion: r.tiempo_resolucion })),
      riesgo,
      evolucion: evolRaw.map((r) => ({ cliente: r.cliente, periodo: r.periodo, total: r.total })),
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
        SELECT COALESCE(NULLIF(TRIM(dominio), ''), '—') AS dominio, COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoPromedio
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY dominio ORDER BY total DESC LIMIT 30
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
             COALESCE(NULLIF(TRIM(dominio), ''), '—') AS dominio,
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
    const whereActual = construirWhere(filters);
    const whereWhatsapp = whereConCanal(whereActual, Prisma.sql`(subcanal IN ('whaticket', 'whatmeta') OR canal ILIKE '%what%')`);

    const SUBC = Prisma.sql`REPLACE(subcanal, '_', ' ')`;
    const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
    const SLA_CASE = Prisma.sql`CASE WHEN resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= 20 THEN 1 ELSE 0 END`;

    const [
      kpiRaw,
      distSubRaw,
      evolRaw,
      heatmapHourRaw,
      paisRaw,
      treemapRaw,
      topSubRaw,
      tiemposRaw,
      asesorRaw,
      paisCatRaw,
      catAsesorRaw,
    ] = await Promise.all([

      prisma.$queryRaw`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE subcanal ILIKE '%ticket%')::int AS whaticket,
               COUNT(*) FILTER (WHERE subcanal ILIKE '%meta%')::int AS whatmeta,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS promPrimera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS promResolucion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0))::numeric, 1)::float8 AS promEspera,
               COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertas,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS cerradas,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumpleSla,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS conDatoSla,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS resueltas
        FROM public.v_unificado_norm ${whereWhatsapp}
      ` as Promise<{ total: number; whaticket: number; whatmeta: number; promPrimera: number | null; promResolucion: number | null; promEspera: number | null; abiertas: number; cerradas: number; cumpleSla: number; conDatoSla: number; resueltas: number }[]>,

      prisma.$queryRaw`
        SELECT ${SUBC} AS subcanal, COUNT(*)::int AS total,
               ROUND(AVG(primera_respuesta_min_norm)::numeric,1)::float8 AS primera,
               ROUND(AVG(resolucion_min_norm)::numeric,1)::float8 AS resolucion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0))::numeric,1)::float8 AS espera,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumple,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS conDato,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS resueltas
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY ${SUBC} ORDER BY total DESC
      ` as Promise<{ subcanal: string; total: number; primera: number | null; resolucion: number | null; espera: number | null; cumple: number; conDato: number; resueltas: number }[]>,

      prisma.$queryRaw`
        SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS periodo,
               ${SUBC} AS subcanal,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY fecha::date, ${SUBC} ORDER BY periodo, subcanal
      ` as Promise<{ periodo: string; subcanal: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM hora::time)::int AS hora,
               EXTRACT(DOW FROM fecha::date)::int AS dia,
               COUNT(*)::int AS total,
               ${SUBC} AS subcanal
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY EXTRACT(HOUR FROM hora::time), EXTRACT(DOW FROM fecha::date), ${SUBC}
        ORDER BY dia, hora, subcanal
      ` as Promise<{ hora: number; dia: number; total: number; subcanal: string }[]>,

      prisma.$queryRaw`
        SELECT ${N_PAIS} AS pais, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY ${N_PAIS} ORDER BY total DESC LIMIT 20
      ` as Promise<{ pais: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_CATEGORIA} AS categoria, COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric,1)::float8 AS resolucion
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY ${N_CATEGORIA} ORDER BY total DESC
      ` as Promise<{ categoria: string; total: number; resolucion: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${SCAT_LABEL} AS subcategoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY ${SCAT_KEY} ORDER BY total DESC LIMIT 20
      ` as Promise<{ subcategoria: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${SUBC} AS subcanal,
               ROUND(AVG(primera_respuesta_min_norm)::numeric,1)::float8 AS primera,
               ROUND(AVG(resolucion_min_norm)::numeric,1)::float8 AS resolucion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm,0))::numeric,1)::float8 AS espera
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY ${SUBC}
      ` as Promise<{ subcanal: string; primera: number | null; resolucion: number | null; espera: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${N_ASESOR_COALESCE} AS asesor, ${SUBC} AS subcanal,
               COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric,1)::float8 AS tiempoPromedio,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumple,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS conDato,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS resueltas,
               COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertos,
               COUNT(*) FILTER (WHERE estado_homologado = 'pendiente')::int AS pendientes
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY ${N_ASESOR_COALESCE}, ${SUBC}
      ` as Promise<{ asesor: string; subcanal: string; total: number; tiempoPromedio: number | null; cumple: number; conDato: number; resueltas: number; abiertos: number; pendientes: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_PAIS} AS pais, ${N_CATEGORIA} AS categoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY ${N_PAIS}, ${N_CATEGORIA} ORDER BY pais, total DESC
      ` as Promise<{ pais: string; categoria: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_CATEGORIA} AS categoria, ${N_ASESOR_COALESCE} AS asesor,
               COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric,1)::float8 AS tiempo,
               ROUND(SUM(${SLA_CASE})::numeric*100.0/NULLIF(COUNT(*),0),1)::float8 AS sla
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY ${N_CATEGORIA}, ${N_ASESOR_COALESCE} ORDER BY categoria, total DESC
      ` as Promise<{ categoria: string; asesor: string; total: number; tiempo: number | null; sla: number | null }[]>,

    ]);

    const whereLargas = whereConCanal(whereWhatsapp, Prisma.sql`resolucion_min_norm IS NOT NULL`);

    const [clientesRaw, dominiosRaw, largasRaw] = await Promise.all([
      prisma.$queryRaw`
        SELECT COALESCE(NULLIF(TRIM(contacto), ''), 'Sin contacto') AS cliente, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY contacto ORDER BY total DESC LIMIT 20
      ` as Promise<{ cliente: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT COALESCE(NULLIF(TRIM(dominio), ''), '—') AS dominio, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereWhatsapp}
        GROUP BY dominio ORDER BY total DESC LIMIT 15
      ` as Promise<{ dominio: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT COALESCE(NULLIF(TRIM(contacto), ''), 'Sin contacto') AS cliente,
               ${N_ASESOR_COALESCE} AS asesor,
               COALESCE(NULLIF(TRIM(subcanal), ''), '—') AS subcanal,
               resolucion_min_norm AS "tiempoResolucion",
               TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha
        FROM public.v_unificado_norm ${whereLargas}
        ORDER BY resolucion_min_norm DESC LIMIT 20
      ` as Promise<{ cliente: string; asesor: string; subcanal: string; tiempoResolucion: number | null; fecha: string }[]>,
    ]);

    const k = kpiRaw[0]!;
    const kpis: WhatsAppKpis = {
      totalConversaciones: k.total,
      totalWhaticket: k.whaticket,
      totalWhatmeta: k.whatmeta,
      pctWhaticket: k.total > 0 ? Math.round((k.whaticket / k.total) * 1000) / 10 : 0,
      pctWhatmeta: k.total > 0 ? Math.round((k.whatmeta / k.total) * 1000) / 10 : 0,
      tiempoPrimeraRespuesta: k.promPrimera,
      tiempoResolucion: k.promResolucion,
      tiempoEspera: k.promEspera,
      conversacionesAbiertas: k.abiertas,
      conversacionesCerradas: k.cerradas,
      cumplimientoSla: k.conDatoSla > 0 ? Math.round((k.cumpleSla / k.conDatoSla) * 1000) / 10 : null,
      fcr: k.total > 0 ? Math.round((k.resueltas / k.total) * 1000) / 10 : null,
      tiempoPromedioAsesor: null,
    };

    const grandDist = distSubRaw.reduce((s, r) => s + r.total, 0);
    const distSubcanal = distSubRaw.map((r) => {
      const slaVal = r.conDato > 0 ? Math.round((r.cumple / r.conDato) * 1000) / 10 : null;
      const fcrVal = r.total > 0 ? Math.round((r.resueltas / r.total) * 1000) / 10 : null;
      return {
        subcanal: r.subcanal,
        total: r.total,
        porcentaje: grandDist > 0 ? Math.round((r.total / grandDist) * 1000) / 10 : 0,
        primeraRespuesta: r.primera,
        resolucion: r.resolucion,
        espera: r.espera,
        sla: slaVal,
        fcr: fcrVal,
      };
    });

    const evolucion = evolRaw.map((r) => ({ periodo: r.periodo, subcanal: r.subcanal, total: r.total }));
    const heatmapHora = heatmapHourRaw.map((r) => ({ hora: r.hora, dia: r.dia, total: r.total, subcanal: r.subcanal }));
    const paises = paisRaw.map((r) => ({ pais: r.pais, total: r.total }));

    const treemap = treemapRaw.map((r) => ({
      categoria: r.categoria, total: r.total, tiempoResolucion: r.resolucion,
    }));

    const grandSub = topSubRaw.reduce((s, r) => s + r.total, 0);
    const topSubcategorias = topSubRaw.map((r) => ({
      subcategoria: r.subcategoria, total: r.total,
      porcentaje: grandSub > 0 ? Math.round((r.total / grandSub) * 1000) / 10 : 0,
    }));

    const tiempos = tiemposRaw.map((r) => ({
      subcanal: r.subcanal, primeraRespuesta: r.primera, resolucion: r.resolucion, espera: r.espera,
    }));

    const asesores = asesorRaw.map((r) => ({
      asesor: r.asesor, subcanal: r.subcanal, total: r.total, tiempoPromedio: r.tiempoPromedio,
      sla: r.conDato > 0 ? Math.round((r.cumple / r.conDato) * 1000) / 10 : null,
      fcr: r.total > 0 ? Math.round((r.resueltas / r.total) * 1000) / 10 : null,
      abiertos: r.abiertos,
      pendientes: r.pendientes,
    }));

    const topClientes = clientesRaw.map((r) => ({ cliente: r.cliente, total: r.total }));
    const dominios = dominiosRaw.map((r) => ({ dominio: r.dominio, total: r.total }));

    const conversacionesLargas = largasRaw.map((r) => ({
      cliente: r.cliente, asesor: r.asesor, subcanal: r.subcanal,
      tiempoResolucion: r.tiempoResolucion, fecha: r.fecha,
    }));

    const paisCat = paisCatRaw.map((r) => ({ pais: r.pais, categoria: r.categoria, total: r.total }));
    const catAsesor = catAsesorRaw.map((r) => ({ categoria: r.categoria, asesor: r.asesor, total: r.total, tiempo: r.tiempo, sla: r.sla }));

    const insights: string[] = [];
    if (k.total > 0) {
      insights.push(`WhatsApp procesó ${k.total} conversaciones en el período (${kpis.pctWhaticket}% whaticket, ${kpis.pctWhatmeta}% whatmeta).`);
      const topCat = treemap.sort((a, b) => b.total - a.total)[0];
      if (topCat) {
        const pct = Math.round((topCat.total / k.total) * 1000) / 10;
        insights.push(`"${topCat.categoria}" concentra el ${pct}% de las conversaciones.`);
      }
    }
    if (k.promPrimera !== null) insights.push(`Tiempo promedio de primera respuesta: ${Math.round(k.promPrimera)} min.`);
    if (k.promResolucion !== null) insights.push(`Tiempo promedio de resolución: ${Math.round(k.promResolucion)} min.`);
    const slaInsight = k.conDatoSla > 0 ? Math.round((k.cumpleSla / k.conDatoSla) * 1000) / 10 : null;
    if (slaInsight !== null) insights.push(`Cumplimiento de SLA en primera respuesta: ${slaInsight}%.`);
    if (k.abiertas > 0) insights.push(`Hay ${k.abiertas} conversaciones abiertas pendientes de resolución.`);
    if (conversacionesLargas.length > 0) {
      insights.push(`La conversación más larga duró ${Math.round(conversacionesLargas[0].tiempoResolucion ?? 0)} min.`);
    }

    return {
      kpis, distSubcanal, evolucion, heatmapHora, paises, treemap,
      topSubcategorias, tiempos, asesores, topClientes, dominios,
      conversacionesLargas, paisCat, catAsesor, insights,
    };
  },

  async zendesk(filters: DashboardFilters): Promise<ZendeskResponse> {
    const whereBase = construirWhere(filters);
    const where = whereConCanal(whereBase, Prisma.sql`(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`);
    const SUBC = Prisma.sql`REPLACE(subcanal, '_', ' ')`;
    const CONTACTO = Prisma.sql`COALESCE(NULLIF(TRIM(contacto), ''), 'Sin contacto')`;
    const uPr = umbral(SLA_MINUTOS.primeraRespuesta);
    const uRes = umbral(SLA_MINUTOS.resolucion);

    const totalActual = await totales(where);
    const whereBacklog = whereConCanal(where, Prisma.sql`estado_homologado = 'abierto'`);

    const [
      kpiRaw, evolRaw, backlogRaw, estadosRaw, treemapRaw, topSubRaw,
      asesorRaw, paisRaw, dominiosRaw, clientesRaw, slaCatRaw,
      tiemposCatRaw, tiemposSubRaw, tiemposAsesorRaw,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertos,
               COUNT(*) FILTER (WHERE estado_homologado = 'cerrado')::int AS cerrados,
               COUNT(*) FILTER (WHERE estado_homologado = 'pendiente')::int AS pendientes,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS promPrimera,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS promResolucion,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumplePr,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS conDatoPr,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${uRes})::int AS cumpleRes,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS conDatoRes,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS resueltos
        FROM public.v_unificado_norm ${where}
      ` as Promise<{
        total: number; abiertos: number; cerrados: number; pendientes: number;
        promPrimera: number | null; promResolucion: number | null;
        cumplePr: number; conDatoPr: number; cumpleRes: number; conDatoRes: number; resueltos: number;
      }[]>,

      prisma.$queryRaw`
        SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS periodo,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE estado_homologado = 'abierto')::int AS abiertos,
               COUNT(*) FILTER (WHERE estado_homologado = 'cerrado')::int AS cerrados
        FROM public.v_unificado_norm ${where}
        GROUP BY fecha::date ORDER BY periodo
      ` as Promise<{ periodo: string; total: number; abiertos: number; cerrados: number }[]>,

      prisma.$queryRaw`
        SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS periodo, COUNT(*)::int AS abiertos
        FROM public.v_unificado_norm ${whereBacklog}
        GROUP BY fecha::date ORDER BY periodo
      ` as Promise<{ periodo: string; abiertos: number }[]>,

      prisma.$queryRaw`
        SELECT estado_homologado AS estado, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY estado_homologado ORDER BY total DESC
      ` as Promise<{ estado: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_CATEGORIA} AS categoria, COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoResolucion
        FROM public.v_unificado_norm ${where}
        GROUP BY ${N_CATEGORIA} ORDER BY total DESC
      ` as Promise<{ categoria: string; total: number; tiempoResolucion: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${SUBC} AS subcategoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY ${SUBC} ORDER BY total DESC LIMIT 20
      ` as Promise<{ subcategoria: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_ASESOR_COALESCE} AS asesor, COUNT(*)::int AS total,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS tiempoPromedio,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumple,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS conDato,
               COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS resueltas
        FROM public.v_unificado_norm ${where}
        GROUP BY ${N_ASESOR_COALESCE} ORDER BY total DESC
      ` as Promise<{ asesor: string; total: number; tiempoPromedio: number | null; cumple: number; conDato: number; resueltas: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_PAIS} AS pais, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY ${N_PAIS} ORDER BY total DESC
      ` as Promise<{ pais: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT COALESCE(NULLIF(TRIM(dominio), ''), '—') AS dominio, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY dominio ORDER BY total DESC
      ` as Promise<{ dominio: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CONTACTO} AS cliente, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY ${CONTACTO} ORDER BY total DESC
      ` as Promise<{ cliente: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_CATEGORIA} AS categoria,
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${uRes})::int AS cumple,
               COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm > ${uRes})::int AS noCumple
        FROM public.v_unificado_norm ${where}
        GROUP BY ${N_CATEGORIA} ORDER BY total DESC
      ` as Promise<{ categoria: string; total: number; cumple: number; noCumple: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_CATEGORIA} AS categoria,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primeraRespuesta,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS resolucion
        FROM public.v_unificado_norm ${where}
        GROUP BY ${N_CATEGORIA} ORDER BY categoria
      ` as Promise<{ categoria: string; primeraRespuesta: number | null; resolucion: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${SUBC} AS subcategoria,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primeraRespuesta,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS resolucion
        FROM public.v_unificado_norm ${where}
        GROUP BY ${SUBC} ORDER BY subcategoria
      ` as Promise<{ subcategoria: string; primeraRespuesta: number | null; resolucion: number | null }[]>,

      prisma.$queryRaw`
        SELECT ${N_ASESOR_COALESCE} AS asesor,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primeraRespuesta,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS resolucion
        FROM public.v_unificado_norm ${where}
        GROUP BY ${N_ASESOR_COALESCE} ORDER BY asesor
      ` as Promise<{ asesor: string; primeraRespuesta: number | null; resolucion: number | null }[]>,
    ]);

    const whereAbiertos = whereConCanal(where, Prisma.sql`estado_homologado = 'abierto'`);
    const whereResNotNull = whereConCanal(where, Prisma.sql`resolucion_min_norm IS NOT NULL`);

    const ticketsAntiguosRaw = await prisma.$queryRaw`
      SELECT ${CONTACTO} AS cliente, ${N_CATEGORIA} AS categoria,
             ${N_ASESOR_COALESCE} AS asesor,
             TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha,
             EXTRACT(EPOCH FROM (NOW() - fecha)) / 3600 AS horas
      FROM public.v_unificado_norm ${whereAbiertos}
      ORDER BY fecha ASC LIMIT 200
    ` as { cliente: string; categoria: string; asesor: string; fecha: string; horas: number }[];

    const incumplimientosRaw = await prisma.$queryRaw`
      SELECT ${N_CATEGORIA} AS categoria,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm > ${uRes})::int AS noCumple
      FROM public.v_unificado_norm ${whereResNotNull}
      GROUP BY ${N_CATEGORIA}
      ORDER BY noCumple DESC LIMIT 10
    ` as { categoria: string; total: number; noCumple: number }[];

    let tendencia: { periodo: string; actual: number; anterior: number }[] = [];
    if (filters.fechaHoraInicio && filters.fechaHoraFin) {
      const prev = rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin);
      const wherePrev = whereConCanal(
        construirWhere({ ...filters, fechaHoraInicio: prev.inicio, fechaHoraFin: prev.fin }),
        Prisma.sql`(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')`,
      );
      const actMes = await prisma.$queryRaw`
        SELECT TO_CHAR(fecha::date, 'YYYY-MM') AS periodo, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY TO_CHAR(fecha::date, 'YYYY-MM') ORDER BY periodo
      ` as { periodo: string; total: number }[];
      const antMes = await prisma.$queryRaw`
        SELECT TO_CHAR(fecha::date, 'YYYY-MM') AS periodo, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${wherePrev}
        GROUP BY TO_CHAR(fecha::date, 'YYYY-MM') ORDER BY periodo
      ` as { periodo: string; total: number }[];
      const antMap = new Map(antMes.map((r) => [r.periodo, r.total]));
      tendencia = actMes.map((r) => ({ periodo: r.periodo, actual: r.total, anterior: antMap.get(r.periodo) ?? 0 }));
    }

    const k = kpiRaw[0]!;
    const kpis: ZendeskKpis = {
      totalTickets: k.total, ticketsAbiertos: k.abiertos, ticketsCerrados: k.cerrados,
      ticketsPendientes: k.pendientes, tiempoPrimeraRespuesta: k.promPrimera,
      tiempoResolucion: k.promResolucion,
      slaPrimeraRespuesta: k.conDatoPr > 0 ? Math.round((k.cumplePr / k.conDatoPr) * 1000) / 10 : null,
      slaResolucion: k.conDatoRes > 0 ? Math.round((k.cumpleRes / k.conDatoRes) * 1000) / 10 : null,
      fcr: k.total > 0 ? Math.round((k.resueltos / k.total) * 1000) / 10 : null,
      tiempoPromedioTicket: k.promResolucion,
    };

    const grandEst = estadosRaw.reduce((s, r) => s + r.total, 0);
    const estados = estadosRaw.map((r) => ({ estado: r.estado, total: r.total, porcentaje: grandEst > 0 ? Math.round((r.total / grandEst) * 1000) / 10 : 0 }));
    const treemap = treemapRaw.map((r) => ({ categoria: r.categoria, total: r.total, tiempoResolucion: r.tiempoResolucion }));
    const grandSub = topSubRaw.reduce((s, r) => s + r.total, 0);
    const topSubcategorias = topSubRaw.map((r) => ({ subcategoria: r.subcategoria, total: r.total, porcentaje: grandSub > 0 ? Math.round((r.total / grandSub) * 1000) / 10 : 0 }));
    const asesores = asesorRaw.map((r) => ({ asesor: r.asesor, total: r.total, tiempoPromedio: r.tiempoPromedio, sla: r.conDato > 0 ? Math.round((r.cumple / r.conDato) * 1000) / 10 : null, fcr: r.total > 0 ? Math.round((r.resueltas / r.total) * 1000) / 10 : null }));
    const paises = paisRaw.map((r) => ({ pais: r.pais, total: r.total }));
    const dominios = dominiosRaw.map((r) => ({ dominio: r.dominio, total: r.total }));
    const clientes = clientesRaw.map((r) => ({ cliente: r.cliente, total: r.total }));

    const slaCategoria = slaCatRaw.map((r) => ({ categoria: r.categoria, cumple: r.cumple, noCumple: r.noCumple, total: r.total, pctCumple: (r.cumple + r.noCumple) > 0 ? Math.round((r.cumple / (r.cumple + r.noCumple)) * 1000) / 10 : 0 }));
    const tiemposCategoria = tiemposCatRaw.map((r) => ({ categoria: r.categoria, primeraRespuesta: r.primeraRespuesta, resolucion: r.resolucion }));
    const tiemposSubcategoria = tiemposSubRaw.map((r) => ({ subcategoria: r.subcategoria, primeraRespuesta: r.primeraRespuesta, resolucion: r.resolucion }));
    const tiemposAsesor = tiemposAsesorRaw.map((r) => ({ asesor: r.asesor, primeraRespuesta: r.primeraRespuesta, resolucion: r.resolucion }));

    const ticketsAntiguosObj = {
      grupo: `abiertos (${ticketsAntiguosRaw.length})`,
      tickets: ticketsAntiguosRaw.map((r) => ({ ticket: null as string | null, cliente: r.cliente, categoria: r.categoria, asesor: r.asesor, fecha: r.fecha, horasTranscurridas: Math.round(r.horas * 10) / 10 })),
    };

    const incumplimientos = incumplimientosRaw.map((r) => ({ categoria: r.categoria, total: r.total, pctIncumplimiento: r.total > 0 ? Math.round((r.noCumple / r.total) * 1000) / 10 : 0 }));

    const categoriasCriticas = treemapRaw.map((r) => {
      const sla = slaCatRaw.find((s) => s.categoria === r.categoria);
      return { categoria: r.categoria, total: r.total, tiempoResolucion: r.tiempoResolucion, incumplimientoSla: sla ? sla.noCumple : null };
    }).sort((a, b) => (b.incumplimientoSla ?? 0) - (a.incumplimientoSla ?? 0));

    const insights: string[] = [];
    if (k.total > 0) insights.push(`Zendesk/Correo procesó ${k.total} tickets en el período.`);
    if (k.promPrimera !== null) insights.push(`Tiempo promedio de primera respuesta: ${Math.round(k.promPrimera)} min.`);
    if (k.promResolucion !== null) insights.push(`Tiempo promedio de resolución: ${Math.round(k.promResolucion)} min.`);
    if (k.conDatoPr > 0) insights.push(`Cumplimiento SLA primera respuesta: ${Math.round((k.cumplePr / k.conDatoPr) * 1000) / 10}%.`);
    if (k.conDatoRes > 0) insights.push(`Cumplimiento SLA resolución: ${Math.round((k.cumpleRes / k.conDatoRes) * 1000) / 10}%.`);
    if (k.abiertos > 0) insights.push(`${k.abiertos} tickets permanecen abiertos.`);
    const topTree = [...treemap].sort((a, b) => b.total - a.total)[0];
    if (topTree) insights.push(`"${topTree.categoria}" concentra el ${k.total > 0 ? Math.round((topTree.total / k.total) * 1000) / 10 : 0}% de los tickets.`);

    return {
      kpis, evolucion: evolRaw, backlog: backlogRaw, estados, treemap,
      topSubcategorias, asesores, paises, dominios, clientes, slaCategoria,
      tiemposCategoria, tiemposSubcategoria, tiemposAsesor,
      ticketsAntiguos: ticketsAntiguosObj, incumplimientos, categoriasCriticas,
      tendencia, insights,
    };
  },

  async tendencias(filters: DashboardFilters): Promise<TendenciasResponse> {
    const whereActual = construirWhere(filters);
    const CL_COL = Prisma.sql`COALESCE(NULLIF(TRIM(contacto), ''), 'Sin contacto')`;
    const SCAT = SCAT_LABEL;
    const GRUPO = Prisma.sql`CASE WHEN canal ILIKE '%what%' THEN 'whatsapp' WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN 'correo' ELSE 'otro' END`;
    const uPr = umbral(SLA_MINUTOS.primeraRespuesta);

    const totalActual = await totales(whereActual);
    const slaActual = await slaTotales(whereActual);

    const [
      evolRaw, evolCanalRaw, evolSubcanalRaw, evolAsesorRaw, evolPaisRaw,
      slaTendRaw, tiemposTendRaw, quintilesTendRaw,
      estacionalidadHourRaw, estacionalidadMonthRaw,
      topCatsGlobal, topSubGlobal, topDomGlobal, topCliGlobal, clientesActRaw,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT fecha::date AS periodo, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date ORDER BY periodo
      ` as Promise<{ periodo: Date; total: number }[]>,

      prisma.$queryRaw`
        SELECT fecha::date AS periodo, ${GRUPO} AS canal, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date, ${GRUPO} ORDER BY periodo, canal
      ` as Promise<{ periodo: Date; canal: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT fecha::date AS periodo,
               COALESCE(NULLIF(TRIM(subcanal), ''), 'Sin subcanal') AS subcanal,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date, subcanal ORDER BY periodo, total DESC
      ` as Promise<{ periodo: Date; subcanal: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT fecha::date AS periodo, ${N_ASESOR_COALESCE} AS asesor,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date, ${N_ASESOR_COALESCE} ORDER BY periodo, total DESC
      ` as Promise<{ periodo: Date; asesor: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT fecha::date AS periodo, ${N_PAIS} AS pais,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date, ${N_PAIS} ORDER BY periodo, total DESC
      ` as Promise<{ periodo: Date; pais: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT fecha::date AS periodo,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS conDato,
               COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${uPr})::int AS cumple
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date ORDER BY periodo
      ` as Promise<{ periodo: Date; conDato: number; cumple: number }[]>,

      prisma.$queryRaw`
        SELECT fecha::date AS periodo,
               ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primeraRespuesta,
               ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS resolucion,
               ROUND(AVG(COALESCE(primera_respuesta_min_norm, 0))::numeric, 1)::float8 AS espera
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY fecha::date ORDER BY periodo
      ` as Promise<{ periodo: Date; primeraRespuesta: number | null; resolucion: number | null; espera: number | null }[]>,

      prisma.$queryRaw`
        SELECT periodo, quintil, ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS promedio
        FROM (
          SELECT fecha::date AS periodo, primera_respuesta_min_norm,
                 NTILE(5) OVER (PARTITION BY fecha::date ORDER BY primera_respuesta_min_norm) AS quintil
          FROM public.v_unificado_norm
          ${whereConCanal(whereActual, Prisma.sql`primera_respuesta_min_norm IS NOT NULL`)}
        ) sub
        GROUP BY periodo, quintil ORDER BY periodo, quintil
      ` as Promise<{ periodo: Date; quintil: number; promedio: number | null }[]>,

      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM hora::time)::int AS hora,
               EXTRACT(DOW FROM fecha::date)::int AS dia,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY EXTRACT(HOUR FROM hora::time), EXTRACT(DOW FROM fecha::date)
        ORDER BY dia, hora
      ` as Promise<{ hora: number; dia: number; total: number }[]>,

      prisma.$queryRaw`
        SELECT EXTRACT(MONTH FROM fecha::date)::int AS mes,
               EXTRACT(DAY FROM fecha::date)::int AS dia,
               COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY EXTRACT(MONTH FROM fecha::date), EXTRACT(DAY FROM fecha::date)
        ORDER BY mes, dia
      ` as Promise<{ mes: number; dia: number; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${N_CATEGORIA} AS categoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${N_CATEGORIA} ORDER BY total DESC LIMIT 10
      ` as Promise<{ categoria: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${SCAT} AS subcategoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${SCAT_GROUP} ORDER BY total DESC LIMIT 20
      ` as Promise<{ subcategoria: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT dominio, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY dominio ORDER BY total DESC LIMIT 20
      ` as Promise<{ dominio: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT ${CL_COL} AS cliente, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereActual}
        GROUP BY ${CL_COL} ORDER BY total DESC LIMIT 20
      ` as Promise<{ cliente: string; total: number }[]>,

      prisma.$queryRaw`
        SELECT COUNT(DISTINCT ${CL_COL})::int AS total
        FROM public.v_unificado_norm ${whereActual}
      ` as Promise<{ total: number }[]>,
    ]);

    let evolCatRaw: { periodo: Date; categoria: string; total: number }[] = [];
    if (topCatsGlobal.length > 0) {
      const catFilter = topCatsGlobal.map((c) => Prisma.sql`${c.categoria}` as Prisma.Sql);
      const whereCats = whereConCanal(whereActual, Prisma.sql`${N_CATEGORIA} = ANY(ARRAY[${Prisma.join(catFilter)}]::text[])`);
      evolCatRaw = await prisma.$queryRaw`
        SELECT fecha::date AS periodo, ${N_CATEGORIA} AS categoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereCats}
        GROUP BY fecha::date, ${N_CATEGORIA} ORDER BY periodo, total DESC
      ` as { periodo: Date; categoria: string; total: number }[];
    }

    let evolSubRaw: { periodo: Date; subcategoria: string; total: number }[] = [];
    if (topSubGlobal.length > 0) {
      const subFilter = topSubGlobal.map((s) => Prisma.sql`${s.subcategoria}` as Prisma.Sql);
      const whereSubs = whereConCanal(whereActual, Prisma.sql`${SCAT} = ANY(ARRAY[${Prisma.join(subFilter)}]::text[])`);
      evolSubRaw = await prisma.$queryRaw`
        SELECT fecha::date AS periodo, ${SCAT} AS subcategoria, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereSubs}
        GROUP BY fecha::date, ${SCAT_GROUP} ORDER BY periodo, total DESC
      ` as { periodo: Date; subcategoria: string; total: number }[];
    }

    let evolDomRaw: { periodo: Date; dominio: string; total: number }[] = [];
    if (topDomGlobal.length > 0) {
      const domFilter = topDomGlobal.map((d) => Prisma.sql`${d.dominio}` as Prisma.Sql);
      const whereDoms = whereConCanal(whereActual, Prisma.sql`dominio = ANY(ARRAY[${Prisma.join(domFilter)}]::text[])`);
      evolDomRaw = await prisma.$queryRaw`
        SELECT fecha::date AS periodo, dominio, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereDoms}
        GROUP BY fecha::date, dominio ORDER BY periodo, total DESC
      ` as { periodo: Date; dominio: string; total: number }[];
    }

    let evolClienteRaw: { periodo: Date; cliente: string; total: number }[] = [];
    if (topCliGlobal.length > 0) {
      const cliFilter = topCliGlobal.map((c) => Prisma.sql`${c.cliente}` as Prisma.Sql);
      const whereClis = whereConCanal(whereActual, Prisma.sql`${CL_COL} = ANY(ARRAY[${Prisma.join(cliFilter)}]::text[])`);
      evolClienteRaw = await prisma.$queryRaw`
        SELECT fecha::date AS periodo, ${CL_COL} AS cliente, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${whereClis}
        GROUP BY fecha::date, ${CL_COL} ORDER BY periodo, total DESC
      ` as { periodo: Date; cliente: string; total: number }[];
    }

    let volumenAnterior: number | null = null;
    let slaAnterior: number | null = null;
    let fcrAnterior: number | null = null;
    let tiemposPrimeraAnt: number | null = null;
    let tiemposResolucionAnt: number | null = null;
    let clientesAnt: number | null = null;
    let catActTotals: { categoria: string; total: number }[] = [];
    let catAntTotals: { categoria: string; total: number }[] = [];
    let cliActTotals: { cliente: string; total: number }[] = [];
    let cliAntTotals: { cliente: string; total: number }[] = [];
    let paisActTotals: { pais: string; total: number }[] = [];
    let paisAntTotals: { pais: string; total: number }[] = [];
    let asesoresActTotals: { asesor: string; total: number }[] = [];
    let asesoresAntTotals: { asesor: string; total: number }[] = [];

    if (filters.fechaHoraInicio && filters.fechaHoraFin) {
      const prev = rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin);
      const wherePrev = construirWhere({ ...filters, fechaHoraInicio: prev.inicio, fechaHoraFin: prev.fin });
      const [totalPrev, slaPrev, clientesPrevRaw, catAct, catAnt, cliAct, cliAnt, paisAct, paisAnt, asesAct, asesAnt] = await Promise.all([
        totales(wherePrev),
        slaTotales(wherePrev),
        prisma.$queryRaw`SELECT COUNT(DISTINCT ${CL_COL})::int AS total FROM public.v_unificado_norm ${wherePrev}` as Promise<{ total: number }[]>,
        prisma.$queryRaw`SELECT ${N_CATEGORIA} AS categoria, COUNT(*)::int AS total FROM public.v_unificado_norm ${whereActual} GROUP BY ${N_CATEGORIA} ORDER BY total DESC` as Promise<{ categoria: string; total: number }[]>,
        prisma.$queryRaw`SELECT ${N_CATEGORIA} AS categoria, COUNT(*)::int AS total FROM public.v_unificado_norm ${wherePrev} GROUP BY ${N_CATEGORIA} ORDER BY total DESC` as Promise<{ categoria: string; total: number }[]>,
        prisma.$queryRaw`SELECT ${CL_COL} AS cliente, COUNT(*)::int AS total FROM public.v_unificado_norm ${whereActual} GROUP BY ${CL_COL} ORDER BY total DESC LIMIT 30` as Promise<{ cliente: string; total: number }[]>,
        prisma.$queryRaw`SELECT ${CL_COL} AS cliente, COUNT(*)::int AS total FROM public.v_unificado_norm ${wherePrev} GROUP BY ${CL_COL} ORDER BY total DESC LIMIT 30` as Promise<{ cliente: string; total: number }[]>,
        prisma.$queryRaw`SELECT ${N_PAIS} AS pais, COUNT(*)::int AS total FROM public.v_unificado_norm ${whereActual} GROUP BY ${N_PAIS} ORDER BY total DESC` as Promise<{ pais: string; total: number }[]>,
        prisma.$queryRaw`SELECT ${N_PAIS} AS pais, COUNT(*)::int AS total FROM public.v_unificado_norm ${wherePrev} GROUP BY ${N_PAIS} ORDER BY total DESC` as Promise<{ pais: string; total: number }[]>,
        prisma.$queryRaw`SELECT ${N_ASESOR_COALESCE} AS asesor, COUNT(*)::int AS total FROM public.v_unificado_norm ${whereActual} GROUP BY ${N_ASESOR_COALESCE} ORDER BY total DESC` as Promise<{ asesor: string; total: number }[]>,
        prisma.$queryRaw`SELECT ${N_ASESOR_COALESCE} AS asesor, COUNT(*)::int AS total FROM public.v_unificado_norm ${wherePrev} GROUP BY ${N_ASESOR_COALESCE} ORDER BY total DESC` as Promise<{ asesor: string; total: number }[]>,
      ]);
      volumenAnterior = totalPrev.total;
      tiemposPrimeraAnt = totalPrev.prom_primera;
      tiemposResolucionAnt = totalPrev.prom_resolucion;
      slaAnterior = slaPrev.pr_con_dato > 0 ? Math.round((slaPrev.pr_dentro / slaPrev.pr_con_dato) * 1000) / 10 : null;
      fcrAnterior = totalPrev.total > 0 ? Math.round(((totalPrev.cerrados + totalPrev.resueltos) / totalPrev.total) * 1000) / 10 : null;
      clientesAnt = clientesPrevRaw[0]?.total ?? null;
      catActTotals = catAct; catAntTotals = catAnt;
      cliActTotals = cliAct; cliAntTotals = cliAnt;
      paisActTotals = paisAct; paisAntTotals = paisAnt;
      asesoresActTotals = asesAct; asesoresAntTotals = asesAnt;
    }

    const slaPctActual = slaActual.pr_con_dato > 0 ? Math.round((slaActual.pr_dentro / slaActual.pr_con_dato) * 1000) / 10 : null;
    const fcrActual = totalActual.total > 0 ? Math.round(((totalActual.cerrados + totalActual.resueltos) / totalActual.total) * 1000) / 10 : null;
    const clientesAct = clientesActRaw[0]?.total ?? null;

    const alertas: Alerta[] = [];
    if (catActTotals.length > 0 && catAntTotals.length > 0) {
      const catAntMap = new Map(catAntTotals.map((r) => [r.categoria, r.total]));
      for (const r of catActTotals) {
        const ant = catAntMap.get(r.categoria) ?? 0;
        if (ant > 0) {
          const pct = Math.round(((r.total - ant) / ant) * 1000) / 10;
          if (pct > 20) alertas.push({ tipo: "crecimiento_categoria", mensaje: `"${r.categoria}" creció ${pct}% en volumen vs período anterior`, severidad: "alto" });
          else if (pct < -20) alertas.push({ tipo: "decrecimiento_categoria", mensaje: `"${r.categoria}" cayó ${Math.abs(pct)}% en volumen vs período anterior`, severidad: "medio" });
        }
      }
    }
    if (cliActTotals.length > 0 && cliAntTotals.length > 0) {
      const cliAntMap = new Map(cliAntTotals.map((r) => [r.cliente, r.total]));
      for (const r of cliActTotals) {
        const ant = cliAntMap.get(r.cliente) ?? 0;
        if (ant > 0) { const pct = Math.round(((r.total - ant) / ant) * 1000) / 10; if (pct > 30) alertas.push({ tipo: "crecimiento_cliente", mensaje: `"${r.cliente}" incrementó sus atenciones un ${pct}%`, severidad: "medio" }); }
      }
    }
    if (paisActTotals.length > 0 && paisAntTotals.length > 0) {
      const paisAntMap = new Map(paisAntTotals.map((r) => [r.pais, r.total]));
      for (const r of paisActTotals) {
        const ant = paisAntMap.get(r.pais) ?? 0;
        if (ant > 0) { const pct = Math.round(((r.total - ant) / ant) * 1000) / 10; if (Math.abs(pct) > 30) alertas.push({ tipo: "variacion_pais", mensaje: `"${r.pais}" varió ${pct}% en incidentes vs período anterior`, severidad: pct > 0 ? "alto" : "bajo" }); }
      }
    }
    if (slaAnterior !== null && slaPctActual !== null) {
      const diff = slaPctActual - slaAnterior;
      if (diff < -5) alertas.push({ tipo: "caida_sla", mensaje: `El cumplimiento SLA cayó ${Math.abs(diff).toFixed(1)} puntos vs período anterior`, severidad: "alto" });
    }
    if (totalActual.prom_primera !== null && tiemposPrimeraAnt !== null) {
      const diff = totalActual.prom_primera - tiemposPrimeraAnt;
      if (diff > 10) alertas.push({ tipo: "aumento_primera_respuesta", mensaje: `Tiempo de 1ª respuesta aumentó ${Math.round(diff)} min vs período anterior`, severidad: "alto" });
    }
    if (totalActual.prom_resolucion !== null && tiemposResolucionAnt !== null) {
      const diff = totalActual.prom_resolucion - tiemposResolucionAnt;
      if (diff > 30) alertas.push({ tipo: "aumento_resolucion", mensaje: `Tiempo de resolución aumentó ${Math.round(diff)} min vs período anterior`, severidad: "medio" });
    }
    if (asesoresActTotals.length > 0 && asesoresAntTotals.length > 0) {
      const asesAntMap = new Map(asesoresAntTotals.map((r) => [r.asesor, r.total]));
      for (const r of asesoresActTotals) {
        const ant = asesAntMap.get(r.asesor);
        if (ant !== undefined && ant > 0) { const pct = Math.round(((r.total - ant) / ant) * 1000) / 10; if (Math.abs(pct) > 40) alertas.push({ tipo: "carga_asesor", mensaje: `"${r.asesor}" cambió su carga ${pct > 0 ? "+" : ""}${pct}%`, severidad: Math.abs(pct) > 60 ? "alto" : "medio" }); }
      }
    }

    const fmt = (d: Date | string) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
    const slaPctCalc = (conDato: number, cumple: number) => (conDato > 0 ? Math.round((cumple / conDato) * 1000) / 10 : null);

    return {
      kpis: {
        variacionVolumen: comparar(totalActual.total, volumenAnterior).deltaPct,
        variacionTiempoPrimera: comparar(totalActual.prom_primera, tiemposPrimeraAnt).deltaPct,
        variacionTiempoResolucion: comparar(totalActual.prom_resolucion, tiemposResolucionAnt).deltaPct,
        variacionSla: comparar(slaPctActual, slaAnterior).deltaPct,
        variacionFcr: comparar(fcrActual, fcrAnterior).deltaPct,
        variacionClientesUnicos: comparar(clientesAct, clientesAnt).deltaPct,
      },
      evolucionVolumen: evolRaw.map((r) => ({ periodo: fmt(r.periodo), total: r.total })),
      evolucionCanal: evolCanalRaw.map((r) => ({ periodo: fmt(r.periodo), canal: r.canal, total: r.total })),
      evolucionSubcanal: evolSubcanalRaw.map((r) => ({ periodo: fmt(r.periodo), subcanal: r.subcanal, total: r.total })),
      evolucionCategoria: evolCatRaw.map((r) => ({ periodo: fmt(r.periodo), categoria: r.categoria, total: r.total })),
      evolucionSubcategoria: evolSubRaw.map((r) => ({ periodo: fmt(r.periodo), subcategoria: r.subcategoria, total: r.total })),
      evolucionAsesor: evolAsesorRaw.map((r) => ({ periodo: fmt(r.periodo), asesor: r.asesor, total: r.total })),
      evolucionPais: evolPaisRaw.map((r) => ({ periodo: fmt(r.periodo), pais: r.pais, total: r.total })),
      evolucionDominio: evolDomRaw.map((r) => ({ dominio: r.dominio, periodo: fmt(r.periodo), total: r.total })),
      evolucionCliente: evolClienteRaw.map((r) => ({ periodo: fmt(r.periodo), cliente: r.cliente, total: r.total })),
      tendenciaSla: slaTendRaw.map((r) => ({ periodo: fmt(r.periodo), pctCumple: slaPctCalc(r.conDato, r.cumple) })),
      tendenciaTiempos: tiemposTendRaw.map((r) => ({ periodo: fmt(r.periodo), primeraRespuesta: r.primeraRespuesta, resolucion: r.resolucion, espera: r.espera })),
      tendenciaQuintiles: quintilesTendRaw.map((r) => ({ periodo: fmt(r.periodo), quintil: r.quintil, promedio: r.promedio })),
      estacionalidad: estacionalidadHourRaw.map((r) => ({ hora: r.hora, dia: r.dia, total: r.total })),
      estacionalidadMes: estacionalidadMonthRaw.map((r) => ({ mes: r.mes, dia: r.dia, total: r.total })),
      alertas,
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

    return { filas, totales: totales[0] ?? filas[0], paisCanal, paisCanalSub };
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
        (SELECT array_agg(DISTINCT dominio ORDER BY dominio) FROM public.v_unificado_norm WHERE dominio IS NOT NULL AND dominio <> '') AS dominio,
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
    const where = construirWhere(filters);
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
        COALESCE(NULLIF(TRIM(dominio), ''), '—') AS dominio,
        COALESCE(NULLIF(TRIM(tipo_cliente), ''), NULL) AS "tipoCliente"
      FROM public.v_unificado_norm ${where}
      ORDER BY fecha DESC, hora DESC
      LIMIT ${limite} OFFSET ${offset}
    `) as DetalleFila[];

    return { filas, total, pagina, limite, totalPaginas };
  },

  /** Quejas y Devoluciones — reporte analitico completo */
  async quejasDevoluciones(filters: DashboardFilters): Promise<QuejasDevolucionesResponse> {
    const whereActual = construirWhere(filters);
    const NORM = Prisma.sql`cope_scat_normalizada(subcategoria)`;
    const FILTRO = Prisma.sql`${N_CATEGORIA} = 'GESTION' AND ${NORM} IN ('queja', 'solicitud de devolucion')`;
    const w = whereActual === Prisma.empty
      ? Prisma.sql`WHERE ${FILTRO}`
      : Prisma.sql`${whereActual} AND ${FILTRO}`;

    // Periodo anterior para variacion (solo si hay fechas definidas)
    const tieneFechas = !!(filters.fechaHoraInicio && filters.fechaHoraFin);
    let prevTotal: number | null = null;
    let prevQ: number | null = null;
    let prevD: number | null = null;
    if (tieneFechas) {
      const prev = rangoAnterior(filters.fechaHoraInicio!, filters.fechaHoraFin!);
      const wherePrev = construirWhere({ ...filters, fechaHoraInicio: prev.inicio, fechaHoraFin: prev.fin });
      const wPrev = wherePrev === Prisma.empty
        ? Prisma.sql`WHERE ${FILTRO}`
        : Prisma.sql`${wherePrev} AND ${FILTRO}`;
      const prevCounts = await Promise.all([
        prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM public.v_unificado_norm ${wherePrev}` as Promise<{ total: number }[]>,
        prisma.$queryRaw`
          SELECT COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
                 COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
          FROM public.v_unificado_norm ${wPrev}
        ` as Promise<{ quejas: number; devoluciones: number }[]>,
      ]);
      prevTotal = prevCounts[0][0]?.total ?? 0;
      prevQ = prevCounts[1][0]?.quejas ?? 0;
      prevD = prevCounts[1][0]?.devoluciones ?? 0;
    }

    const G = Prisma.sql`CASE WHEN canal ILIKE '%what%' THEN 'WhatsApp' ELSE 'Correo' END`;
    const CL = Prisma.sql`COALESCE(NULLIF(TRIM(contacto), ''), 'Sin cliente')`;

    // Ejecutar queries secuencialmente para aislar errores
    let kpisRaw: { total: number }[] = [];
    let evolRaw: { periodo: string; quejas: number; devoluciones: number }[] = [];
    let canalRaw: { canal: string; quejas: number; devoluciones: number }[] = [];
    let paisRaw: { pais: string; quejas: number; devoluciones: number }[] = [];
    let asesorRaw: { asesor: string; quejas: number; devoluciones: number }[] = [];
    let clienteRaw: { cliente: string; quejas: number; devoluciones: number }[] = [];
    let diaRaw: { fecha: string; quejas: number; devoluciones: number }[] = [];
    let diaSemanaRaw: { dia: string; orden: number; quejas: number; devoluciones: number }[] = [];
    let horaRaw: { hora: number; quejas: number; devoluciones: number }[] = [];
    let tiemposRaw: { tipo: string; respuesta_prom: number | null; resolucion_prom: number | null }[] = [];
    let totalClientesRaw: { total: number }[] = [];

    kpisRaw = await prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM public.v_unificado_norm ${whereActual}` as Promise<{ total: number }[]>;
    evolRaw = await prisma.$queryRaw`
      SELECT TO_CHAR(fecha, 'YYYY-MM') AS periodo,
             COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
      FROM public.v_unificado_norm ${w}
      GROUP BY TO_CHAR(fecha, 'YYYY-MM') ORDER BY periodo
    ` as Promise<{ periodo: string; quejas: number; devoluciones: number }[]>;
    canalRaw = await prisma.$queryRaw`
      SELECT ${G} AS canal,
             COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
      FROM public.v_unificado_norm ${w}
      GROUP BY canal ORDER BY canal
    ` as Promise<{ canal: string; quejas: number; devoluciones: number }[]>;
    paisRaw = await prisma.$queryRaw`
      SELECT ${N_PAIS} AS pais,
             COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
      FROM public.v_unificado_norm ${w}
      GROUP BY ${N_PAIS} ORDER BY COUNT(*) DESC
    ` as Promise<{ pais: string; quejas: number; devoluciones: number }[]>;
    asesorRaw = await prisma.$queryRaw`
      SELECT ${N_ASESOR_COALESCE} AS asesor,
             COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
      FROM public.v_unificado_norm ${w}
      GROUP BY ${N_ASESOR_COALESCE} ORDER BY COUNT(*) DESC
    ` as Promise<{ asesor: string; quejas: number; devoluciones: number }[]>;
    clienteRaw = await prisma.$queryRaw`
      SELECT ${CL} AS cliente,
             COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
      FROM public.v_unificado_norm ${w}
      GROUP BY ${CL} ORDER BY COUNT(*) DESC
    ` as Promise<{ cliente: string; quejas: number; devoluciones: number }[]>;
    diaRaw = await prisma.$queryRaw`
      SELECT TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha,
             COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
      FROM public.v_unificado_norm ${w}
      GROUP BY fecha::date ORDER BY fecha
    ` as Promise<{ fecha: string; quejas: number; devoluciones: number }[]>;
    diaSemanaRaw = await prisma.$queryRaw`
      SELECT TRIM(TO_CHAR(fecha, 'Day')) AS dia,
             EXTRACT(DOW FROM fecha)::int AS orden,
             COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
      FROM public.v_unificado_norm ${w}
      GROUP BY TRIM(TO_CHAR(fecha, 'Day')), EXTRACT(DOW FROM fecha)
      ORDER BY orden
    ` as Promise<{ dia: string; orden: number; quejas: number; devoluciones: number }[]>;
    horaRaw = await prisma.$queryRaw`
      SELECT SPLIT_PART(hora::text, ':', 1)::int AS hora,
             COUNT(*) FILTER (WHERE ${NORM} = 'queja')::int AS quejas,
             COUNT(*) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::int AS devoluciones
      FROM public.v_unificado_norm ${w}
      GROUP BY SPLIT_PART(hora::text, ':', 1)::int
      ORDER BY hora
    ` as Promise<{ hora: number; quejas: number; devoluciones: number }[]>;
    tiemposRaw = await prisma.$queryRaw`
      SELECT 'QUEJA' AS tipo,
             ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${NORM} = 'queja')::numeric, 1)::float8 AS respuesta_prom,
             ROUND(AVG(resolucion_min_norm) FILTER (WHERE ${NORM} = 'queja')::numeric, 1)::float8 AS resolucion_prom
      FROM public.v_unificado_norm ${w}
      UNION ALL
      SELECT 'DEVOLUCION' AS tipo,
             ROUND(AVG(primera_respuesta_min_norm) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::numeric, 1)::float8 AS respuesta_prom,
             ROUND(AVG(resolucion_min_norm) FILTER (WHERE ${NORM} = 'solicitud de devolucion')::numeric, 1)::float8 AS resolucion_prom
      FROM public.v_unificado_norm ${w}
    ` as Promise<{ tipo: string; respuesta_prom: number | null; resolucion_prom: number | null }[]>;
    totalClientesRaw = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT contacto)::int AS total
      FROM public.v_unificado_norm ${w}
        AND contacto IS NOT NULL AND TRIM(contacto) <> ''
    ` as Promise<{ total: number }[]>;

    const totalGeneral = kpisRaw[0]?.total ?? 0;
    const totalQuejas = evolRaw.reduce((s, r) => s + r.quejas, 0);
    const totalDevoluciones = evolRaw.reduce((s, r) => s + r.devoluciones, 0);

    const computeVariation = (curr: number, prev: number | null) => ({
      actual: curr,
      anterior: prev,
      delta: prev != null ? curr - prev : null,
      pct: prev != null && prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null,
    });

    return {
      totalQuejas, totalDevoluciones, totalGeneral,
      totalClientesConNombre: totalClientesRaw[0]?.total ?? 0,
      evolucion: evolRaw,
      porCanal: canalRaw,
      porPais: paisRaw,
      porAsesor: asesorRaw,
      porCliente: clienteRaw,
      porDia: diaRaw,
      porDiaSemana: diaSemanaRaw,
      porHora: horaRaw,
      tiempos: tiemposRaw.map((r) => ({ tipo: r.tipo, primeraRespuestaPromedio: r.respuesta_prom, resolucionPromedio: r.resolucion_prom })),
      variacion: {
        total: computeVariation(totalGeneral, prevTotal),
        quejas: computeVariation(totalQuejas, prevQ),
        devoluciones: computeVariation(totalDevoluciones, prevD),
      },
    };
  },
};
