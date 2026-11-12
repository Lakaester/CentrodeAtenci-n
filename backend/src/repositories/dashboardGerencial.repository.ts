/**
 * Dashboard gerencial C.O.S.E — lectura consolidada de v_unificado_norm.
 *
 * Objetivo: entregar en una sola llamada todos los indicadores del panel
 * (demanda, tiempos, SLA, tendencias, equipo, causas, alertas e insights)
 * usando el MISMO WHERE para todos los componentes. Así los totales de los
 * gráficos coinciden con los KPI.
 *
 * Reglas respetadas:
 * - No se modifican datos ni reglas de negocio.
 * - Los umbrales SLA se importan de la configuración vigente del proyecto
 *   (SLA_MINUTOS en unificado.repository), no se duplican aquí.
 * - Los filtros usan la misma utilidad construirWhere() que el resto del BI.
 * - Las métricas sin fuente se devuelven como null y se documentan en brechas.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { DashboardFilters } from "../types";
import { construirWhere, rangoAnterior, comparar, type KpiComparado } from "../utils/filtros";
import { SLA_MINUTOS } from "./unificado.repository";
import { normalizeDomain } from "../domain/contacto/normalizacion";

/* ─────────────────────────── Tipos de salida ─────────────────────────── */

export interface Dist {
  etiqueta: string;
  total: number;
}

export interface TrendRow {
  periodo: string;
  total: number;
  gestionadas: number;
  slaPrimeraPct: number | null;
  slaResolucionPct: number | null;
  primera: number | null;
  solucion: number | null;
}

export interface SlaCanalRow {
  etiqueta: string;
  total: number;
  primeraPct: number | null;
  primeraDentro: number;
  primeraEvaluados: number;
  resolucionPct: number | null;
  resolucionDentro: number;
  resolucionEvaluados: number;
}

