/**
 * Resolución de la cadena de tickets de Quejas y Devoluciones (H-04).
 *
 * Regla:
 *   - La raíz del expediente es el primer ticket del hilo que no tiene padre
 *     (via.source.rel === "follow_up" de Zendesk).
 *   - La cadena se resuelve SIEMPRE fuera de la transacción de creación, para
 *     no mantener un advisory lock durante llamadas de red.
 *   - Dentro de la transacción solo se revalida que las relaciones usadas
 *     sigan siendo las mismas en qd_relaciones_ticket.
 *   - Si un eslabón no se puede resolver, se devuelve PENDIENTE_RELACION y no
 *     se crea ningún expediente hijo.
 */
import { prisma } from "../repositories/prisma";
import type { DbExecutor } from "../repositories/quejasDevoluciones.repository";
import { ZendeskClient } from "../modules/zendesk/infrastructure/ZendeskClient";

/** Vigencia de la caché de relaciones. Pasado este tiempo se refresca. */
export const QD_RELACION_TTL_MS = 24 * 60 * 60 * 1000;

/** Límite de seguridad para cadenas de follow_up. */
export const QD_MAX_PROFUNDIDAD_CADENA = 20;

export interface EslabonCadena {
  ticketId: string;
  padre: string | null;
}

export interface ResolucionCadenaOk {
  ok: true;
  rootTicketId: string;
  /** Del ticket consultado hacia la raíz: [ticket, padre, abuelo, ..., raíz]. */
  cadena: string[];
  eslabones: EslabonCadena[];
}

export interface ResolucionCadenaPendiente {
  ok: false;
  motivo: "PENDIENTE_RELACION";
  detalle: string;
}

export type ResolucionCadena = ResolucionCadenaOk | ResolucionCadenaPendiente;

interface FilaRelacion {
  ticket_id: string;
  ticket_padre_id: string | null;
  followup_ids: unknown;
  origen: string;
  fetched_at: Date;
}

interface RelacionZendesk {
  padre: string | null;
  /** null = Zendesk no informó followup_ids; no debe sobrescribir la caché. */
  followups: string[] | null;
}

const zendesk = new ZendeskClient();

function esRelacionVigente(fila: FilaRelacion): boolean {
  if (fila.origen !== "zendesk") return false;
  const fetchedAt = new Date(fila.fetched_at).getTime();
  if (!Number.isFinite(fetchedAt)) return false;
  return Date.now() - fetchedAt <= QD_RELACION_TTL_MS;
}

