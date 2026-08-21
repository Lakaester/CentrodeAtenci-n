/**
 * Quejas y Devoluciones — reconstrucción de CASOS con evidencia.
 *
 * Modelo de negocio:
 *   - El TICKET es el contacto/interacción.
 *   - El CASO es la unidad de seguimiento y gestión (1 caso → N tickets).
 *   - Un caso puede extenderse durante varios días y recibir contactos por
 *     WhatsApp, correo u otro canal.
 *
 * Regla para determinar si dos tickets pertenecen al MISMO caso (en orden de
 * prioridad de la evidencia):
 *
 *   1. RELACIÓN EXPLÍCITA (prioridad 1): tickets conectados por follow_up de
 *      Zendesk (`via.source.rel === "follow_up"` con `via.source.from.ticket_id`
 *      o `followup_ids`). Se considera transitivo. Dos tickets que comparten el
 *      MISMO ticket padre externo también se consideran parte del mismo caso
 *      (mismo hilo sobre el mismo asunto original).
 *
 *   2. IDENTIDAD REAL + DOMINIO + TIPO (prioridad 2): tickets con la misma
 *      identidad real de cliente (email o teléfono normalizado, excluyendo el
 *      correo de sistema catch-all y las identidades vacías) + mismo dominio
 *      normalizado + mismo tipo (queja/devolución) → mismo caso. No se usa una
 *      ventana temporal rígida: el caso permanece abierto hasta el cierre.
 *
 *   3. SIN RELACIÓN: tickets sin dominio o sin identidad real → caso
 *      independiente (provisional). No se hace agrupación ciega por dominio+tipo.
 *
 * La reconstrucción es IDEMPOTENTE sobre los casos de origen 'BACKFILL': antes
 * de reconstruir elimina los casos BACKFILL existentes (el respaldo se genera
 * previamente con scripts/respaldo-quejas-devoluciones.js).
 */
import { prisma } from "../repositories/prisma";
import { qdRepository, type QdHistorialRow } from "../repositories/quejasDevoluciones.repository";
import { ZendeskClient } from "../modules/zendesk/infrastructure/ZendeskClient";

export const CATCH_ALL_EMAIL = "notificaciones@mail.restaurant.pe";

export type EvidenciaCaso = "follow_up" | "identidad_dominio" | "singleton";

export interface RelacionTicket {
  padre: string | null;
  followups: string[];
  origen: "zendesk" | "no_disponible";
}

export interface GrupoCaso {
  tipo: "devolucion" | "queja";
  tickets: QdHistorialRow[]; // ordenados por fecha ascendente
  principal: QdHistorialRow;
  dominio: string | null; // dominio normalizado del caso
  ticketPadreId: string | null;
  evidencia: EvidenciaCaso;
}

export interface ReconstruccionResultado {
  desde: string;
  hasta: string;
  ticketsHistoricos: number;
  casosCreados: number;
  casosBorrados: number;
  ticketsVinculados: number;
  quejas: { tickets: number; casos: number };
  devoluciones: { tickets: number; casos: number };
  gruposMultiticket: {
    numero: string;
    tipo: string;
    dominio: string | null;
    fechaApertura: string;
    tickets: string[];
    evidencia: EvidenciaCaso;
  }[];
  reconciliacion: { ticket: string; tipo: string; dominio: string | null; fecha: string; caso: string }[];
  ticketsSinCaso: number;
  duplicados: number;
}

const zendesk = new ZendeskClient();

