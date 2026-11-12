/**
 * Backfill retroactivo de Quejas y Devoluciones desde Zendesk.
 *
 * - Consulta Zendesk por ventanas mensuales y páginas, sin depender de una
 *   vista o página concreta.
 * - Reutiliza el servicio transaccional legacy `crearDesdeCategorizacion`
 *   (no crea una segunda lógica de expedientes).
 * - Guarda checkpoints por ventana/página para poder reanudar sin perder
 *   información.
 * - Registra cada ticket procesado con su resultado y motivo.
 * - Usa la fecha `created_at` del ticket como fecha histórica del expediente
 *   (`fecha_solicitud`); nunca usa la fecha de ejecución del backfill.
 */
import { DomainError } from "../core/errors/types";
import { ZendeskClient } from "../modules/zendesk/infrastructure/ZendeskClient";
import { qdRepository, type QdCasoRow } from "../repositories/quejasDevoluciones.repository";
import { prisma } from "../repositories/prisma";
import { qydBackfillRepository, type BackfillRunRow } from "../repositories/qydBackfill.repository";
import {
  clasificarCategoriaQyd,
  clasificarTicketZendeskQyd,
  clasificacionQuejaDesdeSubcategoria,
  normalizarCanal,
  resolverDominioQyd,
  esCategoriaSinCategorizar,
  DOMINIO_SIN_DOMINIO,
  ESTADO_CERRADO,
} from "./quejasCasos.service";
import { qdService } from "./quejasDevoluciones.service";
import { esFechaISO, fechaOrigenDia, fechaOrigenExacta } from "../utils/fechaQyd";

const CATEGORY_FIELD = 38744095836311;
const DOMAIN_FIELD = 40769061038615;
const COUNTRY_FIELD = 1500005211481;
const MAX_ERROR_DETALLE = 500;
/** Límite práctico de la búsqueda paginada de Zendesk por consulta. */
const MAX_RESULTADOS_VENTANA = 1000;

export interface QydBackfillTicket {
  ticketId: string;
  createdAt: string | null;
  status: string | null;
  categoriaRaw: string | null;
  /** Subcategoría original; en Zendesk API coincide con la hoja. */
  subcategoriaRaw?: string | null;
  /** true si categoriaRaw es la hoja Zendesk; false si es la categoría padre. */
  categoriaEsHoja?: boolean;
  domainRaw: string | null;
  country: string | null;
  channelRaw: string | null;
  assigneeName: string | null;
  viaSourcePresent: boolean;
  followUp: boolean;
  parentTicketId: string | null;
  followupIds: string[];
}

export interface QydBackfillPage {
  tickets: QydBackfillTicket[];
  total: number;
  hasMore: boolean;
}

export interface QydBackfillSource {
  listarTickets(input: {
    desde: string;
    hastaExclusivo: string;
    pagina: number;
    porPagina: number;
  }): Promise<QydBackfillPage>;
  obtenerTicket(ticketId: string): Promise<QydBackfillTicket | null>;
}

function texto(valor: unknown): string | null {
  if (valor == null) return null;
  if (Array.isArray(valor)) {
    const primero = valor.find((v) => v != null && String(v).trim() !== "");
    return primero == null ? null : String(primero).trim();
  }
  const s = String(valor).trim();
  return s === "" ? null : s;
}

function mapZendeskTicket(ticket: any, assigneeName: string | null = null): QydBackfillTicket {
  const cf = new Map<number, unknown>((ticket.custom_fields ?? []).map((c: any) => [c.id, c.value]));
  const via = ticket.via ?? null;
  const esFollowUp = via?.source?.rel === "follow_up";
  return {
    ticketId: String(ticket.id),
    createdAt: ticket.created_at ?? null,
    status: ticket.status ?? null,
    categoriaRaw: texto(cf.get(CATEGORY_FIELD)),
    subcategoriaRaw: texto(cf.get(CATEGORY_FIELD)),
    categoriaEsHoja: true,
    domainRaw: texto(cf.get(DOMAIN_FIELD)),
    country: texto(cf.get(COUNTRY_FIELD)),
    channelRaw: via?.channel ?? null,
    assigneeName,
    viaSourcePresent: !!via?.source,
    followUp: esFollowUp,
    parentTicketId: esFollowUp && via?.source?.from?.ticket_id != null
      ? String(via.source.from.ticket_id)
      : null,
    followupIds: (ticket.followup_ids ?? []).map(String),
  };
}

/** Fuente real de Zendesk. Solo se usa cuando el entorno está autorizado. */
export class ZendeskBackfillSource implements QydBackfillSource {
  private client = new ZendeskClient();

  async listarTickets(input: {
    desde: string;
    hastaExclusivo: string;
    pagina: number;
    porPagina: number;
  }): Promise<QydBackfillPage> {
    if (!this.client.estaConfigurado) {
      throw new DomainError(
        "Zendesk no está configurado en este entorno. El backfill real requiere credenciales autorizadas.",
        "ZENDESK_NO_CONFIGURADO",
      );
    }
    const query = `type:ticket created>=${input.desde} created<${input.hastaExclusivo}`;
    const pagina = await this.client.searchTicketsPage(query, input.pagina, input.porPagina);
    const ids = [...new Set(pagina.tickets.map((t) => t.assignee_id).filter((id): id is number => id != null))];
    const usuarios = ids.length > 0 ? await this.client.obtenerUsuarios(ids) : [];
    const nombres = new Map(usuarios.map((u) => [String(u.id), u.name]));
    return {
      tickets: pagina.tickets.map((t) => mapZendeskTicket(t, nombres.get(String(t.assignee_id)) ?? null)),
      total: pagina.total,
      hasMore: pagina.hasMore,
    };
  }

  async obtenerTicket(ticketId: string): Promise<QydBackfillTicket | null> {
    if (!this.client.estaConfigurado) {
      throw new DomainError(
        "Zendesk no está configurado en este entorno. La reparación real requiere credenciales autorizadas.",
        "ZENDESK_NO_CONFIGURADO",
      );
    }
    const id = Number(ticketId);
    if (!Number.isInteger(id)) return null;
    const ticket = await this.client.obtenerTicket(id);
    return ticket ? mapZendeskTicket(ticket) : null;
  }
}

/**
 * @deprecated La regularización debe usar PostgreSQL. Se conserva solo para
 * pruebas o escenarios explícitamente autorizados de lectura contra Zendesk.
 */
export const zendeskBackfillSource = new ZendeskBackfillSource();

interface PostgresTicketRow {
  ticket_id: string;
  created_at: string | null;
  status: string | null;
  categoria: string | null;
  subcategoria: string | null;
  dominio: string | null;
  pais: string | null;
  canal: string | null;
  asesor: string | null;
  ticket_padre_id: string | null;
  followup_ids: unknown;
  relacion_origen: string | null;
}

function mapPostgresTicket(row: PostgresTicketRow): QydBackfillTicket {
  const parent = row.ticket_padre_id ?? null;
  const relacionVerificada = row.relacion_origen === "zendesk";
  return {
    ticketId: row.ticket_id,
    createdAt: row.created_at,
    status: row.status,
    categoriaRaw: row.categoria,
    subcategoriaRaw: row.subcategoria,
    categoriaEsHoja: false,
    domainRaw: row.dominio,
    country: row.pais,
    channelRaw: row.canal,
    assigneeName: row.asesor,
    viaSourcePresent: relacionVerificada,
    followUp: relacionVerificada && parent != null,
    parentTicketId: parent,
    followupIds: Array.isArray(row.followup_ids)
      ? row.followup_ids.map(String)
      : [],
  };
}

