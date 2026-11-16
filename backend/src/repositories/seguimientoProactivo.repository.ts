/**
 * Repositorio de Seguimiento Proactivo.
 *
 * Persiste casos, lotes semanales, gestiones y auditoría en las tablas sp_*.
 * La lectura de atenciones reutiliza la vista v_unificado_norm con la misma
 * clave de cliente y la misma expresión de fecha que el reporte Clientes.
 */
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { CLIENTE_KEY } from "../utils/clientesIdentificacion";
import { SLA_MINUTOS } from "./unificado.repository";
import type {
  SeguimientoAsesor,
  SeguimientoAtencion,
  SeguimientoAtencionesLista,
  SeguimientoCandidato,
  SeguimientoCaso,
  SeguimientoEstado,
  SeguimientoFiltrosLista,
  SeguimientoGestion,
  SeguimientoLista,
  SeguimientoLote,
  SeguimientoResumen,
} from "../types/seguimientoProactivo";

const CREACION = Prisma.sql`CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END`;

const UMBRAL_RESOLUCION = Prisma.sql`CASE
  WHEN canal ILIKE '%what%' THEN ${SLA_MINUTOS.resolucion.whatsapp}
  WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN ${SLA_MINUTOS.resolucion.correo}
  ELSE ${SLA_MINUTOS.resolucion.otro}
END`;

const BACKLOG_SQL = (semana: Prisma.Sql) => Prisma.sql`
  c.estado <> 'finalizado' AND (
    c.semana_deteccion < ${semana}
    OR (
      c.estado = 'con_pendientes'
      AND c.proximo_contacto_at IS NOT NULL
      AND c.proximo_contacto_at < now()
    )
  )
`;

const DIAS_SIN_CONTACTO = Prisma.sql`
  CASE
    WHEN c.contacto_at IS NULL
      THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - c.primera_deteccion_at)) / 86400))::int
    ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - c.contacto_at)) / 86400))::int
  END
`;

interface CasoRow {
  id: string;
  clave_cliente: string;
  cliente: string;
  estado: SeguimientoEstado;
  asesor_id: string | null;
  asesor_nombre: string | null;
  total: number;
  total_anterior: number;
  variacion_pct: number | null;
  reincidencia_max: number;
  subcategoria_recurrente: string | null;
  tiempo_promedio: number | null;
  con_dato: number;
  no_cumple: number;
  pct_incumple: number | null;
  motivos: unknown;
  senales: number;
  semana_deteccion: string;
  periodo_deteccion: string;
  primera_deteccion_at: Date | string;
  ultima_deteccion_at: Date | string;
  contacto_at: Date | string | null;
  proximo_contacto_at: Date | string | null;
  resumen_contacto: string | null;
  finalizado_at: Date | string | null;
  finalizado_por: string | null;
  en_backlog: boolean;
  dias_sin_contacto: number;
  created_at: Date | string;
  updated_at: Date | string;
}

interface LoteRow {
  id: string;
  periodo: string;
  semana_iso: string;
  desde: string;
  hasta: string;
  generado_por: string | null;
  total_candidatos: number;
  total_casos: number;
  created_at: Date | string;
}