/** Normaliza un dominio: protocolo, www, barras finales, rutas y mayúsculas. */
export function normalizarDominio(d: string | null | undefined): string | null {
  if (!d) return null;
  let v = String(d).trim().toLowerCase();
  v = v.replace(/^https?:\/\//i, "").replace(/^www\./, "");
  v = v.replace(/\/+$/, "").replace(/\/r$/, "");
  v = v.split("/")[0].trim();
  return v || null;
}

/** Normaliza un teléfono: solo dígitos; agrega código país 51 a líneas locales peruanas. */
export function normalizarTelefono(t: string | null | undefined): string | null {
  if (!t) return null;
  let v = String(t).replace(/\D/g, "");
  if (!v) return null;
  if (v.length === 9) v = "51" + v;
  return v;
}

/**
 * Identidad real de un cliente para un ticket histórico.
 * - Para CORREO: el campo `numero` contiene el email.
 * - Para WHATSAPP: el campo `numero` contiene el teléfono.
 * Se excluye el correo de sistema (catch-all) y las identidades vacías.
 */
export function identidadReal(fila: { numero?: string | null; contacto?: string | null }): string | null {
  const raw = (fila.numero ?? "").trim();
  if (raw) {
    if (raw.includes("@")) {
      const email = raw.toLowerCase();
      if (email !== CATCH_ALL_EMAIL) return `email:${email}`;
    } else {
      const tel = normalizarTelefono(raw);
      if (tel) return `tel:${tel}`;
    }
  }
  return null;
}

function relKey(id: string): string {
  return id;
}

/**
 * Obtiene las relaciones reales (follow_up) de los tickets desde Zendesk API.
 * Usa la tabla qd_relaciones_ticket como caché para ser idempotente y veloz.
 */
export async function obtenerRelacionesZendesk(tickets: string[]): Promise<Map<string, RelacionTicket>> {
  const map = new Map<string, RelacionTicket>();
  const faltantes: string[] = [];

  for (const id of tickets) {
    const rows = await prisma.$queryRaw<
      { ticket_id: string; ticket_padre_id: string | null; followup_ids: unknown; origen: string }[]
    >`
      SELECT ticket_id, ticket_padre_id, followup_ids, origen
      FROM qd_relaciones_ticket WHERE ticket_id = ${id}
    `;
    if (rows[0]) {
      const fup = Array.isArray(rows[0].followup_ids) ? (rows[0].followup_ids as string[]) : [];
      map.set(id, {
        padre: rows[0].ticket_padre_id,
        followups: fup,
        origen: rows[0].origen === "zendesk" ? "zendesk" : "no_disponible",
      });
    } else {
      faltantes.push(id);
    }
  }

  if (faltantes.length > 0) {
    const MIN_GAP = 2100; // respeta el rate limit de Zendesk (~1 req / 2s)
    for (const id of faltantes) {
      const numId = Number(id);
      if (isNaN(numId)) {
        map.set(id, { padre: null, followups: [], origen: "no_disponible" });
        continue;
      }
      const ticket = await zendesk.obtenerTicket(numId) as unknown as {
        via?: { source?: { rel?: string | null; from?: { ticket_id?: number | null } } };
        followup_ids?: number[];
      } | null;
      const rel: RelacionTicket = ticket
        ? {
            padre:
              ticket.via?.source?.rel === "follow_up" && ticket.via?.source?.from?.ticket_id != null
                ? String(ticket.via.source.from.ticket_id)
                : null,
            followups: (ticket.followup_ids ?? []).map(String),
            origen: "zendesk",
          }
        : { padre: null, followups: [], origen: "no_disponible" };
      map.set(id, rel);
      await prisma.$executeRaw`
        INSERT INTO qd_relaciones_ticket (ticket_id, ticket_padre_id, followup_ids, origen, fetched_at)
        VALUES (${id}, ${rel.padre}, CAST(${JSON.stringify(rel.followups)} AS jsonb), ${rel.origen}, now())
        ON CONFLICT (ticket_id) DO UPDATE SET
          ticket_padre_id = EXCLUDED.ticket_padre_id,
          followup_ids = EXCLUDED.followup_ids,
          origen = EXCLUDED.origen,
          fetched_at = now()
      `;
      await new Promise((r) => setTimeout(r, MIN_GAP));
    }
  }

  return map;
}

/**
 * Agrupa los tickets históricos en casos reales aplicando la regla de evidencia.
 */
export function agruparTicketsEnCasos(
  historial: QdHistorialRow[],
  relaciones: Map<string, RelacionTicket>,
): GrupoCaso[] {
  const tickets = historial.map((t) => ({ ...t, domNorm: normalizarDominio(t.dominio) }));

  const parent = tickets.map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const followUp: boolean[] = tickets.map(() => false);
  const idxByTicket = new Map<string, number>();
  tickets.forEach((t, i) => idxByTicket.set(relKey(t.ticketId), i));

  // 1) Aristas por follow_up directo (padre/hijo) entre tickets del conjunto.
  for (const t of tickets) {
    const rel = relaciones.get(t.ticketId);
    if (!rel) continue;
    const i = idxByTicket.get(relKey(t.ticketId))!;
    if (rel.padre) {
      const j = idxByTicket.get(relKey(rel.padre));
      if (j !== undefined && tickets[j].tipo === t.tipo) {
        union(i, j);
        followUp[i] = followUp[j] = true;
      }
    }
    for (const f of rel.followups) {
      const j = idxByTicket.get(relKey(f));
      if (j !== undefined && tickets[j].tipo === t.tipo) {
        union(i, j);
        followUp[i] = followUp[j] = true;
      }
    }
  }

  // 2) Tickets que comparten un MISMO ticket padre externo (mismo hilo original).
  const byPadreExterno = new Map<string, number[]>();
  for (const t of tickets) {
    const rel = relaciones.get(t.ticketId);
    if (rel?.padre && !idxByTicket.has(relKey(rel.padre))) {
      const arr = byPadreExterno.get(relKey(rel.padre)) ?? [];
      arr.push(idxByTicket.get(relKey(t.ticketId))!);
      byPadreExterno.set(relKey(rel.padre), arr);
    }
  }
  for (const arr of byPadreExterno.values()) {
    for (let k = 1; k < arr.length; k++) {
      if (tickets[arr[k]].tipo === tickets[arr[0]].tipo) {
        union(arr[0], arr[k]);
        for (const idx of arr) followUp[idx] = true;
      }
    }
  }

  // 3) Identidad real + dominio normalizado + tipo (NO agrupación ciega).
  const claveIdentidad = new Map<string, number[]>();
  tickets.forEach((t, i) => {
    const identidad = identidadReal(t);
    if (t.domNorm && identidad) {
      const key = `${t.domNorm}::${t.tipo}::${identidad}`;
      const arr = claveIdentidad.get(key) ?? [];
      arr.push(i);
      claveIdentidad.set(key, arr);
    }
  });
  for (const arr of claveIdentidad.values()) {
    for (let k = 1; k < arr.length; k++) union(arr[0], arr[k]);
  }

  // 4) Construir grupos.
  const grupos = new Map<number, QdHistorialRow[]>();
  tickets.forEach((t, i) => {
    const root = find(i);
    const arr = grupos.get(root) ?? [];
    arr.push(t);
    grupos.set(root, arr);
  });

  const resultado: GrupoCaso[] = [];
  for (const arr of grupos.values()) {
    const sorted = [...arr].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    const principal = sorted[0];
    const rel = relaciones.get(principal.ticketId);
    const evidencia: EvidenciaCaso = sorted.length > 1
      ? sorted.some((t) => followUp[idxByTicket.get(relKey(t.ticketId))!]) ? "follow_up" : "identidad_dominio"
      : "singleton";
    resultado.push({
      tipo: principal.tipo,
      tickets: sorted,
      principal,
      dominio: normalizarDominio(principal.dominio),
      ticketPadreId: rel?.padre ?? null,
      evidencia,
    });
  }

  return resultado.sort((a, b) => (a.principal.fecha < b.principal.fecha ? -1 : 1));
}

/**
 * Reconstruye los casos BACKFILL de Quejas y Devoluciones para el rango dado.
 * - Lee el histórico real de public.v_unificado_norm.
 * - Obtiene las relaciones follow_up reales desde Zendesk.
 * - Agrupa tickets en casos con la regla de evidencia.
 * - Elimina los casos BACKFILL previos y reconstruye (idempotente).
 * Conserva la fecha de apertura del caso (fecha del primer contacto).
 */
export async function reconstruirCasosBackfill(desde: string, hasta: string): Promise<ReconstruccionResultado> {
  const historial = await qdRepository.historial(desde, hasta);
  const ids = [...new Set(historial.map((h) => h.ticketId))];
  const relaciones = await obtenerRelacionesZendesk(ids);

  const grupos = agruparTicketsEnCasos(historial, relaciones);

  // Borrar casos BACKFILL previos (cascade elimina interacciones y auditoría).
  const borrados = await prisma.$executeRaw`DELETE FROM qd_casos WHERE origen = 'BACKFILL'`;

  let casosCreados = 0;
  let ticketsVinculados = 0;
  const reconciliacion: ReconstruccionResultado["reconciliacion"] = [];
  const gruposMultiticket: ReconstruccionResultado["gruposMultiticket"] = [];

  for (const g of grupos) {
    const tipo = g.principal.tipo;
    const numero = `${tipo === "devolucion" ? "DEV" : "QUE"}-${String(g.principal.ticketId).padStart(5, "0")}`;
    const fechaApertura = new Date(g.principal.fecha);

    const creado = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO qd_casos
        (id, tipo, numero, ticket_id, ticket_padre_id, dominio, pais, asesor, estado, resultado,
         observacion, origen, created_at, updated_at, caso_cerrado)
      VALUES
        (gen_random_uuid(), ${tipo}, ${numero}, ${g.principal.ticketId}, ${g.ticketPadreId},
         ${g.dominio ?? null}, ${g.principal.pais ?? null}, ${g.principal.asesor ?? null},
         'Pendiente de conciliación', NULL, ${g.principal.subcategoria ?? null}, 'BACKFILL',
         ${fechaApertura}, ${fechaApertura}, FALSE)
      RETURNING id
    `;
    const casoId = creado[0].id;
    casosCreados++;

    // Vincular TODOS los tickets (principal + relacionados) con canal y fecha.
    for (const t of g.tickets) {
      const tipoRel = t.ticketId === g.principal.ticketId ? "principal" : "relacionada";
      await prisma.$executeRaw`
        INSERT INTO qd_caso_interacciones (id, caso_id, ticket_id, tipo_relacion, created_by, canal, fecha)
        VALUES (gen_random_uuid(), ${casoId}, ${t.ticketId}, ${tipoRel}, ${t.asesor ?? null}, ${t.canal ?? null}, ${new Date(t.fecha)})
        ON CONFLICT (caso_id, ticket_id) DO NOTHING
      `;
      ticketsVinculados++;
    }

    await prisma.$executeRaw`
      INSERT INTO qd_auditoria (id, caso_id, usuario, accion, campo, valor_anterior, valor_nuevo)
      VALUES (gen_random_uuid(), ${casoId}, 'system', 'creacion_backfill', 'caso', NULL,
              ${`Caso ${numero} creado por carga retroactiva (${g.tickets.length} ticket(s), evidencia ${g.evidencia})`})
    `;

    for (const t of g.tickets) {
      reconciliacion.push({
        ticket: t.ticketId,
        tipo,
        dominio: t.dominio ?? null,
        fecha: new Date(t.fecha).toISOString().slice(0, 10),
        caso: numero,
      });
    }
    if (g.tickets.length > 1) {
      gruposMultiticket.push({
        numero,
        tipo,
        dominio: g.dominio,
        fechaApertura: fechaApertura.toISOString().slice(0, 10),
        tickets: g.tickets.map((t) => t.ticketId),
        evidencia: g.evidencia,
      });
    }
  }

  const quejasTickets = historial.filter((h) => h.tipo === "queja");
  const devoTickets = historial.filter((h) => h.tipo === "devolucion");
  const quejasCasos = grupos.filter((g) => g.principal.tipo === "queja").length;
  const devoCasos = grupos.filter((g) => g.principal.tipo === "devolucion").length;

  return {
    desde,
    hasta,
    ticketsHistoricos: historial.length,
    casosCreados,
    casosBorrados: borrados,
    ticketsVinculados,
    quejas: { tickets: quejasTickets.length, casos: quejasCasos },
    devoluciones: { tickets: devoTickets.length, casos: devoCasos },
    gruposMultiticket,
    reconciliacion,
    ticketsSinCaso: 0,
    duplicados: 0,
  };
}