/**
 * Fuente de verdad para la regularización: PostgreSQL.
 *
 * Usa la vista normalizada existente `public.v_unificado_norm`, cuya rama
 * Zendesk proviene de `"Categorización_zendesk"` (ver
 * `backend/sql/migrations/backup-v-unificado-2026-11-03.sql`).
 *
 * - No consulta la API de Zendesk.
 * - La fecha original es `tickets_created_at` (no `fecha_reporte`).
 * - La relación padre/follow-up se lee de `qd_relaciones_ticket`; si no existe,
 *   el ticket queda PENDIENTE_RELACION y no se crea un duplicado.
 */
export interface PostgresBackfillSourceOptions {
  /** true = incluye ZENDESK, WHATMETA, WHATICKET y cualquier otro subcanal. */
  todosLosCanales?: boolean;
  /** true = limita la consulta a categorías QyD (Queja/Devolución/Reclamo). */
  soloElegibles?: boolean;
}

export class PostgresBackfillSource implements QydBackfillSource {
  private readonly filtroCanal: string;
  private readonly filtroElegibles: string;
  private readonly selectBase: string;

  constructor(opts: PostgresBackfillSourceOptions = {}) {
    this.filtroCanal = opts.todosLosCanales
      ? ""
      : "AND v.subcanal ILIKE '%zendesk%'";
    this.filtroElegibles = opts.soloElegibles
      ? `AND (
           cope_scat_normalizada(v.categoria) LIKE '%queja%'
           OR cope_scat_normalizada(v.categoria) LIKE '%devolucion%'
           OR cope_scat_normalizada(v.categoria) = 'reclamo'
           OR cope_scat_normalizada(v.subcategoria) LIKE '%queja%'
           OR cope_scat_normalizada(v.subcategoria) LIKE '%devolucion%'
           OR cope_scat_normalizada(v.subcategoria) = 'reclamo'
         )`
      : "";
    this.selectBase = `
      SELECT DISTINCT ON (v.ticket_id::text)
        v.ticket_id::text AS ticket_id,
        CASE
          WHEN v.tickets_created_at IS NOT NULL THEN
            to_char(v.tickets_created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
          WHEN v.fecha IS NOT NULL THEN
            to_char(v.fecha::timestamp, 'YYYY-MM-DD"T"00:00:00"Z"')
          ELSE NULL
        END AS created_at,
        v.estado AS status,
        v.categoria AS categoria,
        v.subcategoria AS subcategoria,
        v.dominio AS dominio,
        v.pais AS pais,
        v.canal AS canal,
        v.asesor AS asesor,
        r.ticket_padre_id AS ticket_padre_id,
        r.followup_ids AS followup_ids,
        r.origen AS relacion_origen
      FROM public.v_unificado_norm v
      LEFT JOIN qd_relaciones_ticket r
        ON r.ticket_id = v.ticket_id::text
       AND r.origen = 'zendesk'
      WHERE v.ticket_id IS NOT NULL
        ${this.filtroCanal}
        ${this.filtroElegibles}
    `;
  }

  async listarTickets(input: {
    desde: string;
    hastaExclusivo: string;
    pagina: number;
    porPagina: number;
  }): Promise<QydBackfillPage> {
    const offset = Math.max(0, (input.pagina - 1) * input.porPagina);
    const totalRows = await prisma.$queryRawUnsafe<{ n: number }[]>(
      `SELECT COUNT(DISTINCT v.ticket_id)::int AS n
       FROM public.v_unificado_norm v
       WHERE v.ticket_id IS NOT NULL
         ${this.filtroCanal}
         ${this.filtroElegibles}
         AND COALESCE(v.tickets_created_at, v.fecha::timestamp)::date >= $1::date
         AND COALESCE(v.tickets_created_at, v.fecha::timestamp)::date < $2::date`,
      input.desde, input.hastaExclusivo,
    );
    const total = Number(totalRows[0]?.n ?? 0);
    const rows = await prisma.$queryRawUnsafe<PostgresTicketRow[]>(
      `SELECT * FROM (
         ${this.selectBase}
           AND COALESCE(v.tickets_created_at, v.fecha::timestamp)::date >= $1::date
           AND COALESCE(v.tickets_created_at, v.fecha::timestamp)::date < $2::date
         ORDER BY v.ticket_id::text, COALESCE(v.tickets_created_at, v.fecha::timestamp) ASC
       ) q
       ORDER BY q.created_at ASC NULLS LAST, q.ticket_id ASC
       LIMIT $3 OFFSET $4`,
      input.desde, input.hastaExclusivo, input.porPagina, offset,
    );
    return {
      tickets: rows.map(mapPostgresTicket),
      total,
      hasMore: offset + rows.length < total,
    };
  }

  async obtenerTicket(ticketId: string): Promise<QydBackfillTicket | null> {
    const rows = await prisma.$queryRawUnsafe<PostgresTicketRow[]>(
      `SELECT * FROM (
         ${this.selectBase}
           AND v.ticket_id::text = $1
         ORDER BY v.ticket_id::text, COALESCE(v.tickets_created_at, v.fecha::timestamp) ASC
       ) q
       LIMIT 1`,
      ticketId,
    );
    return rows[0] ? mapPostgresTicket(rows[0]) : null;
  }
}

/** Fuente Zendesk-only para reparación de fechas y compatibilidad. */
export const postgresBackfillSource = new PostgresBackfillSource();

/** Fuente multicanal para la carga histórica real (solo categorías QyD). */
export const postgresMulticanalBackfillSource = new PostgresBackfillSource({
  todosLosCanales: true,
  soloElegibles: true,
});

function isoUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function sumarDias(d: Date, dias: number): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() + dias);
  return r;
}

/** Divide [desde, hasta] en ventanas mensuales con fin exclusivo. */
export function construirVentanasMensuales(
  desde: string,
  hasta: string,
): { desde: string; hastaExclusivo: string }[] {
  if (!esFechaISO(desde) || !esFechaISO(hasta)) {
    throw new DomainError("Fechas inválidas. Formato esperado: YYYY-MM-DD", "FECHAS_INVALIDAS");
  }
  if (desde > hasta) {
    throw new DomainError("La fecha de inicio no puede ser posterior a la de fin", "FECHAS_INVALIDAS");
  }
  const finInclusivo = new Date(`${hasta}T00:00:00Z`);
  const limiteExclusivo = sumarDias(finInclusivo, 1);
  const ventanas: { desde: string; hastaExclusivo: string }[] = [];
  let cursor = new Date(`${desde}T00:00:00Z`);
  while (cursor < limiteExclusivo) {
    const siguienteMes = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    const fin = siguienteMes < limiteExclusivo ? siguienteMes : limiteExclusivo;
    ventanas.push({ desde: isoUTC(cursor), hastaExclusivo: isoUTC(fin) });
    cursor = fin;
  }
  return ventanas;
}

export type AccionProyectada = "CREAR" | "REUTILIZAR" | "OMITIR" | "PENDIENTE";

export type UniversoTicket = "SIN_CATEGORIZAR" | "NO_QYD" | "QYD";