interface GestionRow {
  id: string;
  caso_id: string;
  contacto_at: string;
  proximo_contacto_at: string | null;
  resumen: string;
  estado_anterior: SeguimientoEstado | null;
  estado_nuevo: SeguimientoEstado;
  usuario_id: string | null;
  usuario: string | null;
  created_at: Date | string;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

const LIMA_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Convierte un instante a "YYYY-MM-DD HH:mm" en America/Lima. */
function toLocal(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  const parts = LIMA_FORMATTER.formatToParts(value);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value;
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  const hour = pick("hour");
  const minute = pick("minute");
  if (!year || !month || !day || !hour || !minute) return null;
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function parseMotivos(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapCaso(row: CasoRow): SeguimientoCaso {
  return {
    id: row.id,
    claveCliente: row.clave_cliente,
    cliente: row.cliente,
    estado: row.estado,
    asesorId: row.asesor_id,
    asesorNombre: row.asesor_nombre,
    total: row.total,
    totalAnterior: row.total_anterior,
    variacionPct: row.variacion_pct == null ? null : Number(row.variacion_pct),
    reincidenciaMax: row.reincidencia_max,
    subcategoriaRecurrente: row.subcategoria_recurrente,
    tiempoPromedio: row.tiempo_promedio == null ? null : Number(row.tiempo_promedio),
    conDato: row.con_dato,
    noCumple: row.no_cumple,
    pctIncumple: row.pct_incumple == null ? null : Number(row.pct_incumple),
    motivos: parseMotivos(row.motivos),
    senales: row.senales,
    semanaDeteccion: row.semana_deteccion,
    periodoDeteccion: row.periodo_deteccion,
    primeraDeteccionAt: toIso(row.primera_deteccion_at) as string,
    ultimaDeteccionAt: toIso(row.ultima_deteccion_at) as string,
    contactoAt: toLocal(row.contacto_at),
    proximoContactoAt: toLocal(row.proximo_contacto_at),
    resumenContacto: row.resumen_contacto,
    finalizadoAt: toIso(row.finalizado_at),
    finalizadoPor: row.finalizado_por,
    enBacklog: Boolean(row.en_backlog),
    diasSinContacto: Number(row.dias_sin_contacto ?? 0),
    createdAt: toIso(row.created_at) as string,
    updatedAt: toIso(row.updated_at) as string,
  };
}

function mapLote(row: LoteRow): SeguimientoLote {
  return {
    id: row.id,
    periodo: row.periodo,
    semanaIso: row.semana_iso,
    desde: row.desde,
    hasta: row.hasta,
    generadoPor: row.generado_por,
    totalCandidatos: row.total_candidatos,
    totalCasos: row.total_casos,
    createdAt: toIso(row.created_at) as string,
  };
}

function metricasDe(c: SeguimientoCandidato): string {
  return JSON.stringify({
    total: c.total,
    totalAnterior: c.totalAnterior,
    variacionPct: c.variacionPct,
    reincidenciaMax: c.reincidenciaMax,
    subcategoriaRecurrente: c.subcategoriaRecurrente,
    tiempoPromedio: c.tiempoPromedio,
    conDato: c.conDato,
    noCumple: c.noCumple,
    pctIncumple: c.pctIncumple,
    senales: c.senales,
    motivos: c.motivos,
  });
}

export const seguimientoProactivoRepository = {
  /** Casos abiertos para marcar candidatos que ya están en seguimiento. */
  async abiertosPorClaves(claves: string[]): Promise<Map<string, { id: string; estado: SeguimientoEstado }>> {
    const map = new Map<string, { id: string; estado: SeguimientoEstado }>();
    if (!claves.length) return map;
    const rows = await prisma.$queryRaw<{ id: string; clave_cliente: string; estado: SeguimientoEstado }[]>`
      SELECT id, clave_cliente, estado
      FROM sp_casos
      WHERE estado <> 'finalizado'
        AND clave_cliente IN (${Prisma.join(claves)})
    `;
    for (const r of rows) map.set(r.clave_cliente, { id: r.id, estado: r.estado });
    return map;
  },

  /**
   * Crea o actualiza el lote semanal y sincroniza los casos.
   * Idempotente por (semana_iso, clave_cliente).
   */
  async crearLote(input: {
    periodo: string;
    semanaIso: string;
    desde: string;
    hasta: string;
    usuarioId: string | null;
    usuario: string | null;
    totalCandidatos: number;
    candidatos: SeguimientoCandidato[];
  }): Promise<{ lote: SeguimientoLote; creados: number; actualizados: number }> {
    return prisma.$transaction(
      async (tx) => {
        const loteRows = await tx.$queryRaw<LoteRow[]>`
          INSERT INTO sp_lotes (id, periodo, semana_iso, desde, hasta, generado_por, generado_por_id, total_candidatos)
          VALUES (
            ${randomUUID()}, ${input.periodo}, ${input.semanaIso},
            ${input.desde}::date, ${input.hasta}::date,
            ${input.usuario}, ${input.usuarioId}, ${input.totalCandidatos}
          )
          ON CONFLICT (semana_iso) DO UPDATE SET
            periodo = EXCLUDED.periodo,
            desde = EXCLUDED.desde,
            hasta = EXCLUDED.hasta,
            generado_por = EXCLUDED.generado_por,
            generado_por_id = EXCLUDED.generado_por_id,
            total_candidatos = EXCLUDED.total_candidatos
          RETURNING id, periodo, semana_iso,
                    TO_CHAR(desde, 'YYYY-MM-DD') AS desde,
                    TO_CHAR(hasta, 'YYYY-MM-DD') AS hasta,
                    generado_por, total_candidatos, total_casos, created_at
        `;
        const lote = loteRows[0];
        let creados = 0;
        let actualizados = 0;

        for (const c of input.candidatos) {
          const existentes = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM sp_casos
            WHERE clave_cliente = ${c.clave} AND estado <> 'finalizado'
            LIMIT 1
          `;
          let casoId: string;
          const metricas = metricasDe(c);

          if (existentes.length) {
            casoId = existentes[0].id;
            await tx.$executeRaw`
              UPDATE sp_casos SET
                total = ${c.total},
                total_anterior = ${c.totalAnterior},
                variacion_pct = ${c.variacionPct},
                reincidencia_max = ${c.reincidenciaMax},
                subcategoria_recurrente = ${c.subcategoriaRecurrente},
                tiempo_promedio = ${c.tiempoPromedio},
                con_dato = ${c.conDato},
                no_cumple = ${c.noCumple},
                pct_incumple = ${c.pctIncumple},
                motivos = ${JSON.stringify(c.motivos)}::jsonb,
                senales = ${c.senales},
                ultima_deteccion_at = now(),
                ultimo_lote_id = ${lote.id},
                updated_at = now()
              WHERE id = ${casoId}
            `;
            actualizados++;
          } else {
            casoId = randomUUID();
            await tx.$executeRaw`
              INSERT INTO sp_casos (
                id, clave_cliente, cliente, estado,
                total, total_anterior, variacion_pct, reincidencia_max,
                subcategoria_recurrente, tiempo_promedio, con_dato, no_cumple,
                pct_incumple, motivos, senales,
                semana_deteccion, periodo_deteccion, ultimo_lote_id
              ) VALUES (
                ${casoId}, ${c.clave}, ${c.cliente}, 'sin_seguimiento',
                ${c.total}, ${c.totalAnterior}, ${c.variacionPct}, ${c.reincidenciaMax},
                ${c.subcategoriaRecurrente}, ${c.tiempoPromedio}, ${c.conDato}, ${c.noCumple},
                ${c.pctIncumple}, ${JSON.stringify(c.motivos)}::jsonb, ${c.senales},
                ${input.semanaIso}, ${input.periodo}, ${lote.id}
              )
            `;
            creados++;
          }

          await tx.$executeRaw`
            INSERT INTO sp_caso_semanas (caso_id, lote_id, clave_cliente, metricas)
            VALUES (${casoId}, ${lote.id}, ${c.clave}, ${metricas}::jsonb)
            ON CONFLICT (caso_id, lote_id) DO UPDATE SET metricas = EXCLUDED.metricas
          `;

          await tx.$executeRaw`
            INSERT INTO sp_auditoria (id, caso_id, usuario_id, usuario, accion, campo, valor_nuevo)
            VALUES (
              ${randomUUID()}, ${casoId}, ${input.usuarioId}, ${input.usuario},
              ${existentes.length ? "actualizado" : "creado"}, 'metricas', ${metricas}
            )
          `;
        }

        await tx.$executeRaw`
          UPDATE sp_lotes SET total_casos = ${creados + actualizados} WHERE id = ${lote.id}
        `;

        return {
          lote: mapLote({ ...lote, total_casos: creados + actualizados }),
          creados,
          actualizados,
        };
      },
      { timeout: 60000 },
    );
  },

  async resumen(semana: string, periodo: string): Promise<SeguimientoResumen> {
    const [conteos, porSenal, backlogPorPeriodo, lotes, asesores] = await Promise.all([
      prisma.$queryRaw<
        {
          por_contactar: number;
          con_pendientes: number;
          finalizados: number;
          backlog: number;
          backlog_sin_contacto: number;
          backlog_vencidos: number;
          total_semana: number;
          total_mes: number;
        }[]
      >`
        SELECT
          COUNT(*) FILTER (
            WHERE c.estado = 'sin_seguimiento' AND EXISTS (
              SELECT 1 FROM sp_caso_semanas cs
              JOIN sp_lotes l ON l.id = cs.lote_id
              WHERE cs.caso_id = c.id AND l.semana_iso = ${semana}
            )
          )::int AS por_contactar,
          COUNT(*) FILTER (
            WHERE c.estado = 'con_pendientes' AND EXISTS (
              SELECT 1 FROM sp_caso_semanas cs
              JOIN sp_lotes l ON l.id = cs.lote_id
              WHERE cs.caso_id = c.id AND l.semana_iso = ${semana}
            )
          )::int AS con_pendientes,
          COUNT(*) FILTER (
            WHERE c.estado = 'finalizado'
              AND (c.finalizado_at AT TIME ZONE 'America/Lima') >= (${periodo} || '-01')::date
              AND (c.finalizado_at AT TIME ZONE 'America/Lima') < ((${periodo} || '-01')::date + interval '1 month')
          )::int AS finalizados,
          COUNT(*) FILTER (WHERE ${BACKLOG_SQL(Prisma.sql`${semana}`)})::int AS backlog,
          COUNT(*) FILTER (
            WHERE c.estado = 'sin_seguimiento' AND c.semana_deteccion < ${semana}
          )::int AS backlog_sin_contacto,
          COUNT(*) FILTER (
            WHERE c.estado = 'con_pendientes'
              AND c.proximo_contacto_at IS NOT NULL
              AND c.proximo_contacto_at < now()
          )::int AS backlog_vencidos,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM sp_caso_semanas cs
              JOIN sp_lotes l ON l.id = cs.lote_id
              WHERE cs.caso_id = c.id AND l.semana_iso = ${semana}
            )
          )::int AS total_semana,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM sp_caso_semanas cs
              JOIN sp_lotes l ON l.id = cs.lote_id
              WHERE cs.caso_id = c.id AND l.periodo = ${periodo}
            )
          )::int AS total_mes
        FROM sp_casos c
      `,
      prisma.$queryRaw<{ senal: string; total: number }[]>`
        SELECT m.valor AS senal, COUNT(*)::int AS total
        FROM sp_casos c
        CROSS JOIN LATERAL jsonb_array_elements_text(c.motivos) AS m(valor)
        WHERE c.estado <> 'finalizado'
        GROUP BY m.valor
        ORDER BY total DESC, senal
      `,
      prisma.$queryRaw<{ periodo: string; total: number }[]>`
        SELECT c.periodo_deteccion AS periodo, COUNT(*)::int AS total
        FROM sp_casos c
        WHERE ${BACKLOG_SQL(Prisma.sql`${semana}`)}
        GROUP BY c.periodo_deteccion
        ORDER BY c.periodo_deteccion
      `,
      prisma.$queryRaw<LoteRow[]>`
        SELECT id, periodo, semana_iso,
               TO_CHAR(desde, 'YYYY-MM-DD') AS desde,
               TO_CHAR(hasta, 'YYYY-MM-DD') AS hasta,
               generado_por, total_candidatos, total_casos, created_at
        FROM sp_lotes
        ORDER BY semana_iso DESC
        LIMIT 12
      `,
      prisma.$queryRaw<SeguimientoAsesor[]>`
        SELECT id, TRIM(CONCAT_WS(' ', nombre, apellido)) AS nombre, rol
        FROM cope_usuarios
        WHERE estado = 'activo'
          AND rol IN ('rol-asesor', 'rol-supervisor', 'rol-admin')
        ORDER BY nombre
      `,
    ]);

    const c = conteos[0] ?? {
      por_contactar: 0,
      con_pendientes: 0,
      finalizados: 0,
      backlog: 0,
      backlog_sin_contacto: 0,
      backlog_vencidos: 0,
      total_semana: 0,
      total_mes: 0,
    };

    return {
      semanaActual: semana,
      periodoActual: periodo,
      kpis: {
        porContactar: c.por_contactar,
        conPendientes: c.con_pendientes,
        finalizados: c.finalizados,
        backlog: c.backlog,
        backlogSinContacto: c.backlog_sin_contacto,
        backlogVencidos: c.backlog_vencidos,
        totalSemana: c.total_semana,
        totalMes: c.total_mes,
      },
      porSenal,
      backlogPorPeriodo,
      lotes: lotes.map(mapLote),
      asesores,
    };
  },

  async listarCasos(
    params: SeguimientoFiltrosLista & { semanaActual: string; periodoActual: string },
  ): Promise<SeguimientoLista> {
    const scope = params.scope ?? "semana";
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Math.trunc(params.pageSize ?? 25)));
    const offset = (page - 1) * pageSize;

    const condiciones: Prisma.Sql[] = [];
    if (scope === "semana") {
      condiciones.push(Prisma.sql`EXISTS (
        SELECT 1 FROM sp_caso_semanas cs
        JOIN sp_lotes l ON l.id = cs.lote_id
        WHERE cs.caso_id = c.id AND l.semana_iso = ${params.semanaActual}
      )`);
    } else if (scope === "mes") {
      condiciones.push(Prisma.sql`EXISTS (
        SELECT 1 FROM sp_caso_semanas cs
        JOIN sp_lotes l ON l.id = cs.lote_id
        WHERE cs.caso_id = c.id AND l.periodo = ${params.periodoActual}
      )`);
    } else if (scope === "backlog") {
      condiciones.push(BACKLOG_SQL(Prisma.sql`${params.semanaActual}`));
    }

    if (params.estado) condiciones.push(Prisma.sql`c.estado = ${params.estado}`);
    if (params.asesorId) condiciones.push(Prisma.sql`c.asesor_id = ${params.asesorId}`);
    if (params.senal) condiciones.push(Prisma.sql`jsonb_exists(c.motivos, ${params.senal})`);
    if (params.search?.trim()) {
      const q = `%${params.search.trim()}%`;
      condiciones.push(Prisma.sql`(c.cliente ILIKE ${q} OR c.clave_cliente ILIKE ${q})`);
    }

    const where = condiciones.length
      ? Prisma.sql`WHERE ${Prisma.join(condiciones, " AND ")}`
      : Prisma.empty;

    const orden =
      scope === "backlog"
        ? Prisma.sql`ORDER BY c.primera_deteccion_at ASC, c.senales DESC`
        : Prisma.sql`ORDER BY
            CASE c.estado
              WHEN 'sin_seguimiento' THEN 0
              WHEN 'con_pendientes' THEN 1
              ELSE 2
            END,
            c.senales DESC,
            c.ultima_deteccion_at DESC`;

    const [totalRows, rows] = await Promise.all([
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total FROM sp_casos c ${where}
      `,
      prisma.$queryRaw<CasoRow[]>`
        SELECT c.*,
               (${BACKLOG_SQL(Prisma.sql`${params.semanaActual}`)}) AS en_backlog,
               ${DIAS_SIN_CONTACTO} AS dias_sin_contacto
        FROM sp_casos c
        ${where}
        ${orden}
        LIMIT ${pageSize} OFFSET ${offset}
      `,
    ]);

    return {
      total: totalRows[0]?.total ?? 0,
      page,
      pageSize,
      rows: rows.map(mapCaso),
    };
  },