export interface AsesorRow {
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

export interface GerencialResponse {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  generadoEn: string;
  cobertura: { total: number; desde: string | null; hasta: string | null };
  slaMetas: typeof SLA_MINUTOS;
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
    recibidas: KpiComparado;
    gestionadas: KpiComparado;
    slaPrimeraPct: KpiComparado;
    slaResolucionPct: KpiComparado;
    primera: KpiComparado;
    atencion: KpiComparado;
    solucion: KpiComparado;
  };
  tendencia: {
    diaria: TrendRow[];
    anterior: TrendRow[];
    semanal: TrendRow[];
    mensual: TrendRow[];
  };
  distribuciones: {
    estado: Dist[];
    canal: Dist[];
    subcanal: Dist[];
    pais: Dist[];
    categoria: Dist[];
    categoriaAnterior: Dist[];
    subcategoria: Dist[];
    dominio: Dist[];
    asesor: Dist[];
    tipoCliente: Dist[];
    departamento: Dist[];
  };
  horas: { hora: number; total: number }[];
  heatmap: { dia: number; hora: number; total: number }[];
  slaPorCanal: SlaCanalRow[];
  asesores: AsesorRow[];
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

/* ─────────────────────────── Helpers ─────────────────────────── */

type Raw = Record<string, unknown>;

const n = (v: unknown): number => Number(v ?? 0);
const nOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const pct = (dentro: number, evaluados: number): number | null =>
  evaluados > 0 ? Math.round((dentro / evaluados) * 1000) / 10 : null;

const SIN_ASESOR = "Sin asesor";
const ASESOR_KEY = Prisma.sql`COALESCE(NULLIF(INITCAP(TRANSLATE(SPLIT_PART(REPLACE(asesor, '_', ' '), ' ', 1), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun')), ''), ${SIN_ASESOR})`;

const SLA_PR = Prisma.sql`CASE
  WHEN canal ILIKE '%what%' THEN ${SLA_MINUTOS.primeraRespuesta.whatsapp}
  WHEN canal ILIKE '%correo%' OR canal ILIKE '%zendesk%' THEN ${SLA_MINUTOS.primeraRespuesta.correo}
  ELSE ${SLA_MINUTOS.primeraRespuesta.otro}
END`;

const SLA_RES = Prisma.sql`CASE
  WHEN canal ILIKE '%what%' THEN ${SLA_MINUTOS.resolucion.whatsapp}
  WHEN canal ILIKE '%correo%' OR canal ILIKE '%zendesk%' THEN ${SLA_MINUTOS.resolucion.correo}
  ELSE ${SLA_MINUTOS.resolucion.otro}
END`;

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normKey(s: string): string {
  return stripAccents(s).toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b[\p{L}]/gu, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function mergeDist(rows: Raw[], limit: number, keyFn: (s: string) => string, labelFn: (s: string) => string): Dist[] {
  const map = new Map<string, Dist>();
  for (const r of rows) {
    const raw = String(r.etiqueta ?? "Sin dato");
    const key = keyFn(raw);
    if (!key) continue;
    const cur = map.get(key);
    if (cur) cur.total += n(r.total);
    else map.set(key, { etiqueta: labelFn(raw), total: n(r.total) });
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

/**
 * WHERE específico del dashboard gerencial.
 * Los filtros de asesor/subcategoría/país se comparan con la MISMA
 * normalización con la que se muestran en el panel; de lo contrario,
 * "Danilo" no incluiría "Danilo P" ni "Activacion Fe" incluiría
 * "activacion_fe". El resto de filtros sigue usando construirWhere().
 */
function whereGerencial(
  filters: DashboardFilters,
  opts?: { endExclusive?: boolean; fechaRangoSargable?: boolean },
): Prisma.Sql {
  const { asesor, subcategoria, pais, ...resto } = filters;
  const base = construirWhere(resto, opts);
  const conds: Prisma.Sql[] = [];

  if (asesor?.length) {
    const keys = asesor.map((a) => {
      const t = a.trim();
      if (/^sin asesor$/i.test(t)) return SIN_ASESOR;
      return titleCase(t.split(/\s+/)[0] ?? t);
    });
    conds.push(Prisma.sql`${ASESOR_KEY} = ANY(${keys})`);
  }
  if (subcategoria?.length) {
    conds.push(Prisma.sql`cope_scat_normalizada(subcategoria) = ANY(${subcategoria.map(normKey)})`);
  }
  if (pais?.length) {
    const paises = pais.map((p) => titleCase(stripAccents(p.replace(/_/g, " "))));
    conds.push(
      Prisma.sql`INITCAP(TRANSLATE(REPLACE(TRIM(pais), '_', ' '), 'áéíóúÁÉÍÓÚüñ', 'aeiouAEIOUun')) = ANY(${paises})`,
    );
  }

  if (conds.length === 0) return base;
  const extra = Prisma.join(conds, " AND ");
  return base === Prisma.empty
    ? Prisma.sql`WHERE ${extra}`
    : Prisma.sql`${base} AND ${extra}`;
}

async function grupo(where: Prisma.Sql, col: Prisma.Sql, limit = 100): Promise<Raw[]> {
  return (await prisma.$queryRaw(Prisma.sql`
    SELECT COALESCE(${col}, 'Sin dato') AS etiqueta, COUNT(*)::int AS total
    FROM public.v_unificado_norm
    ${where}
    GROUP BY 1
    ORDER BY total DESC
    LIMIT ${limit}
  `)) as unknown as Raw[];
}

interface Agregado {
  recibidas: number;
  gestionadas: number;
  cerradas: number;
  resueltas: number;
  pendientes: number;
  sin_mapear: number;
  derivadas: number;
  primera: number | null;
  atencion: number | null;
  solucion: number | null;
  pr_eval: number;
  pr_dentro: number;
  res_eval: number;
  res_dentro: number;
}

async function agregados(where: Prisma.Sql): Promise<Agregado> {
  const rows = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      COUNT(*)::int AS recibidas,
      COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS gestionadas,
      COUNT(*) FILTER (WHERE estado_homologado = 'cerrado')::int AS cerradas,
      COUNT(*) FILTER (WHERE estado_homologado = 'resuelto')::int AS resueltas,
      COUNT(*) FILTER (WHERE estado_homologado IN ('abierto', 'pendiente'))::int AS pendientes,
      COUNT(*) FILTER (WHERE estado_homologado = 'sin_mapear')::int AS sin_mapear,
      COUNT(*) FILTER (
        WHERE departamento IS NOT NULL AND departamento NOT ILIKE 'Soporte En Linea'
      )::int AS derivadas,
      ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primera,
      ROUND(AVG(respuesta_promedio_min_norm)::numeric, 1)::float8 AS atencion,
      ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS solucion,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS pr_eval,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${SLA_PR})::int AS pr_dentro,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS res_eval,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${SLA_RES})::int AS res_dentro
    FROM public.v_unificado_norm
    ${where}
  `)) as unknown as Raw[];
  const r = rows[0] ?? {};
  return {
    recibidas: n(r.recibidas),
    gestionadas: n(r.gestionadas),
    cerradas: n(r.cerradas),
    resueltas: n(r.resueltas),
    pendientes: n(r.pendientes),
    sin_mapear: n(r.sin_mapear),
    derivadas: n(r.derivadas),
    primera: nOrNull(r.primera),
    atencion: nOrNull(r.atencion),
    solucion: nOrNull(r.solucion),
    pr_eval: n(r.pr_eval),
    pr_dentro: n(r.pr_dentro),
    res_eval: n(r.res_eval),
    res_dentro: n(r.res_dentro),
  };
}

async function reincidenciasGlobal(whereFinal: Prisma.Sql): Promise<number> {
  const rows = (await prisma.$queryRaw(Prisma.sql`
    SELECT COUNT(*)::int AS reincidencias
    FROM (
      SELECT COALESCE(NULLIF(TRIM(contacto), ''), NULLIF(TRIM(numero), ''), NULLIF(TRIM(dominio), '')) AS k
      FROM public.v_unificado_norm
      ${whereFinal}
      GROUP BY 1
      HAVING COUNT(*) > 1
    ) x
  `)) as unknown as Raw[];
  return n(rows[0]?.reincidencias);
}

async function tendencia(where: Prisma.Sql, granularidad: "diaria" | "semanal" | "mensual"): Promise<TrendRow[]> {
  const periodo = granularidad === "diaria"
    ? Prisma.sql`to_char(fecha, 'YYYY-MM-DD')`
    : granularidad === "semanal"
      ? Prisma.sql`to_char(date_trunc('week', fecha), 'YYYY-MM-DD')`
      : Prisma.sql`to_char(date_trunc('month', fecha), 'YYYY-MM')`;

  const rows = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      ${periodo} AS periodo,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS gestionadas,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS pr_eval,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${SLA_PR})::int AS pr_dentro,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS res_eval,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${SLA_RES})::int AS res_dentro,
      ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primera,
      ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS solucion
    FROM public.v_unificado_norm
    ${where}
    GROUP BY 1
    ORDER BY 1
  `)) as unknown as Raw[];