export interface DetalleTicket {
  ticketId: string;
  fechaOriginal: string | null;
  /** Instante exacto de `tickets_created_at`, sin conversión de zona. */
  fechaOriginalIso: string | null;
  /** Valor propuesto para `fecha_solicitud` (ISO exacto). */
  fechaSolicitudProyectada: string | null;
  categoria: string | null;
  subcategoria: string | null;
  universo: UniversoTicket | null;
  /** Dominio persistible normalizado o `SIN DOMINIO`. */
  dominio: string | null;
  /** Valor crudo del dominio, conservado para auditoría. */
  dominioRaw: string | null;
  dominioOriginal: string | null;
  sinDominio: boolean;
  dominioProyectado: string | null;
  estadoProyectado: string | null;
  casoCerradoProyectado: boolean;
  evidenciaRelacion: string | null;
  canal: string | null;
  canalRaw: string | null;
  tipo: string | null;
  categoriaQyd: string | null;
  motivoClasificacion: string | null;
  clasificacionQueja: string | null;
  followUp: boolean;
  ticketPadreId: string | null;
  ticketRaiz: string | null;
  expedienteExistente: { id: string; numero: string; ticketId: string | null; tipo: string } | null;
  expedienteProyectado: { ticketId: string; tipo: string } | null;
  accionProyectada: AccionProyectada;
  motivo: string | null;
  estadoTicket: string | null;
  asesor: string | null;
}

export interface DetallePage {
  pagina: number;
  porPagina: number;
  total: number;
  paginas: number;
  items: DetalleTicket[];
}

export interface BackfillResumen {
  runId: string;
  estado: string;
  dryRun: boolean;
  /** true solo si se persistieron run/checkpoints/ítems de control. */
  controlPersistido: boolean;
  desde: string;
  hasta: string;
  ventanas: number;
  total: number;
  creados: number;
  reutilizados: number;
  omitidos: number;
  pendientes: number;
  errores: number;
  pendientesPorMotivo: Record<string, number>;
  /** Desglose explícito del universo: excluidos vs. elegibles. */
  universo: {
    total: number;
    sinCategorizar: number;
    noQyd: number;
    qydElegibles: number;
  };
  candidatosCrear: number;
  reutilizables: number;
  omitidosQyd: number;
  pendientesRelacion: number;
  /** Expedientes que se proyectan con dominio `SIN DOMINIO`. */
  sinDominioRegularizado: number;
  /** Expedientes SIN DOMINIO que quedarían con estado `CERRADO`. */
  sinDominioCerrado: number;
  fechasRecuperadas: number;
  fechasNoRecuperables: number;
  incidenciasFecha: number;
  detalle?: DetallePage | null;
}

interface ResultadoItem extends DetalleTicket {
  estado: "CREADO" | "REUTILIZADO" | "OMITIDO" | "PENDIENTE" | "ERROR";
  fechaSolicitud: string | null;
  casoId: string | null;
  numero: string | null;
}

type ClasificacionQyd = NonNullable<ReturnType<typeof clasificarTicketZendeskQyd>>;

interface EvaluacionTicket {
  fecha: string | null;
  fechaIso: string | null;
  clasificacion: ClasificacionQyd | null;
  tipo: "queja" | "devolucion" | null;
  canal: string | null;
  dominio: string;
  dominioOriginal: string | null;
  sinDominio: boolean;
  dominioMotivo: string;
  clasificacionQueja: string | null;
  universo: UniversoTicket;
  sinCategoria: boolean;
}

function normalizarCanalFuente(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const c = raw.trim().toLowerCase();
  if (c.includes("zendesk")) return "correo";
  if (c.includes("what") || c.includes("wpp")) return "whatsapp";
  if (c.includes("correo") || c.includes("email")) return "correo";
  if (c.includes("chat")) return "chat";
  return raw;
}

function evaluarTicket(ticket: QydBackfillTicket): EvaluacionTicket {
  // Fecha exacta del ticket: se conserva el instante original en UTC. No se
  // usa `fechaLima` para no desplazar el día por conversión horaria.
  const fechaIso = fechaOrigenExacta(ticket.createdAt);
  const fecha = fechaOrigenDia(ticket.createdAt);
  const categoria = ticket.categoriaRaw;
  const subcategoria = ticket.subcategoriaRaw ?? ticket.categoriaRaw;
  const sinCategoria = esCategoriaSinCategorizar(categoria, subcategoria);
  // Zendesk API entrega la hoja en un solo campo; PostgreSQL entrega categoría
  // padre homologada + subcategoría original. Ambos pasan por el mismo clasificador.
  const clasificacion = ticket.categoriaEsHoja === false
    ? (clasificarCategoriaQyd(categoria, subcategoria) ?? clasificarTicketZendeskQyd(subcategoria))
    : clasificarTicketZendeskQyd(categoria);
  const tipo = clasificacion?.tipo ?? null;
  const canal = normalizarCanal(normalizarCanalFuente(ticket.channelRaw));
  const dominioResuelto = resolverDominioQyd(ticket.domainRaw);
  const clasificacionQueja = tipo
    ? clasificacionQuejaDesdeSubcategoria(tipo, subcategoria)
    : null;
  const universo: UniversoTicket = sinCategoria
    ? "SIN_CATEGORIZAR"
    : clasificacion
      ? "QYD"
      : "NO_QYD";
  return {
    fecha,
    fechaIso,
    clasificacion,
    tipo,
    canal,
    dominio: dominioResuelto.dominio,
    dominioOriginal: dominioResuelto.original,
    sinDominio: dominioResuelto.sinDominio,
    dominioMotivo: dominioResuelto.motivo,
    clasificacionQueja,
    universo,
    sinCategoria,
  };
}

function resultado(
  ticket: QydBackfillTicket,
  estado: ResultadoItem["estado"],
  motivo: string | null,
  extras: {
    fecha?: string | null;
    fechaIso?: string | null;
    fechaSolicitud?: string | null;
    tipo?: string | null;
    categoriaQyd?: string | null;
    clasificacionQueja?: string | null;
    universo?: UniversoTicket | null;
    dominio?: string | null;
    dominioOriginal?: string | null;
    sinDominio?: boolean;
    dominioProyectado?: string | null;
    estadoProyectado?: string | null;
    casoCerradoProyectado?: boolean;
    evidenciaRelacion?: string | null;
    canal?: string | null;
    caso?: QdCasoRow | null;
    proyectado?: { ticketId: string; tipo: string } | null;
    ticketRaiz?: string | null;
  } = {},
): ResultadoItem {
  const accionProyectada: AccionProyectada =
    estado === "CREADO" ? "CREAR" :
    estado === "REUTILIZADO" ? "REUTILIZAR" :
    estado === "OMITIDO" ? "OMITIR" : "PENDIENTE";
  const fechaIso = extras.fechaIso ?? ticket.createdAt ?? null;
  const fechaSolicitud = extras.fechaSolicitud ?? fechaIso ?? extras.fecha ?? null;
  const dominioProyectado = extras.dominioProyectado !== undefined
    ? extras.dominioProyectado
    : (extras.dominio ?? null);

  return {
    estado,
    motivo,
    fechaSolicitud,
    casoId: extras.caso?.id ?? null,
    numero: extras.caso?.numero ?? null,
    ticketId: ticket.ticketId,
    fechaOriginal: extras.fecha ?? fechaOrigenDia(fechaIso),
    fechaOriginalIso: fechaIso,
    fechaSolicitudProyectada: fechaSolicitud,
    categoria: ticket.categoriaRaw,
    subcategoria: ticket.subcategoriaRaw ?? ticket.categoriaRaw,
    universo: extras.universo ?? null,
    dominio: extras.dominio ?? null,
    dominioRaw: ticket.domainRaw,
    dominioOriginal: extras.dominioOriginal ?? ticket.domainRaw,
    sinDominio: extras.sinDominio ?? false,
    dominioProyectado,
    estadoProyectado: extras.estadoProyectado ?? null,
    casoCerradoProyectado: extras.casoCerradoProyectado ?? false,
    evidenciaRelacion: extras.evidenciaRelacion ?? null,
    canal: extras.canal ?? null,
    canalRaw: ticket.channelRaw,
    tipo: extras.tipo ?? null,
    categoriaQyd: extras.categoriaQyd ?? null,
    motivoClasificacion: extras.categoriaQyd ?? motivo,
    clasificacionQueja: extras.clasificacionQueja ?? null,
    followUp: ticket.followUp,
    ticketPadreId: ticket.parentTicketId,
    ticketRaiz: extras.ticketRaiz ?? (ticket.parentTicketId ? null : ticket.ticketId),
    expedienteExistente: extras.caso ? {
      id: extras.caso.id,
      numero: extras.caso.numero,
      ticketId: extras.caso.ticket_id,
      tipo: extras.caso.tipo,
    } : null,
    expedienteProyectado: extras.proyectado ?? null,
    accionProyectada,
    estadoTicket: ticket.status,
    asesor: ticket.assigneeName,
  };
}