  async detalle(id: string, semanaActual: string): Promise<{
    caso: SeguimientoCaso;
    gestiones: SeguimientoGestion[];
  } | null> {
    const rows = await prisma.$queryRaw<CasoRow[]>`
      SELECT c.*,
             (${BACKLOG_SQL(Prisma.sql`${semanaActual}`)}) AS en_backlog,
             ${DIAS_SIN_CONTACTO} AS dias_sin_contacto
      FROM sp_casos c
      WHERE c.id = ${id}
    `;
    if (!rows.length) return null;

    const gestiones = await prisma.$queryRaw<GestionRow[]>`
      SELECT id, caso_id,
             TO_CHAR(contacto_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD HH24:MI') AS contacto_at,
             TO_CHAR(proximo_contacto_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD HH24:MI') AS proximo_contacto_at,
             resumen, estado_anterior, estado_nuevo, usuario_id, usuario, created_at
      FROM sp_gestiones
      WHERE caso_id = ${id}
      ORDER BY contacto_at DESC, created_at DESC
    `;

    return {
      caso: mapCaso(rows[0]),
      gestiones: gestiones.map((g) => ({
        id: g.id,
        casoId: g.caso_id,
        contactoAt: g.contacto_at,
        proximoContactoAt: g.proximo_contacto_at,
        resumen: g.resumen,
        estadoAnterior: g.estado_anterior,
        estadoNuevo: g.estado_nuevo,
        usuarioId: g.usuario_id,
        usuario: g.usuario,
        createdAt: toIso(g.created_at) as string,
      })),
    };
  },