  return rows.map((r) => {
    const prEval = n(r.pr_eval);
    const resEval = n(r.res_eval);
    return {
      periodo: String(r.periodo),
      total: n(r.total),
      gestionadas: n(r.gestionadas),
      slaPrimeraPct: pct(n(r.pr_dentro), prEval),
      slaResolucionPct: pct(n(r.res_dentro), resEval),
      primera: nOrNull(r.primera),
      solucion: nOrNull(r.solucion),
    };
  });
}

async function equipo(where: Prisma.Sql, whereFinal: Prisma.Sql): Promise<AsesorRow[]> {
  const [rows, reinc] = await Promise.all([
    prisma.$queryRaw(Prisma.sql`
      SELECT
        ${ASESOR_KEY} AS asesor,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado_homologado IN ('cerrado', 'resuelto'))::int AS gestionadas,
        COUNT(*) FILTER (WHERE estado_homologado IN ('abierto', 'pendiente'))::int AS pendientes,
        ROUND(AVG(primera_respuesta_min_norm)::numeric, 1)::float8 AS primera,
        ROUND(AVG(resolucion_min_norm)::numeric, 1)::float8 AS solucion,
        COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS pr_eval,
        COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${SLA_PR})::int AS pr_dentro,
        COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS res_eval,
        COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${SLA_RES})::int AS res_dentro
      FROM public.v_unificado_norm
      ${where}
      GROUP BY 1
      ORDER BY total DESC
    `) as unknown as Raw[],
    prisma.$queryRaw(Prisma.sql`
      SELECT ${ASESOR_KEY} AS asesor, COUNT(*)::int AS reincidencias
      FROM (
        SELECT ${ASESOR_KEY} AS asesor,
               COALESCE(NULLIF(TRIM(contacto), ''), NULLIF(TRIM(numero), ''), NULLIF(TRIM(dominio), '')) AS k
        FROM public.v_unificado_norm
        ${whereFinal}
        GROUP BY 1, 2
        HAVING COUNT(*) > 1
      ) x
      GROUP BY 1
    `) as unknown as Raw[],
  ]);

  const reincMap = new Map(reinc.map((r) => [normKey(String(r.asesor ?? SIN_ASESOR)), n(r.reincidencias)]));
  const maxTotal = Math.max(1, ...rows.map((r) => n(r.total)));

  return rows
    .map((r) => {
      const asesor = titleCase(String(r.asesor ?? SIN_ASESOR));
      const total = n(r.total);
      const gestionadas = n(r.gestionadas);
      const prEval = n(r.pr_eval);
      const resEval = n(r.res_eval);
      return {
        asesor,
        total,
        gestionadas,
        pendientes: n(r.pendientes),
        primera: nOrNull(r.primera),
        solucion: nOrNull(r.solucion),
        slaPrimeraPct: pct(n(r.pr_dentro), prEval),
        slaPrimeraDentro: n(r.pr_dentro),
        slaPrimeraEvaluados: prEval,
        slaResolucionPct: pct(n(r.res_dentro), resEval),
        slaResolucionDentro: n(r.res_dentro),
        slaResolucionEvaluados: resEval,
        efectividadPct: total > 0 ? pct(gestionadas, total) : null,
        reincidencias: reincMap.get(normKey(String(r.asesor ?? SIN_ASESOR))) ?? 0,
        cargaRelativa: Math.round((total / maxTotal) * 1000) / 10,
      };
    })
    .sort((a, b) => b.total - a.total);
}