function resumirResultados(items: ResultadoItem[]): {
  total: number;
  creados: number;
  reutilizados: number;
  omitidos: number;
  pendientes: number;
  errores: number;
  pendientesPorMotivo: Record<string, number>;
  universo: { total: number; sinCategorizar: number; noQyd: number; qydElegibles: number };
  candidatosCrear: number;
  reutilizables: number;
  omitidosQyd: number;
  pendientesRelacion: number;
  sinDominioRegularizado: number;
  sinDominioCerrado: number;
} {
  const out = {
    total: items.length,
    creados: 0,
    reutilizados: 0,
    omitidos: 0,
    pendientes: 0,
    errores: 0,
    pendientesPorMotivo: {} as Record<string, number>,
    universo: { total: items.length, sinCategorizar: 0, noQyd: 0, qydElegibles: 0 },
    candidatosCrear: 0,
    reutilizables: 0,
    omitidosQyd: 0,
    pendientesRelacion: 0,
    sinDominioRegularizado: 0,
    sinDominioCerrado: 0,
  };
  for (const item of items) {
    if (item.universo === "SIN_CATEGORIZAR") out.universo.sinCategorizar += 1;
    else if (item.universo === "NO_QYD") out.universo.noQyd += 1;
    else if (item.universo === "QYD") out.universo.qydElegibles += 1;

    if (item.estado === "CREADO") out.creados += 1;
    else if (item.estado === "REUTILIZADO") out.reutilizados += 1;
    else if (item.estado === "OMITIDO") {
      out.omitidos += 1;
      if (item.universo === "QYD") out.omitidosQyd += 1;
    } else if (item.estado === "PENDIENTE") {
      out.pendientes += 1;
      const motivo = item.motivo ?? "SIN_MOTIVO";
      out.pendientesPorMotivo[motivo] = (out.pendientesPorMotivo[motivo] ?? 0) + 1;
      if (motivo === "PENDIENTE_RELACION") out.pendientesRelacion += 1;
    } else if (item.estado === "ERROR") out.errores += 1;

    if (item.universo === "QYD" && item.sinDominio && item.dominioProyectado === DOMINIO_SIN_DOMINIO) {
      out.sinDominioRegularizado += 1;
    }
    if (item.universo === "QYD" && item.sinDominio && item.estadoProyectado === ESTADO_CERRADO) {
      out.sinDominioCerrado += 1;
    }
  }
  out.candidatosCrear = out.creados;
  out.reutilizables = out.reutilizados;
  return out;
}

function ordenarItems(items: ResultadoItem[]): ResultadoItem[] {
  return [...items].sort((a, b) =>
    a.ticketId.localeCompare(b.ticketId, undefined, { numeric: true }),
  );
}

function construirDetallePage(
  items: ResultadoItem[],
  pagina: number,
  porPagina: number,
): DetallePage {
  const ordenados = ordenarItems(items);
  const tam = Math.min(Math.max(porPagina, 1), 200);
  const paginas = Math.max(1, Math.ceil(ordenados.length / tam));
  const pag = Math.min(Math.max(pagina, 1), paginas);
  const inicio = (pag - 1) * tam;
  return {
    pagina: pag,
    porPagina: tam,
    total: ordenados.length,
    paginas,
    items: ordenados.slice(inicio, inicio + tam).map(({ estado: _estado, fechaSolicitud: _fecha, casoId: _caso, numero: _numero, ...detalle }) => detalle),
  };
}