  async crearGestion(input: {
    casoId: string;
    contactoAt: string;
    proximoContactoAt: string | null;
    resumen: string;
    estadoNuevo: SeguimientoEstado;
    asesorId: string | null;
    asesorNombre: string | null;
    usuarioId: string | null;
    usuario: string | null;
  }): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        const actual = await tx.$queryRaw<CasoRow[]>`
          SELECT * FROM sp_casos WHERE id = ${input.casoId} FOR UPDATE
        `;
        if (!actual.length) return;
        const estadoAnterior = actual[0].estado;
        const finalizado = input.estadoNuevo === "finalizado";

        await tx.$executeRaw`
          UPDATE sp_casos SET
            estado = ${input.estadoNuevo},
            asesor_id = COALESCE(${input.asesorId}, asesor_id),
            asesor_nombre = COALESCE(${input.asesorNombre}, asesor_nombre),
            contacto_at = (${input.contactoAt}::timestamp AT TIME ZONE 'America/Lima'),
            proximo_contacto_at = ${
              input.proximoContactoAt
                ? Prisma.sql`(${input.proximoContactoAt}::timestamp AT TIME ZONE 'America/Lima')`
                : Prisma.sql`NULL`
            },
            resumen_contacto = ${input.resumen},
            finalizado_at = ${finalizado ? Prisma.sql`now()` : Prisma.sql`NULL`},
            finalizado_por = ${finalizado ? input.usuario : null},
            updated_at = now()
          WHERE id = ${input.casoId}
        `;