async function leerRelacion(ticketId: string, executor: DbExecutor = prisma): Promise<FilaRelacion | null> {
  const rows = await executor.$queryRaw<FilaRelacion[]>`
    SELECT ticket_id, ticket_padre_id, followup_ids, origen, fetched_at
    FROM qd_relaciones_ticket
    WHERE ticket_id = ${ticketId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function consultarZendesk(ticketId: string): Promise<RelacionZendesk | null> {
  const numId = Number(ticketId);
  if (!Number.isInteger(numId) || numId <= 0) return null;

  try {
    const ticket = await zendesk.obtenerTicket(numId) as unknown as {
      via?: { source?: { rel?: string | null; from?: { ticket_id?: number | null } } };
      followup_ids?: number[];
    } | null;
    if (!ticket) return null;

    // Una respuesta sin `via.source` es incompleta: no permite afirmar que el
    // ticket no tiene padre. Devolver null evita sobrescribir una relación
    // válida ya cacheada con un "sin padre" ficticio.
    if (!ticket.via?.source) return null;

    const esFollowUp = ticket.via.source.rel === "follow_up";
    const padre = esFollowUp && ticket.via.source.from?.ticket_id != null
      ? String(ticket.via.source.from.ticket_id)
      : null;

    return {
      padre,
      followups: Array.isArray(ticket.followup_ids)
        ? ticket.followup_ids.map(String)
        : null,
    };
  } catch {
    return null;
  }
}

async function guardarRelacion(
  ticketId: string,
  relacion: RelacionZendesk,
  executor: DbExecutor = prisma,
): Promise<void> {
  const tieneFollowups = relacion.followups !== null;
  const followupsJson = JSON.stringify(relacion.followups ?? []);
  await executor.$executeRaw`
    INSERT INTO qd_relaciones_ticket (ticket_id, ticket_padre_id, followup_ids, origen, fetched_at)
    VALUES (
      ${ticketId},
      ${relacion.padre},
      CASE WHEN ${tieneFollowups}::boolean THEN CAST(${followupsJson} AS jsonb) ELSE NULL END,
      'zendesk',
      now()
    )
    ON CONFLICT (ticket_id) DO UPDATE SET
      ticket_padre_id = EXCLUDED.ticket_padre_id,
      followup_ids = CASE
        WHEN ${tieneFollowups}::boolean THEN EXCLUDED.followup_ids
        ELSE qd_relaciones_ticket.followup_ids
      END,
      origen = 'zendesk',
      fetched_at = now()
  `;
}

/**
 * Fixa una relación ya observada en una consulta fresca a Zendesk (por ejemplo,
 * el ticket que el controlador acaba de leer). No inventa followups: conserva
 * los existentes en la caché y solo actualiza el padre.
 */
async function fijarRelacionObservada(
  ticketId: string,
  padre: string | null,
  followups: string[] | undefined,
): Promise<void> {
  const tieneFollowups = followups !== undefined;
  const followupsJson = JSON.stringify(followups ?? []);
  await prisma.$executeRaw`
    INSERT INTO qd_relaciones_ticket (ticket_id, ticket_padre_id, followup_ids, origen, fetched_at)
    VALUES (
      ${ticketId},
      ${padre},
      CASE WHEN ${tieneFollowups}::boolean THEN CAST(${followupsJson} AS jsonb) ELSE NULL END,
      'zendesk',
      now()
    )
    ON CONFLICT (ticket_id) DO UPDATE SET
      ticket_padre_id = EXCLUDED.ticket_padre_id,
      followup_ids = CASE
        WHEN ${tieneFollowups}::boolean THEN EXCLUDED.followup_ids
        ELSE qd_relaciones_ticket.followup_ids
      END,
      origen = 'zendesk',
      fetched_at = now()
  `;
}

async function resolverRelacion(
  ticketId: string,
  padreConocido: string | null | undefined,
  followupsConocidos: string[] | undefined,
  permitirZendesk = true,
  noPersistir = false,
): Promise<{ ok: true; padre: string | null } | { ok: false; detalle: string }> {
  // El controlador ya consultó este ticket a Zendesk; su padre es fresco y
  // evita una segunda llamada de red. Se persiste para poder revalidarlo en tx,
  // salvo en modo noPersistir (carga histórica read-only de relaciones).
  if (padreConocido !== undefined) {
    if (!noPersistir) {
      await fijarRelacionObservada(ticketId, padreConocido, followupsConocidos);
    }
    return { ok: true, padre: padreConocido };
  }

  const cache = await leerRelacion(ticketId);
  if (cache && esRelacionVigente(cache)) {
    return { ok: true, padre: cache.ticket_padre_id };
  }

  if (!permitirZendesk) {
    return {
      ok: false,
      detalle: `La relación del ticket #${ticketId} no está disponible en PostgreSQL. ` +
        "No se consulta Zendesk durante la regularización histórica.",
    };
  }

  const relacion = await consultarZendesk(ticketId);
  if (!relacion) {
    return {
      ok: false,
      detalle: `No se pudo verificar la relación del ticket #${ticketId} con Zendesk.`,
    };
  }

  if (!noPersistir) {
    await guardarRelacion(ticketId, relacion);
  }
  return { ok: true, padre: relacion.padre };
}

/**
 * Resuelve la cadena completa hasta la raíz.
 *
 * @param ticketId ticket que se está categorizando
 * @param opciones.padreConocido padre directo ya consultado en Zendesk. Si se
 *   omite, el servicio consulta la caché/API. Puede ser null cuando se sabe
 *   que el ticket no tiene padre.
 * @param opciones.followupIds hijos ya observados en la misma consulta. Se
 *   conservan en la caché para no degradar la reconstrucción histórica.
 */
export async function resolverCadenaTicket(
  ticketId: string,
  opciones: {
    padreConocido?: string | null;
    followupIds?: string[];
    /** false = solo caché PostgreSQL; nunca consulta la API de Zendesk. */
    permitirZendesk?: boolean;
    /** true = no escribe ni refresca qd_relaciones_ticket. */
    noPersistir?: boolean;
  } = {},
): Promise<ResolucionCadena> {
  const permitirZendesk = opciones.permitirZendesk !== false;
  const noPersistir = opciones.noPersistir === true;
  const cadena: string[] = [];
  const eslabones: EslabonCadena[] = [];
  const visitados = new Set<string>();
  let actual = ticketId;

  // Cada eslabón se persiste (upsert) antes de regresar. Por eso la validación
  // transaccional siempre encuentra filas reales que bloquear con FOR UPDATE:
  // no queda una relación "nueva" sin fila que el lock no pueda proteger.

  for (let profundidad = 0; profundidad <= QD_MAX_PROFUNDIDAD_CADENA; profundidad++) {
    if (visitados.has(actual)) {
      return {
        ok: false,
        motivo: "PENDIENTE_RELACION",
        detalle: `La cadena de tickets contiene un ciclo en #${actual}.`,
      };
    }
    visitados.add(actual);
    cadena.push(actual);

    const padreConocido = profundidad === 0 ? opciones.padreConocido : undefined;
    const followupsConocidos = profundidad === 0 ? opciones.followupIds : undefined;
    const relacion = await resolverRelacion(
      actual, padreConocido, followupsConocidos, permitirZendesk, noPersistir,
    );
    if (!relacion.ok) {
      return { ok: false, motivo: "PENDIENTE_RELACION", detalle: relacion.detalle };
    }

    eslabones.push({ ticketId: actual, padre: relacion.padre });
    if (!relacion.padre) {
      return { ok: true, rootTicketId: actual, cadena, eslabones };
    }
    actual = relacion.padre;
  }

  return {
    ok: false,
    motivo: "PENDIENTE_RELACION",
    detalle: `La cadena de tickets supera la profundidad máxima (${QD_MAX_PROFUNDIDAD_CADENA}).`,
  };
}