async function slaPorCanal(where: Prisma.Sql): Promise<SlaCanalRow[]> {
  const rows = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      COALESCE(canal, 'Sin canal') AS etiqueta,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL)::int AS pr_eval,
      COUNT(*) FILTER (WHERE primera_respuesta_min_norm IS NOT NULL AND primera_respuesta_min_norm <= ${SLA_PR})::int AS pr_dentro,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL)::int AS res_eval,
      COUNT(*) FILTER (WHERE resolucion_min_norm IS NOT NULL AND resolucion_min_norm <= ${SLA_RES})::int AS res_dentro
    FROM public.v_unificado_norm
    ${where}
    GROUP BY canal
    ORDER BY total DESC
  `)) as unknown as Raw[];
  return rows.map((r) => ({
    etiqueta: String(r.etiqueta ?? "Sin canal"),
    total: n(r.total),
    primeraPct: pct(n(r.pr_dentro), n(r.pr_eval)),
    primeraDentro: n(r.pr_dentro),
    primeraEvaluados: n(r.pr_eval),
    resolucionPct: pct(n(r.res_dentro), n(r.res_eval)),
    resolucionDentro: n(r.res_dentro),
    resolucionEvaluados: n(r.res_eval),
  }));
}

async function backlog(where: Prisma.Sql, endTs: string): Promise<{
  resumen: GerencialResponse["alertas"]["resumen"];
  casos: CasoAlerta[];
}> {
  const rows = (await prisma.$queryRaw(Prisma.sql`
    WITH ab AS (
      SELECT
        ticket_id, to_char(fecha, 'YYYY-MM-DD') AS fecha, hora, canal, asesor, contacto, numero, dominio,
        categoria, estado_homologado, departamento, primera_respuesta_min_norm,
        EXTRACT(EPOCH FROM (${endTs}::timestamp - (fecha::timestamp + hora::time))) / 60 AS edad_min,
        ${SLA_PR} AS sla_pr,
        ${SLA_RES} AS sla_res
      FROM public.v_unificado_norm
      ${where}
    ),
    calc AS (
      SELECT *,
        (edad_min > 72 * 60) AS critico,
        ((primera_respuesta_min_norm IS NULL AND edad_min > sla_pr)
          OR primera_respuesta_min_norm > sla_pr
          OR edad_min > sla_res) AS fuera_sla,
        ((primera_respuesta_min_norm IS NULL AND edad_min BETWEEN 0.7 * sla_pr AND sla_pr)
          OR (edad_min BETWEEN 0.7 * sla_res AND sla_res)) AS proximo,
        (edad_min > 7 * 1440) AS antiguo
      FROM ab
    )
    SELECT
      (SELECT COUNT(*) FROM calc)::int AS backlog,
      (SELECT COUNT(*) FROM calc WHERE critico)::int AS criticos,
      (SELECT COUNT(*) FROM calc WHERE fuera_sla)::int AS fuera_sla,
      (SELECT COUNT(*) FROM calc WHERE proximo)::int AS proximos,
      (SELECT COUNT(*) FROM calc WHERE antiguo)::int AS antiguos,
      (SELECT jsonb_agg(to_jsonb(x)) FROM (
        SELECT ticket_id, fecha, hora, canal, asesor, contacto, numero, dominio, categoria, estado_homologado,
               ROUND(edad_min::numeric, 1)::float8 AS edad_min,
               ROUND(primera_respuesta_min_norm::numeric, 1)::float8 AS primera,
               sla_pr, sla_res, critico, fuera_sla, proximo, antiguo
        FROM calc
        ORDER BY edad_min DESC
        LIMIT 60
      ) x) AS casos
    FROM calc
    LIMIT 1
  `)) as unknown as Raw[];

  const r = rows[0] ?? {};
  const casosRaw = Array.isArray(r.casos) ? (r.casos as Raw[]) : [];
  const casos: CasoAlerta[] = casosRaw.map((c) => ({
    ticketId: c.ticket_id == null ? null : String(c.ticket_id),
    fecha: String(c.fecha ?? ""),
    hora: String(c.hora ?? ""),
    canal: String(c.canal ?? ""),
    asesor: String(c.asesor ?? "Sin asesor"),
    contacto: c.contacto == null ? null : String(c.contacto),
    numero: c.numero == null ? null : String(c.numero),
    dominio: c.dominio == null ? null : String(c.dominio),
    categoria: String(c.categoria ?? "Sin categoría"),
    estado: String(c.estado_homologado ?? ""),
    edadMin: n(c.edad_min),
    primera: nOrNull(c.primera),
    slaPrimera: n(c.sla_pr),
    slaResolucion: n(c.sla_res),
    critico: Boolean(c.critico),
    fueraSla: Boolean(c.fuera_sla),
    proximo: Boolean(c.proximo),
    antiguo: Boolean(c.antiguo),
  }));

  return {
    resumen: {
      backlog: n(r.backlog),
      criticos: n(r.criticos),
      fueraSla: n(r.fuera_sla),
      proximos: n(r.proximos),
      antiguos: n(r.antiguos),
    },
    casos,
  };
}

async function actividad(where: Prisma.Sql): Promise<GerencialResponse["actividad"]> {
  const rows = (await prisma.$queryRaw(Prisma.sql`
    SELECT ticket_id, to_char(fecha, 'YYYY-MM-DD') AS fecha, hora, canal, asesor, contacto, numero, dominio,
           categoria, estado_homologado, departamento
    FROM public.v_unificado_norm
    ${where}
    ORDER BY fecha DESC, hora DESC
    LIMIT 120
  `)) as unknown as Raw[];

  const map = (r: Raw): CasoActividad => ({
    ticketId: r.ticket_id == null ? null : String(r.ticket_id),
    fecha: String(r.fecha ?? ""),
    hora: String(r.hora ?? ""),
    canal: String(r.canal ?? ""),
    asesor: String(r.asesor ?? "Sin asesor"),
    contacto: r.contacto == null ? null : String(r.contacto),
    numero: r.numero == null ? null : String(r.numero),
    dominio: r.dominio == null ? null : String(r.dominio),
    categoria: String(r.categoria ?? "Sin categoría"),
    estado: String(r.estado_homologado ?? ""),
    departamento: r.departamento == null ? null : String(r.departamento),
  });

  const mapped = rows.map(map);
  return {
    recientes: mapped.slice(0, 8),
    cierres: mapped.filter((r) => r.estado === "cerrado" || r.estado === "resuelto").slice(0, 8),
    derivaciones: mapped
      .filter((r) => r.departamento && !/soporte en linea/i.test(r.departamento))
      .slice(0, 8),
  };
}

/* ─────────────────────────── Opciones (cache 5 min) ─────────────────────────── */

interface Opciones {
  canal: string[];
  pais: string[];
  asesor: string[];
  categoria: string[];
  subcategoria: string[];
  dominio: string[];
  estado: string[];
  tipoCliente: string[];
  cobertura: { total: number; desde: string | null; hasta: string | null };
}

let opcionesCache: { at: number; data: Opciones } | null = null;

async function opciones(): Promise<Opciones> {
  if (opcionesCache && Date.now() - opcionesCache.at < 5 * 60_000) return opcionesCache.data;

  const rows = (await prisma.$queryRaw(Prisma.sql`
    WITH b AS MATERIALIZED (
      SELECT canal, pais, asesor, categoria, subcategoria, dominio, estado_homologado, tipo_cliente
      FROM public.v_unificado_norm
    )
    SELECT
      (SELECT jsonb_agg(DISTINCT canal) FROM b WHERE canal IS NOT NULL AND canal <> '') AS canal,
      (SELECT jsonb_agg(DISTINCT pais) FROM b WHERE pais IS NOT NULL AND pais <> '') AS pais,
      (SELECT jsonb_agg(DISTINCT ${ASESOR_KEY}) FROM b WHERE asesor IS NOT NULL AND asesor <> '') AS asesor,
      (SELECT jsonb_agg(DISTINCT categoria) FROM b WHERE categoria IS NOT NULL AND categoria <> '') AS categoria,
      (SELECT jsonb_agg(x.subcategoria) FROM (
        SELECT subcategoria FROM b WHERE subcategoria IS NOT NULL AND subcategoria <> ''
        GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 200
      ) x) AS subcategoria,
      (SELECT jsonb_agg(x.dominio) FROM (
        SELECT dominio FROM b WHERE dominio IS NOT NULL AND dominio <> ''
        GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 200
      ) x) AS dominio,
      (SELECT jsonb_agg(DISTINCT estado_homologado) FROM b WHERE estado_homologado IS NOT NULL) AS estado,
      (SELECT jsonb_agg(DISTINCT tipo_cliente) FROM b WHERE tipo_cliente IS NOT NULL AND tipo_cliente <> '') AS tipo_cliente,
      (SELECT COUNT(*)::int FROM b) AS total,
      (SELECT MIN(fecha)::text FROM public.v_unificado_norm) AS desde,
      (SELECT MAX(fecha)::text FROM public.v_unificado_norm) AS hasta
  `)) as unknown as Raw[];

  const r = rows[0] ?? {};
  const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

  const data: Opciones = {
    canal: strArr(r.canal).sort(),
    pais: [...new Set(strArr(r.pais).map((s) => titleCase(s)))].sort(),
    asesor: [
      ...new Set(
        strArr(r.asesor)
          .map((s) => titleCase(s))
          .filter((s) => s && s.toLowerCase() !== "sin asesor"),
      ),
    ].sort(),
    categoria: strArr(r.categoria).sort(),
    subcategoria: [...new Set(strArr(r.subcategoria).map((s) => titleCase(s)))].sort(),
    dominio: [
      ...new Set(
        strArr(r.dominio)
          .map((d) => normalizeDomain(d))
          .filter((d) => d.includes(".") && !/^\d+$/.test(d)),
      ),
    ].sort(),
    estado: strArr(r.estado),
    tipoCliente: strArr(r.tipo_cliente).sort(),
    cobertura: {
      total: n(r.total),
      desde: r.desde == null ? null : String(r.desde),
      hasta: r.hasta == null ? null : String(r.hasta),
    },
  };
  opcionesCache = { at: Date.now(), data };
  return data;
}

/* ─────────────────────────── Orquestación ─────────────────────────── */

function nowLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export const dashboardGerencialRepository = {
  async obtener(filters: DashboardFilters): Promise<GerencialResponse> {
    const sargable = { fechaRangoSargable: true } as const;
    const where = whereGerencial(filters, sargable);
    const whereFinal = whereGerencial({ ...filters, estado: ["cerrado", "resuelto"] }, sargable);
    const endTs = filters.fechaHoraFin ?? nowLocal();
    const whereBacklog = whereGerencial(
      { ...filters, fechaHoraInicio: undefined, fechaHoraFin: endTs, estado: ["abierto", "pendiente"] },
      { endExclusive: true },
    );

    let prev: { inicio: string; fin: string } | null = null;
    let wherePrev: Prisma.Sql | null = null;
    if (filters.fechaHoraInicio && filters.fechaHoraFin) {
      prev = rangoAnterior(filters.fechaHoraInicio, filters.fechaHoraFin);
      wherePrev = whereGerencial(
        { ...filters, fechaHoraInicio: `${prev.inicio} 00:00`, fechaHoraFin: `${prev.fin} 23:59` },
        { endExclusive: true },
      );
    }

    const [
      actual,
      anterior,
      reincidencias,
      distEstado,
      distCanal,
      distSubcanal,
      distPais,
      distCategoria,
      distCategoriaAnterior,
      distSubcategoria,
      distDominio,
      distAsesor,
      distTipo,
      distDepto,
      trendDiaria,
      trendSemanal,
      trendMensual,
      trendAnterior,
      team,
      slaCanal,
      backlogData,
      actividadData,
      opcionesData,
      horas,
      heatmap,
    ] = await Promise.all([
      agregados(where),
      wherePrev ? agregados(wherePrev) : Promise.resolve(null),
      reincidenciasGlobal(whereFinal),
      grupo(where, Prisma.sql`estado_homologado`, 12),
      grupo(where, Prisma.sql`canal`, 12),
      grupo(where, Prisma.sql`subcanal`, 12),
      grupo(where, Prisma.sql`pais`, 40),
      grupo(where, Prisma.sql`categoria`, 30),
      wherePrev ? grupo(wherePrev, Prisma.sql`categoria`, 30) : Promise.resolve([]),
      grupo(where, Prisma.sql`subcategoria`, 120),
      grupo(where, Prisma.sql`dominio`, 60),
      grupo(where, ASESOR_KEY, 30),
      grupo(where, Prisma.sql`tipo_cliente`, 15),
      grupo(where, Prisma.sql`departamento`, 15),
      tendencia(where, "diaria"),
      tendencia(where, "semanal"),
      tendencia(where, "mensual"),
      wherePrev ? tendencia(wherePrev, "diaria") : Promise.resolve([]),
      equipo(where, whereFinal),
      slaPorCanal(where),
      backlog(whereBacklog, endTs),
      actividad(where),
      opciones(),
      prisma.$queryRaw(Prisma.sql`
        SELECT EXTRACT(HOUR FROM hora::time)::int AS hora, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY 1 ORDER BY 1
      `) as unknown as Promise<Raw[]>,
      prisma.$queryRaw(Prisma.sql`
        SELECT EXTRACT(DOW FROM fecha)::int AS dia, EXTRACT(HOUR FROM hora::time)::int AS hora, COUNT(*)::int AS total
        FROM public.v_unificado_norm ${where}
        GROUP BY 1, 2 ORDER BY 1, 2
      `) as unknown as Promise<Raw[]>,
    ]);

    const slaPrimeraPct = pct(actual.pr_dentro, actual.pr_eval);
    const slaResolucionPct = pct(actual.res_dentro, actual.res_eval);
    const prevSlaPrimera = anterior ? pct(anterior.pr_dentro, anterior.pr_eval) : null;
    const prevSlaResolucion = anterior ? pct(anterior.res_dentro, anterior.res_eval) : null;

    const estadoLabels: Record<string, string> = {
      cerrado: "Cerrado",
      resuelto: "Resuelto",
      abierto: "Abierto",
      pendiente: "Pendiente",
      sin_mapear: "Sin estado válido",
    };

    const distribuciones: GerencialResponse["distribuciones"] = {
      estado: mergeDist(distEstado, 12, (s) => normKey(s), (s) => estadoLabels[normKey(s)] ?? titleCase(s)),
      canal: mergeDist(distCanal, 12, (s) => normKey(s), (s) => s.toUpperCase()),
      subcanal: mergeDist(distSubcanal, 12, (s) => normKey(s), (s) => s.toUpperCase()),
      pais: mergeDist(distPais, 40, (s) => normKey(s), (s) => titleCase(s)),
      categoria: mergeDist(distCategoria, 30, (s) => normKey(s), (s) => s.toUpperCase()),
      categoriaAnterior: mergeDist(distCategoriaAnterior, 30, (s) => normKey(s), (s) => s.toUpperCase()),
      subcategoria: mergeDist(distSubcategoria, 40, (s) => normKey(s), (s) => titleCase(s)),
      dominio: mergeDist(
        distDominio,
        30,
        (s) => {
          const k = normKey(s);
          return k === "sin dato" || k === "sin dominio" ? "sin-dominio" : normKey(normalizeDomain(s) || s);
        },
        (s) => {
          const k = normKey(s);
          return k === "sin dato" || k === "sin dominio" ? "Sin dominio" : normalizeDomain(s) || "Sin dominio";
        },
      ),
      asesor: mergeDist(distAsesor, 30, (s) => normKey(s), (s) => titleCase(s)),
      tipoCliente: mergeDist(distTipo, 15, (s) => normKey(s), (s) => s.toUpperCase()),
      departamento: mergeDist(distDepto, 15, (s) => normKey(s), (s) => titleCase(s)),
    };

    return {
      rango: prev && filters.fechaHoraInicio && filters.fechaHoraFin
        ? { inicio: filters.fechaHoraInicio, fin: filters.fechaHoraFin, comparadoCon: prev }
        : null,
      generadoEn: new Date().toISOString(),
      cobertura: opcionesData.cobertura,
      slaMetas: SLA_MINUTOS,
      kpis: {
        recibidas: actual.recibidas,
        gestionadas: actual.gestionadas,
        cerradas: actual.cerradas,
        resueltas: actual.resueltas,
        pendientes: actual.pendientes,
        sinMapear: actual.sin_mapear,
        derivadas: actual.derivadas,
        reincidencias,
        backlog: backlogData.resumen.backlog,
        criticos: backlogData.resumen.criticos,
        fueraSla: backlogData.resumen.fueraSla,
        proximosVencer: backlogData.resumen.proximos,
        antiguos: backlogData.resumen.antiguos,
        primera: actual.primera,
        atencion: actual.atencion,
        solucion: actual.solucion,
        slaPrimera: { pct: slaPrimeraPct, dentro: actual.pr_dentro, evaluados: actual.pr_eval },
        slaResolucion: { pct: slaResolucionPct, dentro: actual.res_dentro, evaluados: actual.res_eval },
        efectividad: {
          pct: actual.recibidas > 0 ? pct(actual.gestionadas, actual.recibidas) : null,
          gestionadas: actual.gestionadas,
          recibidas: actual.recibidas,
        },
      },
      comparacion: {
        recibidas: comparar(actual.recibidas, anterior?.recibidas ?? null),
        gestionadas: comparar(actual.gestionadas, anterior?.gestionadas ?? null),
        slaPrimeraPct: comparar(slaPrimeraPct, prevSlaPrimera),
        slaResolucionPct: comparar(slaResolucionPct, prevSlaResolucion),
        primera: comparar(actual.primera, anterior?.primera ?? null),
        atencion: comparar(actual.atencion, anterior?.atencion ?? null),
        solucion: comparar(actual.solucion, anterior?.solucion ?? null),
      },
      tendencia: {
        diaria: trendDiaria,
        anterior: trendAnterior,
        semanal: trendSemanal,
        mensual: trendMensual,
      },
      distribuciones,
      horas: horas.map((r) => ({ hora: n(r.hora), total: n(r.total) })),
      heatmap: heatmap.map((r) => ({ dia: n(r.dia), hora: n(r.hora), total: n(r.total) })),
      slaPorCanal: slaCanal,
      asesores: team,
      alertas: backlogData,
      actividad: actividadData,
      opciones: {
        canal: opcionesData.canal,
        pais: opcionesData.pais,
        asesor: opcionesData.asesor,
        categoria: opcionesData.categoria,
        subcategoria: opcionesData.subcategoria,
        dominio: opcionesData.dominio,
        estado: opcionesData.estado,
        tipoCliente: opcionesData.tipoCliente,
      },
      brechas: [
        "Tiempo de espera: la fuente no separa el tiempo de asignación del tiempo de primera respuesta; se informa primera respuesta y no se duplica el valor.",
        "Reaperturas: no existe historial de estados por ticket; no se calcula un indicador de reapertura.",
        "Calidad de atención: no hay evaluación CSAT/QA almacenada en las fuentes; el indicador se muestra como no disponible.",
        "Escalados: no existe un flag de escalamiento; se reporta la derivación por departamento como aproximación operativa.",
        "Cliente único: la vista identifica por contacto, número o dominio, no por un customer_id consolidado; el filtro Cliente se resuelve por dominio.",
        "Producto/módulo: no existe un campo de producto o módulo en v_unificado_norm; no se fabrica esa dimensión.",
        "Registros con estado SI/NO: se homologan como 'sin estado válido' y se excluyen del backlog para no inflar casos abiertos.",
      ],
    };
  },
};