function csvCell(valor: unknown): string {
  const s = valor == null ? "" : String(valor);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function construirCsvDetalle(items: ResultadoItem[]): string {
  const header = [
    "ticket_id", "fecha_original", "fecha_original_iso", "fecha_solicitud_proyectada",
    "categoria", "subcategoria", "universo",
    "dominio", "dominio_raw", "dominio_original", "sin_dominio", "dominio_proyectado",
    "estado_proyectado", "caso_cerrado_proyectado", "evidencia_relacion",
    "canal", "canal_raw", "tipo", "categoria_qyd",
    "motivo_clasificacion", "clasificacion_queja", "follow_up", "ticket_padre", "ticket_raiz",
    "expediente_existente_id", "expediente_existente_numero", "expediente_proyectado_ticket",
    "accion_proyectada", "motivo", "estado_ticket", "asesor",
  ];
  const filas = ordenarItems(items).map((r) => [
    r.ticketId, r.fechaOriginal, r.fechaOriginalIso, r.fechaSolicitudProyectada,
    r.categoria, r.subcategoria, r.universo,
    r.dominio, r.dominioRaw, r.dominioOriginal, r.sinDominio ? "SI" : "NO", r.dominioProyectado,
    r.estadoProyectado, r.casoCerradoProyectado ? "SI" : "NO", r.evidenciaRelacion,
    r.canal, r.canalRaw, r.tipo, r.categoriaQyd,
    r.motivoClasificacion, r.clasificacionQueja, r.followUp ? "SI" : "NO", r.ticketPadreId, r.ticketRaiz,
    r.expedienteExistente?.id, r.expedienteExistente?.numero, r.expedienteProyectado?.ticketId,
    r.accionProyectada, r.motivo, r.estadoTicket, r.asesor,
  ]);
  const lineas = [header, ...filas].map((fila) => fila.map(csvCell).join(","));
  return `\uFEFF${lineas.join("\r\n")}\r\n`;
}

interface CasoProyectado {
  ticketId: string;
  tipo: string;
  estadoProyectado?: string;
  dominioProyectado?: string;
  casoCerradoProyectado?: boolean;
}

interface ResolucionSoloLectura {
  existente: QdCasoRow | null;
  proyectado: CasoProyectado | null;
  raiz: string | null;
  relacionPendiente: boolean;
  evidenciaRelacion: string;
}

const TTL_RELACION_MS = 24 * 60 * 60 * 1000;

/**
 * Obtiene un eslabón de la cadena sin escribir: primero Zendesk (lectura) y,
 * si no está disponible, la caché verificada qd_relaciones_ticket.
 */
async function obtenerNodoCadena(
  ticketId: string,
  source: QydBackfillSource,
): Promise<QydBackfillTicket | null> {
  const directo = await source.obtenerTicket(ticketId);
  if (directo?.viaSourcePresent) return directo;
  const cache = await qdRepository.relacionCache(ticketId);
  if (!cache || cache.origen !== "zendesk") return directo;
  if (Date.now() - new Date(cache.fetched_at).getTime() > TTL_RELACION_MS) return directo;
  return {
    ticketId,
    createdAt: null,
    status: null,
    categoriaRaw: null,
    domainRaw: null,
    country: null,
    channelRaw: null,
    assigneeName: null,
    viaSourcePresent: true,
    followUp: cache.ticket_padre_id != null,
    parentTicketId: cache.ticket_padre_id,
    followupIds: cache.followup_ids,
  };
}

/**
 * Resuelve la cadena de follow-ups sin escribir en `qd_relaciones_ticket`.
 * Consulta la BD y, si falta un eslabón, el ticket en la fuente o la caché
 * verificada (solo lectura).
 */
async function resolverCadenaSoloLectura(
  ticket: QydBackfillTicket,
  tipo: "queja" | "devolucion",
  source: QydBackfillSource,
  proyectados: Map<string, CasoProyectado>,
  opts: { permitirRaizSinRelacion?: boolean } = {},
): Promise<ResolucionSoloLectura> {
  try {
    let actual: QydBackfillTicket | null = ticket;
    if (!actual.viaSourcePresent) {
      const fresco = await obtenerNodoCadena(actual.ticketId, source);
      if (!fresco?.viaSourcePresent) {
        // Excepción SIN DOMINIO: sin padre ni follow-ups conocidos, el ticket
        // se proyecta como raíz independiente. No se inventa una relación.
        if (opts.permitirRaizSinRelacion
          && !ticket.parentTicketId
          && (ticket.followupIds ?? []).length === 0) {
          return {
            existente: null,
            proyectado: null,
            raiz: ticket.ticketId,
            relacionPendiente: false,
            evidenciaRelacion: "SIN_DOMINIO_RAIZ_INDEPENDIENTE",
          };
        }
        return {
          existente: null,
          proyectado: null,
          raiz: null,
          relacionPendiente: true,
          evidenciaRelacion: "RELACION_NO_DISPONIBLE",
        };
      }
      actual = fresco;
    }

    const cadena: QydBackfillTicket[] = [];
    const vistos = new Set<string>();
    let raiz: string | null = null;
    while (actual && cadena.length < 20 && !vistos.has(actual.ticketId)) {
      vistos.add(actual.ticketId);
      cadena.push(actual);
      if (actual.followUp && !actual.parentTicketId) {
        // Es follow-up pero la relación padre no es verificable.
        return {
          existente: null,
          proyectado: null,
          raiz: null,
          relacionPendiente: true,
          evidenciaRelacion: "RELACION_NO_DISPONIBLE",
        };
      }
      if (!actual.parentTicketId) {
        raiz = actual.ticketId;
        break;
      }
      const padre = await obtenerNodoCadena(actual.parentTicketId, source);
      if (!padre) {
        return {
          existente: null,
          proyectado: null,
          raiz: null,
          relacionPendiente: true,
          evidenciaRelacion: "CADENA_INCOMPLETA",
        };
      }
      actual = padre;
    }

    for (const nodo of cadena) {
      const existente = await qdService.porTicketGeneral(nodo.ticketId, tipo);
      if (existente) {
        return {
          existente,
          proyectado: null,
          raiz,
          relacionPendiente: false,
          evidenciaRelacion: "RELACION_VERIFICADA",
        };
      }
      const proyectado = proyectados.get(nodo.ticketId);
      if (proyectado) {
        return {
          existente: null,
          proyectado,
          raiz,
          relacionPendiente: false,
          evidenciaRelacion: "RELACION_VERIFICADA",
        };
      }
    }

    return {
      existente: null,
      proyectado: null,
      raiz,
      relacionPendiente: raiz == null,
      evidenciaRelacion: raiz == null ? "CADENA_INCOMPLETA" : "RELACION_VERIFICADA",
    };
  } catch {
    return {
      existente: null,
      proyectado: null,
      raiz: null,
      relacionPendiente: true,
      evidenciaRelacion: "ERROR_CONSULTA",
    };
  }
}

interface CommonResultado {
  fecha: string;
  fechaIso: string | null;
  fechaSolicitud: string;
  tipo: "queja" | "devolucion";
  categoriaQyd: string;
  clasificacionQueja: string | null;
  universo: UniversoTicket;
  dominio: string;
  dominioOriginal: string | null;
  sinDominio: boolean;
  canal: string | null;
}

/**
 * Proyecta la reutilización de un expediente. Si el ticket no tiene dominio y
 * el expediente tampoco tiene uno válido, se proyecta su regularización a
 * SIN DOMINIO + CERRADO. Si el expediente ya tiene dominio real, se conserva.
 */
function proyectarReutilizacion(
  ticket: QydBackfillTicket,
  existente: QdCasoRow,
  common: CommonResultado,
  raiz: string | null,
  evidenciaRelacion: string,
): ResultadoItem {
  // Regla de la carga real: un expediente existente NO se modifica. Se
  // reutiliza tal cual, conservando estado, dominio, fecha y datos operativos.
  return resultado(
    ticket,
    "REUTILIZADO",
    "YA_EXISTE",
    {
      ...common,
      caso: existente,
      ticketRaiz: raiz ?? existente.ticket_id ?? ticket.ticketId,
      dominioProyectado: existente.dominio ?? null,
      estadoProyectado: existente.estado ?? null,
      casoCerradoProyectado: !!existente.caso_cerrado,
      evidenciaRelacion,
    },
  );
}

async function procesarTicketDryRun(
  ticket: QydBackfillTicket,
  source: QydBackfillSource,
  proyectados: Map<string, CasoProyectado>,
  common: CommonResultado,
  permitirRaizIndependiente = false,
): Promise<ResultadoItem> {
  // Si el ticket ya está representado por un expediente del mismo tipo, la
  // reutilización es segura aunque la cadena no esté verificada: el vínculo ya
  // existe en PostgreSQL. No se crea ni se inventa nada.
  const existenteDirecto = await qdService.porTicketGeneral(ticket.ticketId, common.tipo);
  if (existenteDirecto) {
    return proyectarReutilizacion(
      ticket, existenteDirecto, common, existenteDirecto.ticket_id, "EXPEDIENTE_EXISTENTE",
    );
  }

  const resolucion = await resolverCadenaSoloLectura(
    ticket, common.tipo, source, proyectados,
    { permitirRaizSinRelacion: common.sinDominio || permitirRaizIndependiente },
  );
  if (resolucion.existente) {
    return proyectarReutilizacion(
      ticket, resolucion.existente, common, resolucion.raiz, resolucion.evidenciaRelacion,
    );
  }
  if (resolucion.proyectado) {
    const estadoProyectado = resolucion.proyectado.estadoProyectado
      ?? (common.sinDominio ? ESTADO_CERRADO : "Pendiente de conciliación");
    const dominioProyectado = resolucion.proyectado.dominioProyectado
      ?? (common.sinDominio ? DOMINIO_SIN_DOMINIO : common.dominio);
    return resultado(ticket, "REUTILIZADO", "REUTILIZAR_PROYECTADO", {
      ...common,
      proyectado: resolucion.proyectado,
      ticketRaiz: resolucion.raiz,
      estadoProyectado,
      dominioProyectado,
      casoCerradoProyectado: resolucion.proyectado.casoCerradoProyectado ?? common.sinDominio,
      evidenciaRelacion: resolucion.evidenciaRelacion,
    });
  }
  if (resolucion.relacionPendiente) {
    return resultado(ticket, "PENDIENTE", "PENDIENTE_RELACION", {
      ...common,
      ticketRaiz: null,
      evidenciaRelacion: resolucion.evidenciaRelacion,
    });
  }
  const raiz = resolucion.raiz ?? ticket.ticketId;
  const estadoProyectado = common.sinDominio ? ESTADO_CERRADO : "Pendiente de conciliación";
  const dominioProyectado = common.sinDominio ? DOMINIO_SIN_DOMINIO : common.dominio;
  const casoCerradoProyectado = common.sinDominio;
  proyectados.set(raiz, {
    ticketId: raiz,
    tipo: common.tipo,
    estadoProyectado,
    dominioProyectado,
    casoCerradoProyectado,
  });
  return resultado(ticket, "CREADO", "SIMULADO", {
    ...common,
    ticketRaiz: raiz,
    estadoProyectado,
    dominioProyectado,
    casoCerradoProyectado,
    evidenciaRelacion: resolucion.evidenciaRelacion,
  });
}

async function procesarTicket(
  ticket: QydBackfillTicket,
  opts: {
    dryRun: boolean;
    usuario: string | null;
    source: QydBackfillSource;
    proyectados?: Map<string, CasoProyectado>;
    /** true = permite crear una raíz cuando no hay padre/follow-ups conocidos. */
    permitirRaizIndependiente?: boolean;
  },
): Promise<ResultadoItem> {
  const evaluacion = evaluarTicket(ticket);
  if (!evaluacion.fecha) {
    return resultado(ticket, "PENDIENTE", "PENDIENTE_FECHA", {
      fechaIso: evaluacion.fechaIso,
      universo: evaluacion.universo,
      dominioOriginal: evaluacion.dominioOriginal,
      sinDominio: evaluacion.sinDominio,
      dominio: evaluacion.dominio,
    });
  }
  const base = {
    fecha: evaluacion.fecha,
    fechaIso: evaluacion.fechaIso,
    fechaSolicitud: evaluacion.fechaIso ?? evaluacion.fecha,
    universo: evaluacion.universo,
    dominio: evaluacion.dominio,
    dominioOriginal: evaluacion.dominioOriginal,
    sinDominio: evaluacion.sinDominio,
    canal: evaluacion.canal,
  };

  // Exclusión explícita y separada: no generan pendientes ni incidencias.
  if (evaluacion.universo === "SIN_CATEGORIZAR") {
    return resultado(ticket, "OMITIDO", "SIN_CATEGORIZAR", base);
  }
  if (evaluacion.universo === "NO_QYD" || !evaluacion.clasificacion) {
    return resultado(ticket, "OMITIDO", "NO_ELEGIBLE_QYD", base);
  }

  const tipo = evaluacion.tipo as "queja" | "devolucion";
  const common: CommonResultado = {
    ...base,
    tipo,
    categoriaQyd: evaluacion.clasificacion.categoria,
    clasificacionQueja: evaluacion.clasificacionQueja,
  };

  if (!evaluacion.canal) {
    return resultado(ticket, "PENDIENTE", "PENDIENTE_CANAL", common);
  }

  // El dominio ya está resuelto: real o `SIN DOMINIO`. No se bloquea por
  // dominio; la regla es crear/reutilizar y dejar CERRADO cuando falta.
  if (opts.dryRun) {
    return procesarTicketDryRun(
      ticket, opts.source, opts.proyectados ?? new Map(), common,
      opts.permitirRaizIndependiente === true,
    );
  }

  try {
    const r = await qdService.crearDesdeCategorizacion({
      ticketId: ticket.ticketId,
      ticketPadreId: ticket.parentTicketId,
      followupIds: ticket.followupIds,
      relacionVerificada: ticket.viaSourcePresent,
      tipo,
      asesor: ticket.assigneeName,
      dominio: evaluacion.dominio,
      dominioOriginal: evaluacion.dominioOriginal,
      pais: ticket.country,
      estado: evaluacion.sinDominio ? ESTADO_CERRADO : "Pendiente de conciliación",
      estadoTicket: ticket.status,
      canal: evaluacion.canal,
      fechaSolicitud: common.fechaSolicitud,
      permitirZendesk: false,
      permitirSinRelacionVerificada: opts.permitirRaizIndependiente === true || evaluacion.sinDominio,
      persistirRelacion: false,
      ...(common.clasificacionQueja ? { clasificacion: common.clasificacionQueja } : {}),
    }, opts.usuario);

    const estadoProyectado = r.caso?.estado
      ?? (evaluacion.sinDominio ? ESTADO_CERRADO : "Pendiente de conciliación");
    const dominioProyectado = r.caso?.dominio
      ?? (evaluacion.sinDominio ? DOMINIO_SIN_DOMINIO : evaluacion.dominio);
    const casoCerradoProyectado = r.caso?.caso_cerrado ?? evaluacion.sinDominio;
    if (r.creado) {
      return resultado(ticket, "CREADO", null, {
        ...common, caso: r.caso, estadoProyectado, dominioProyectado, casoCerradoProyectado,
        evidenciaRelacion: ticket.viaSourcePresent
          ? "RELACION_VERIFICADA"
          : "SIN_DOMINIO_RAIZ_INDEPENDIENTE",
      });
    }
    if (r.reutilizado) {
      return resultado(
        ticket,
        "REUTILIZADO",
        evaluacion.sinDominio && r.caso?.dominio === DOMINIO_SIN_DOMINIO
          ? "SIN_DOMINIO_REUTILIZADO_CERRADO"
          : "YA_EXISTE",
        {
          ...common, caso: r.caso, estadoProyectado, dominioProyectado, casoCerradoProyectado,
          evidenciaRelacion: r.caso ? "EXPEDIENTE_EXISTENTE" : "RELACION_VERIFICADA",
        },
      );
    }
    return resultado(ticket, "PENDIENTE", r.motivoNoCreacion ?? "PENDIENTE", {
      ...common,
      evidenciaRelacion: r.motivoNoCreacion === "PENDIENTE_RELACION"
        ? "SIN_EVIDENCIA"
        : null,
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    return resultado(ticket, "ERROR", detalle.slice(0, MAX_ERROR_DETALLE), common);
  }
}

export interface ReparacionFechasResultado {
  revisados: number;
  recuperados: number;
  noRecuperables: number;
  incidencias: number;
  dryRun: boolean;
  detalle: { casoId: string; ticketId: string | null; resultado: string; fecha?: string | null }[];
}

/**
 * Repara `fecha_solicitud` de expedientes existentes usando el
 * `tickets_created_at` verificable de PostgreSQL. Conserva el instante exacto
 * (fecha + hora, UTC) y no aplica conversiones de zona horaria. Si no se puede
 * verificar, registra una incidencia y deja la fecha en NULL (no inventa datos).
 */
export async function repararFechasFaltantes(opts: {
  source: QydBackfillSource;
  usuario: string | null;
  dryRun: boolean;
  limite?: number;
}): Promise<ReparacionFechasResultado> {
  const casos = await qdRepository.casosSinFecha(opts.limite ?? 500);
  const out: ReparacionFechasResultado = {
    revisados: casos.length,
    recuperados: 0,
    noRecuperables: 0,
    incidencias: 0,
    dryRun: opts.dryRun,
    detalle: [],
  };

  for (const caso of casos) {
    if (!caso.ticket_id) {
      out.noRecuperables += 1;
      out.detalle.push({ casoId: caso.id, ticketId: null, resultado: "SIN_TICKET" });
      if (!opts.dryRun) {
        const creada = await qdRepository.registrarIncidenciaDato({
          casoId: caso.id,
          ticketId: null,
          tipo: "FECHA_SIN_TICKET",
          detalle: "El expediente no tiene ticket asociado; no se puede recuperar la fecha de origen.",
        });
        if (creada) out.incidencias += 1;
      }
      continue;
    }

    let fecha: string | null = null;
    let error: string | null = null;
    try {
      const ticket = await opts.source.obtenerTicket(caso.ticket_id);
      // Se conserva el instante exacto de tickets_created_at (UTC), sin
      // convertir a America/Lima ni usar la fecha del proceso.
      fecha = fechaOrigenExacta(ticket?.createdAt);
      if (!ticket) error = "Ticket no encontrado en la fuente PostgreSQL.";
      else if (!fecha) error = "El ticket no tiene tickets_created_at confiable.";
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    if (fecha) {
      out.recuperados += 1;
      out.detalle.push({ casoId: caso.id, ticketId: caso.ticket_id, resultado: "RECUPERADO", fecha });
      if (!opts.dryRun) {
        const actualizado = await qdRepository.actualizarFechaSolicitud(caso.id, fecha);
        if (actualizado) {
          await qdRepository.registrarAuditoria(
            caso.id, opts.usuario, "fecha_recuperada", "fecha_solicitud",
            null, `Fecha de origen recuperada desde PostgreSQL #${caso.ticket_id}: ${fecha}`,
          );
        }
      }
      continue;
    }

    out.noRecuperables += 1;
    out.detalle.push({ casoId: caso.id, ticketId: caso.ticket_id, resultado: "NO_VERIFICABLE" });
    if (!opts.dryRun) {
      const creada = await qdRepository.registrarIncidenciaDato({
        casoId: caso.id,
        ticketId: caso.ticket_id,
        tipo: "FECHA_NO_VERIFICABLE",
        detalle: error ?? "No se pudo verificar la fecha en PostgreSQL.",
      });
      if (creada) out.incidencias += 1;
    }
  }

  return out;
}

async function resumenRun(run: BackfillRunRow, ventanas: number, reparacion?: ReparacionFechasResultado): Promise<BackfillResumen> {
  const r = await qydBackfillRepository.resumenItems(run.id);
  return {
    runId: run.id,
    estado: run.estado,
    dryRun: run.dry_run,
    controlPersistido: true,
    desde: run.desde,
    hasta: run.hasta,
    ventanas,
    ...r,
    universo: {
      total: r.total,
      sinCategorizar: 0,
      noQyd: 0,
      qydElegibles: r.creados + r.reutilizados + r.pendientes,
    },
    candidatosCrear: r.creados,
    reutilizables: r.reutilizados,
    omitidosQyd: 0,
    pendientesRelacion: r.pendientesPorMotivo.PENDIENTE_RELACION ?? 0,
    sinDominioRegularizado: 0,
    sinDominioCerrado: 0,
    fechasRecuperadas: reparacion?.recuperados ?? 0,
    fechasNoRecuperables: reparacion?.noRecuperables ?? 0,
    incidenciasFecha: reparacion?.incidencias ?? 0,
    detalle: null,
  };
}

/**
 * Dry-run estrictamente de solo lectura: no crea runs, checkpoints, ítems ni
 * expedientes. Solo lee Zendesk/BD y devuelve conteos proyectados en memoria.
 * Es el modo por defecto de `dryRun`.
 */
interface DryRunInterno {
  resumen: BackfillResumen;
  items: ResultadoItem[];
}

async function ejecutarDryRunSoloLectura(opts: {
  desde: string;
  hasta: string;
  usuario: string | null;
  source: QydBackfillSource;
  porPagina: number;
  ventanas: { desde: string; hastaExclusivo: string }[];
  repararFechas?: boolean;
  incluirDetalle?: boolean;
  paginaDetalle?: number;
  porPaginaDetalle?: number;
  permitirRaizIndependiente?: boolean;
}): Promise<DryRunInterno> {
  let reparacion: ReparacionFechasResultado | undefined;
  if (opts.repararFechas !== false) {
    reparacion = await repararFechasFaltantes({
      source: opts.source, usuario: opts.usuario, dryRun: true,
    });
  }

  const tickets: QydBackfillTicket[] = [];
  const vistos = new Set<string>();
  for (const ventana of opts.ventanas) {
    let pagina = 1;
    for (;;) {
      const page = await opts.source.listarTickets({
        desde: ventana.desde,
        hastaExclusivo: ventana.hastaExclusivo,
        pagina,
        porPagina: opts.porPagina,
      });
      if (page.total > MAX_RESULTADOS_VENTANA) {
        throw new DomainError(
          `La ventana ${ventana.desde} → ${ventana.hastaExclusivo} tiene ${page.total} tickets, ` +
          `por encima del límite paginable (${MAX_RESULTADOS_VENTANA}). ` +
          "Divida el rango e inicie una nueva ejecución con un tramo menor.",
          "BACKFILL_VENTANA_EXCEDIDA",
        );
      }
      for (const ticket of page.tickets) {
        if (vistos.has(ticket.ticketId)) continue;
        vistos.add(ticket.ticketId);
        tickets.push(ticket);
      }
      if (!page.hasMore || page.tickets.length === 0) break;
      pagina += 1;
    }
  }

  // Orden estable para que dos simulaciones produzcan el mismo detalle y para
  // que un follow-up vea el caso raíz proyectado antes que él.
  const ordenados = [...tickets].sort((a, b) => {
    const fa = a.createdAt ?? "";
    const fb = b.createdAt ?? "";
    if (fa !== fb) return fa.localeCompare(fb);
    return a.ticketId.localeCompare(b.ticketId, undefined, { numeric: true });
  });

  const items: ResultadoItem[] = [];
  const proyectados = new Map<string, CasoProyectado>();
  for (const ticket of ordenados) {
    items.push(await procesarTicket(ticket, {
      dryRun: true,
      usuario: opts.usuario,
      source: opts.source,
      proyectados,
      permitirRaizIndependiente: opts.permitirRaizIndependiente,
    }));
  }

  const resumen: BackfillResumen = {
    runId: `dry-run-${Date.now()}`,
    estado: "SIMULADO",
    dryRun: true,
    controlPersistido: false,
    desde: opts.desde,
    hasta: opts.hasta,
    ventanas: opts.ventanas.length,
    ...resumirResultados(items),
    fechasRecuperadas: reparacion?.recuperados ?? 0,
    fechasNoRecuperables: reparacion?.noRecuperables ?? 0,
    incidenciasFecha: 0,
    detalle: opts.incluirDetalle !== false
      ? construirDetallePage(items, opts.paginaDetalle ?? 1, opts.porPaginaDetalle ?? 50)
      : null,
  };
  return { resumen, items };
}

/**
 * Exporta el dry-run completo a CSV sin escribir en base de datos.
 */
export async function exportarDryRunCsv(opts: {
  desde: string;
  hasta: string;
  usuario: string | null;
  source?: QydBackfillSource;
  porPagina?: number;
  repararFechas?: boolean;
}): Promise<{ csv: string; total: number; filename: string }> {
  const source = opts.source ?? postgresBackfillSource;
  const porPagina = Math.min(Math.max(opts.porPagina ?? 100, 1), 100);
  const ventanas = construirVentanasMensuales(opts.desde, opts.hasta);
  const dry = await ejecutarDryRunSoloLectura({
    desde: opts.desde,
    hasta: opts.hasta,
    usuario: opts.usuario,
    source,
    porPagina,
    ventanas,
    repararFechas: opts.repararFechas,
    incluirDetalle: false,
  });
  return {
    csv: construirCsvDetalle(dry.items),
    total: dry.items.length,
    filename: `qyd-dry-run-${opts.desde}-${opts.hasta}.csv`,
  };
}

export async function ejecutarBackfillZendesk(opts: {
  desde: string;
  hasta: string;
  usuario: string | null;
  dryRun: boolean;
  source?: QydBackfillSource;
  porPagina?: number;
  reanudarRunId?: string;
  repararFechas?: boolean;
  /** true para persistir control en dry-run; por defecto el dry-run no escribe. */
  persistirControl?: boolean;
  /** Devuelve el detalle auditables por ticket (solo dry-run de solo lectura). */
  incluirDetalle?: boolean;
  paginaDetalle?: number;
  porPaginaDetalle?: number;
  /**
   * true = permite crear una raíz cuando no hay padre/follow-ups conocidos.
   * Se usa en la carga histórica multicanal. No inventa relaciones: si hay
   * un padre conocido, la cadena sigue siendo obligatoria.
   */
  permitirRaizIndependiente?: boolean;
}): Promise<BackfillResumen> {
  const source = opts.source ?? postgresBackfillSource;
  const porPagina = Math.min(Math.max(opts.porPagina ?? 100, 1), 100);
  const ventanas = construirVentanasMensuales(opts.desde, opts.hasta);
  const persistirControl = opts.persistirControl ?? !opts.dryRun;

  if (opts.dryRun && !persistirControl) {
    if (opts.reanudarRunId) {
      throw new DomainError(
        "El dry-run de solo lectura no usa checkpoints. No envíe reanudarRunId.",
        "BACKFILL_DRY_RUN_SIN_CHECKPOINTS",
      );
    }
    const dry = await ejecutarDryRunSoloLectura({
      desde: opts.desde,
      hasta: opts.hasta,
      usuario: opts.usuario,
      source,
      porPagina,
      ventanas,
      repararFechas: opts.repararFechas,
      incluirDetalle: opts.incluirDetalle,
      paginaDetalle: opts.paginaDetalle,
      porPaginaDetalle: opts.porPaginaDetalle,
      permitirRaizIndependiente: opts.permitirRaizIndependiente,
    });
    return dry.resumen;
  }
  if (!opts.dryRun && !persistirControl) {
    throw new DomainError(
      "La ejecución real requiere persistir checkpoints para poder reanudarse.",
      "BACKFILL_CONTROL_REQUERIDO",
    );
  }

  let run: BackfillRunRow;
  if (opts.reanudarRunId) {
    const existente = await qydBackfillRepository.obtenerRun(opts.reanudarRunId);
    if (!existente) throw new DomainError("Ejecución de backfill no encontrada.", "BACKFILL_NO_ENCONTRADO");
    if (existente.desde !== opts.desde || existente.hasta !== opts.hasta) {
      throw new DomainError("La ejecución a reanudar tiene un rango distinto.", "BACKFILL_RANGO_INVALIDO");
    }
    run = existente;
    if (run.estado === "COMPLETADO") return resumenRun(run, ventanas.length);
    if (!["EN_PROGRESO", "FALLIDO", "DETENIDO"].includes(run.estado)) {
      throw new DomainError(`La ejecución está en estado ${run.estado} y no se puede reanudar.`, "BACKFILL_NO_REANUDABLE");
    }
    if (run.estado !== "EN_PROGRESO") {
      await qydBackfillRepository.actualizarRun(run.id, { estado: "EN_PROGRESO", errorDetalle: null });
      run = { ...run, estado: "EN_PROGRESO" };
    }
  } else {
    const activo = await qydBackfillRepository.runActivo();
    if (activo) {
      throw new DomainError(
        `Ya existe un backfill en progreso (${activo.id}). Reanude esa ejecución o espere a que termine.`,
        "BACKFILL_EN_PROGRESO",
      );
    }
    try {
      run = await qydBackfillRepository.crearRun({
        desde: opts.desde, hasta: opts.hasta, dryRun: opts.dryRun, usuario: opts.usuario,
      });
    } catch (err) {
      if (eViolacionUnica(err)) {
        throw new DomainError("Ya existe un backfill en progreso.", "BACKFILL_EN_PROGRESO");
      }
      throw err;
    }
  }

  let reparacion: ReparacionFechasResultado | undefined;
  try {
    if (opts.repararFechas !== false) {
      reparacion = await repararFechasFaltantes({
        source, usuario: opts.usuario, dryRun: opts.dryRun,
      });
    }

    for (const ventana of ventanas) {
      let pagina = run.cursor_ventana === ventana.desde && run.cursor_pagina
        ? run.cursor_pagina
        : 1;

      for (;;) {
        const cp = await qydBackfillRepository.asegurarCheckpoint({
          runId: run.id,
          ventanaDesde: ventana.desde,
          ventanaHastaExclusiva: ventana.hastaExclusivo,
          pagina,
        });

        if (cp.estado === "COMPLETADO") {
          pagina += 1;
          continue;
        }

        const page = await source.listarTickets({
          desde: ventana.desde,
          hastaExclusivo: ventana.hastaExclusivo,
          pagina,
          porPagina,
        });

        // Zendesk limita los resultados paginables de una búsqueda. Si una
        // ventana mensual supera el límite, se detiene con un error trazable
        // para ejecutar el rango en tramos menores; no se pierden datos.
        if (page.total > MAX_RESULTADOS_VENTANA) {
          throw new DomainError(
            `La ventana ${ventana.desde} → ${ventana.hastaExclusivo} tiene ${page.total} tickets, ` +
            `por encima del límite paginable (${MAX_RESULTADOS_VENTANA}). ` +
            "Divida el rango e inicie una nueva ejecución con un tramo menor.",
            "BACKFILL_VENTANA_EXCEDIDA",
          );
        }

        let procesados = 0;
        let ultimoTicket: string | null = null;
        for (const ticket of page.tickets) {
          ultimoTicket = ticket.ticketId;
          if (await qydBackfillRepository.existeItem(run.id, ticket.ticketId)) continue;
          const r = await procesarTicket(ticket, {
            dryRun: opts.dryRun,
            usuario: opts.usuario,
            source,
            permitirRaizIndependiente: opts.permitirRaizIndependiente,
          });
          await qydBackfillRepository.registrarItem({
            runId: run.id,
            ticketId: ticket.ticketId,
            ticketCreatedAt: ticket.createdAt ? new Date(ticket.createdAt) : null,
            categoriaRaw: ticket.categoriaRaw,
            subcategoriaRaw: ticket.subcategoriaRaw ?? ticket.categoriaRaw,
            tipo: r.tipo,
            estado: r.estado,
            motivo: r.motivo,
            casoId: r.casoId,
            numero: r.numero,
            fechaSolicitud: r.fechaSolicitud,
          });
          procesados += 1;
        }

        await qydBackfillRepository.marcarCheckpoint(cp.id, {
          estado: "COMPLETADO",
          procesados,
          ultimoTicketId: ultimoTicket,
        });
        await qydBackfillRepository.actualizarRun(run.id, {
          cursorVentana: ventana.desde,
          cursorPagina: pagina,
        });

        if (!page.hasMore || page.tickets.length === 0) break;
        pagina += 1;
      }
    }

    await qydBackfillRepository.actualizarRun(run.id, {
      estado: "COMPLETADO", finalizado: true,
    });
    run = (await qydBackfillRepository.obtenerRun(run.id)) as BackfillRunRow;
    return resumenRun(run, ventanas.length, reparacion);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    await qydBackfillRepository.actualizarRun(run.id, {
      estado: "FALLIDO", errorDetalle: detalle.slice(0, MAX_ERROR_DETALLE), finalizado: true,
    });
    throw err;
  }
}

function eViolacionUnica(err: unknown): boolean {
  const e = err as { code?: string; meta?: { code?: string } } | null;
  return e?.code === "23505" || e?.code === "P2002"
    || (e?.code === "P2010" && e?.meta?.code === "23505");
}

export function resumenDesdeRun(run: BackfillRunRow): Promise<BackfillResumen> {
  const ventanas = construirVentanasMensuales(run.desde, run.hasta).length;
  return resumenRun(run, ventanas);
}