/**
 * Revalida dentro de la transacción que la cadena resuelta previamente sigue
 * siendo la misma. No hace llamadas de red ni mantiene locks durante I/O.
 */
export async function validarCadenaEnTx(
  tx: DbExecutor,
  resolucion: ResolucionCadenaOk,
): Promise<{ ok: true } | { ok: false; detalle: string }> {
  const ids = resolucion.eslabones.map((e) => e.ticketId);
  if (ids.length === 0) return { ok: false, detalle: "Cadena vacía." };

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await tx.$queryRawUnsafe<FilaRelacion[]>(
    `SELECT ticket_id, ticket_padre_id, origen
     FROM qd_relaciones_ticket
     WHERE ticket_id IN (${placeholders})
     FOR UPDATE`,
    ...ids,
  );
  const porTicket = new Map(rows.map((r) => [r.ticket_id, r]));

  for (const eslabon of resolucion.eslabones) {
    const fila = porTicket.get(eslabon.ticketId);
    if (!fila) {
      return {
        ok: false,
        detalle: `La relación del ticket #${eslabon.ticketId} desapareció antes de crear el expediente.`,
      };
    }
    if (fila.origen !== "zendesk") {
      return {
        ok: false,
        detalle: `La relación del ticket #${eslabon.ticketId} no está verificada.`,
      };
    }
    if ((fila.ticket_padre_id ?? null) !== eslabon.padre) {
      return {
        ok: false,
        detalle: `La relación del ticket #${eslabon.ticketId} cambió antes de crear el expediente.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Advisory lock transaccional determinista para raíz + tipo. Evita que dos
 * procesos concurrentes creen expedientes distintos para la misma raíz.
 */
export async function bloquearRaizTipo(
  tx: DbExecutor,
  rootTicketId: string,
  tipo: "devolucion" | "queja",
): Promise<void> {
  // Prisma no deserializa columnas de tipo `void`; el cast a text mantiene el
  // efecto del lock y permite consumir el resultado de forma segura.
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(hashtext(${rootTicketId}), hashtext(${tipo}))::text AS locked
  `;
}

export function esViolacionUnica(err: unknown): boolean {
  const e = err as {
    code?: unknown;
    message?: unknown;
    meta?: { code?: unknown; message?: unknown; target?: unknown; constraint?: unknown; database_error?: unknown };
  } | null;
  const code = typeof e?.code === "string" ? e.code : "";
  const metaCode = typeof e?.meta?.code === "string" ? e.meta.code : "";
  const target = e?.meta?.target;
  const targetText = Array.isArray(target) ? target.join(",") : String(target ?? "");
  const detalle = [
    typeof e?.message === "string" ? e.message : "",
    typeof e?.meta?.message === "string" ? e.meta.message : "",
    typeof e?.meta?.constraint === "string" ? e.meta.constraint : "",
    typeof e?.meta?.database_error === "string" ? e.meta.database_error : "",
    targetText,
  ].join(" ");

  const esTargetExpediente =
    /(^|[,\s])ticket_id([,\s]|$)/i.test(targetText)
    && /(^|[,\s])tipo([,\s]|$)/i.test(targetText);
  const esConstraintExpediente =
    /qd_casos_ticket_id_tipo_key/i.test(detalle)
    || /Key \(ticket_id, tipo\)/i.test(detalle)
    || /constraint ["']?qd_casos_ticket_id_tipo_key["']?/i.test(detalle);

  // Prisma puede envolver el 23505 crudo como P2010 con meta.code=23505.
  if (code === "P2002") return esTargetExpediente || esConstraintExpediente;
  if (code === "P2010" && metaCode === "23505") return esConstraintExpediente;
  if (code === "23505") return esConstraintExpediente;
  return false;
}

export const qdCaseResolution = {
  resolverCadenaTicket,
  validarCadenaEnTx,
  bloquearRaizTipo,
  esViolacionUnica,
};