        await tx.$executeRaw`
          INSERT INTO sp_gestiones (
            id, caso_id, contacto_at, proximo_contacto_at, resumen,
            estado_anterior, estado_nuevo, usuario_id, usuario
          ) VALUES (
            ${randomUUID()}, ${input.casoId},
            (${input.contactoAt}::timestamp AT TIME ZONE 'America/Lima'),
            ${
              input.proximoContactoAt
                ? Prisma.sql`(${input.proximoContactoAt}::timestamp AT TIME ZONE 'America/Lima')`
                : Prisma.sql`NULL`
            },
            ${input.resumen}, ${estadoAnterior}, ${input.estadoNuevo},
            ${input.usuarioId}, ${input.usuario}
          )
        `;

        await tx.$executeRaw`
          INSERT INTO sp_auditoria (id, caso_id, usuario_id, usuario, accion, campo, valor_anterior, valor_nuevo)
          VALUES (
            ${randomUUID()}, ${input.casoId}, ${input.usuarioId}, ${input.usuario},
            ${finalizado ? "cierre" : estadoAnterior === "finalizado" ? "reapertura" : "gestion"},
            'estado', ${estadoAnterior}, ${input.estadoNuevo}
          )
        `;
      },
      { timeout: 30000 },
    );
  },

  async actualizarCaso(input: {
    casoId: string;
    asesorId?: string | null;
    asesorNombre?: string | null;
    proximoContactoAt?: string | null;
    usuarioId: string | null;
    usuario: string | null;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const actual = await tx.$queryRaw<CasoRow[]>`
        SELECT * FROM sp_casos WHERE id = ${input.casoId} FOR UPDATE
      `;
      if (!actual.length) return;
      const anterior = actual[0];

      if (input.asesorId !== undefined) {
        await tx.$executeRaw`
          UPDATE sp_casos SET
            asesor_id = ${input.asesorId},
            asesor_nombre = ${input.asesorNombre ?? null},
            updated_at = now()
          WHERE id = ${input.casoId}
        `;
        await tx.$executeRaw`
          INSERT INTO sp_auditoria (id, caso_id, usuario_id, usuario, accion, campo, valor_anterior, valor_nuevo)
          VALUES (
            ${randomUUID()}, ${input.casoId}, ${input.usuarioId}, ${input.usuario},
            'asignacion', 'asesor', ${anterior.asesor_nombre}, ${input.asesorNombre ?? null}
          )
        `;
      }

      if (input.proximoContactoAt !== undefined) {
        await tx.$executeRaw`
          UPDATE sp_casos SET
            proximo_contacto_at = ${
              input.proximoContactoAt
                ? Prisma.sql`(${input.proximoContactoAt}::timestamp AT TIME ZONE 'America/Lima')`
                : Prisma.sql`NULL`
            },
            updated_at = now()
          WHERE id = ${input.casoId}
        `;
      }
    }, { timeout: 30000 });
  },

  async atenciones(params: {
    clave: string;
    page: number;
    pageSize: number;
    categoria?: string;
    subcategoria?: string;
  }): Promise<SeguimientoAtencionesLista> {
    const page = Math.max(1, Math.trunc(params.page));
    const pageSize = Math.min(100, Math.max(1, Math.trunc(params.pageSize)));
    const offset = (page - 1) * pageSize;
    const condiciones: Prisma.Sql[] = [
      Prisma.sql`estado_homologado IN ('cerrado', 'resuelto')`,
      Prisma.sql`${CLIENTE_KEY} = ${params.clave}`,
    ];
    if (params.categoria) {
      condiciones.push(
        Prisma.sql`COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría') = ${params.categoria}`,
      );
    }
    if (params.subcategoria) {
      condiciones.push(
        Prisma.sql`COALESCE(NULLIF(INITCAP(cope_scat_normalizada(subcategoria)), ''), 'Sin subcategoría') = ${params.subcategoria}`,
      );
    }
    const where = Prisma.sql`WHERE ${Prisma.join(condiciones, " AND ")}`;
    const subdomain = (process.env.ZENDESK_SUBDOMAIN ?? "").trim();
    const zendeskValido = /^[a-z0-9-]+$/i.test(subdomain);

    const [totalRows, rows] = await Promise.all([
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total FROM public.v_unificado_norm ${where}
      `,
      prisma.$queryRaw<
        {
          ticket: string;
          canal: string;
          fecha: string;
          categoria: string;
          subcategoria: string;
          asesor: string;
          estado: string;
          tiempo: number | null;
          cumple_sla: boolean | null;
          umbral: number;
        }[]
      >`
        SELECT ticket_id::text AS ticket,
               subcanal AS canal,
               TO_CHAR(${CREACION}, 'YYYY-MM-DD HH24:MI') AS fecha,
               COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría') AS categoria,
               COALESCE(NULLIF(INITCAP(cope_scat_normalizada(subcategoria)), ''), 'Sin subcategoría') AS subcategoria,
               COALESCE(NULLIF(TRIM(asesor), ''), 'Sin asignar') AS asesor,
               estado_homologado AS estado,
               resolucion_min_norm::float8 AS tiempo,
               CASE
                 WHEN resolucion_min_norm IS NULL THEN NULL
                 WHEN resolucion_min_norm <= ${UMBRAL_RESOLUCION} THEN true
                 ELSE false
               END AS cumple_sla,
               (${UMBRAL_RESOLUCION})::int AS umbral
        FROM public.v_unificado_norm
        ${where}
        ORDER BY ${CREACION} DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
    ]);

    return {
      total: totalRows[0]?.total ?? 0,
      page,
      pageSize,
      rows: rows.map((r) => ({
        ticket: r.ticket,
        canal: r.canal,
        fecha: r.fecha,
        categoria: r.categoria,
        subcategoria: r.subcategoria,
        asesor: r.asesor,
        estado: r.estado,
        tiempo: r.tiempo,
        cumpleSla: r.cumple_sla,
        umbral: r.umbral,
        urlTicket:
          r.canal === "ZENDESK" && zendeskValido && /^\d+$/.test(r.ticket)
            ? `https://${subdomain}.zendesk.com/agent/tickets/${r.ticket}`
            : null,
      })),
    };
  },

  async nombreAsesor(id: string): Promise<string | null> {
    const rows = await prisma.$queryRaw<{ nombre: string }[]>`
      SELECT TRIM(CONCAT_WS(' ', nombre, apellido)) AS nombre
      FROM cope_usuarios WHERE id = ${id}
    `;
    return rows[0]?.nombre ?? null;
  },
};
