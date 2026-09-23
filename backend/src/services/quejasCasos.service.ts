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
 * REGLA ABSOLUTA: NUNCA destruir datos operativos.
 * La reconstrucción es NO destructiva: preserva estado, resultado, montos,
 * observaciones y cualquier campo operativo de casos existentes.
 */
import { prisma } from "../repositories/prisma";
import { qdRepository, type QdHistorialRow } from "../repositories/quejasDevoluciones.repository";
import { ZendeskClient } from "../modules/zendesk/infrastructure/ZendeskClient";
import { normalizeDomain } from "../domain/contacto/normalizacion";

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

/**
 * Resultado de una ejecución de backfill (reconstrucción NO destructiva).
 */
export interface ReconstruccionResultado {
  desde: string;
  hasta: string;
  ticketsHistoricos: number;
  casosCreados: number;
  casosActualizados: number;
  casosPreservados: number;
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

/** Resultado de reconciliación por ticket individual. */
export interface ResultadoReconciliacionTicket {
  ticketId: string;
  tipo: "devolucion" | "queja";
  resultado: "CREADO" | "YA_EXISTE" | "SIN_DOMINIO" | "CATEGORIA_NO_HOMOLOGADA" | "ESTADO_NO_VALIDO" | "CANAL_NO_VALIDO" | "ERROR";
  casoId?: string;
  casoNumero?: string;
  dominio?: string | null;
  detalle?: string;
}

const zendesk = new ZendeskClient();

/**
 * Normaliza un dominio usando la función canónica y preserva el contract
 * de retorno `string | null` (GrupoCaso.dominio).
 * Elimina www. como comportamiento específico de este servicio.
 */
export function normalizarDominio(d: string | null | undefined): string | null {
  let v = normalizeDomain(d);
  v = v.replace(/^www\./, "");
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

/** Valida si un dominio es aceptable para crear un caso QyD. */
export function dominioValido(dominio: string | null | undefined): boolean {
  if (!dominio) return false;
  const d = dominio.trim().toLowerCase();
  if (!d) return false;
  if (d === "sin dominio" || d === "s/d" || d === "n/a" || d === "null") return false;
  return true;
}

/** Valida si un canal es aceptable (CORREO o CHAT). */
export function canalValido(canal: string | null | undefined): boolean {
  if (!canal) return false;
  const c = canal.trim().toLowerCase();
  return c === "correo" || c === "chat" || c === "email" || c === "whatsapp";
}

/** Valida si un estado de Zendesk es candidato a caso (closed o solved). */
export function estadoZendeskCandidato(estado: string | null | undefined): boolean {
  if (!estado) return false;
  const e = estado.trim().toLowerCase();
  return e === "closed" || e === "solved" || e === "cerrado" || e === "resuelto";
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
    const MIN_GAP = 2100;
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

  const claveIdentidad = new Map<string, number[]>();
  tickets.forEach((t, i) => {
    const id = identidadReal(t);
    if (t.domNorm && id) {
      const key = `${t.domNorm}::${t.tipo}::${id}`;
      const arr = claveIdentidad.get(key) ?? [];
      arr.push(i);
      claveIdentidad.set(key, arr);
    }
  });
  for (const arr of claveIdentidad.values()) {
    for (let k = 1; k < arr.length; k++) union(arr[0], arr[k]);
  }

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
 * Fila de caso BACKFILL existente (para preservación de datos operativos).
 */
interface CasoBackfillExistente {
  id: string;
  ticket_id: string;
  estado: string | null;
  resultado: string | null;
  monto_pagado: string | null;
  monto_devuelto: string | null;
  observacion: string | null;
  caso_cerrado: boolean;
  moneda: string;
  tipo_monto: string | null;
  porcentaje: string | null;
  clasificacion: string | null;
  producto: string | null;
  area: string | null;
  motivo: string | null;
  fecha_solicitud: string | null;
}

/**
 * Determina si un caso tiene datos operativos que deben preservarse.
 * Un caso tiene datos operativos si tiene estado distinto al default,
 * resultado, montos, u observaciones con contenido significativo.
 */
function tieneDatosOperativos(caso: CasoBackfillExistente): boolean {
  const DEFAULT_ESTADO = "Pendiente de conciliación";
  if (caso.estado && caso.estado !== DEFAULT_ESTADO) return true;
  if (caso.resultado) return true;
  if (caso.monto_pagado && Number(caso.monto_pagado) > 0) return true;
  if (caso.monto_devuelto && Number(caso.monto_devuelto) > 0) return true;
  if (caso.caso_cerrado) return true;
  if (caso.clasificacion) return true;
  if (caso.producto) return true;
  if (caso.area) return true;
  if (caso.motivo) return true;
  if (caso.fecha_solicitud) return true;
  return false;
}

/**
 * Reconstruye los casos BACKFILL de Quejas y Devoluciones para el rango dado.
 *
 * REGLA ABSOLUTA: NUNCA destruir datos operativos.
 *
 * Estrategia NO destructiva:
 *   1. Lee el histórico real de public.v_unificado_norm.
 *   2. Obtiene las relaciones follow_up reales desde Zendesk.
 *   3. Agrupa tickets en casos con la regla de evidencia.
 *   4. Para cada grupo:
 *      a. Si ya existe un caso BACKFILL para el ticket principal → UPDATE solo
 *         campos de origen, PRESERVAR campos operativos.
 *      b. Si no existe → INSERT nuevo caso.
 *      c. Si existe un caso MANUAL/CATEGORIZACION → NO tocar, marcar duplicado.
 *   5. NUNCA ejecuta DELETE sobre qd_casos.
 *
 * La función es idempotente: ejecutarla múltiples veces no destruye información.
 */
export async function reconstruirCasosBackfill(desde: string, hasta: string): Promise<ReconstruccionResultado> {
  const historial = await qdRepository.historial(desde, hasta);
  const ids = [...new Set(historial.map((h) => h.ticketId))];
  const relaciones = await obtenerRelacionesZendesk(ids);

  const grupos = agruparTicketsEnCasos(historial, relaciones);

  // Cargar casos BACKFILL existentes para preservar datos operativos.
  const backfillRows = await prisma.$queryRaw<CasoBackfillExistente[]>`
    SELECT id, ticket_id, estado, resultado, monto_pagado, monto_devuelto, observacion,
           caso_cerrado, moneda, tipo_monto, porcentaje, clasificacion, producto,
           area, motivo, fecha_solicitud
    FROM qd_casos
    WHERE origen = 'BACKFILL' AND eliminado = FALSE
  `;
  const backfillMap = new Map<string, CasoBackfillExistente>();
  for (const row of backfillRows) {
    backfillMap.set(String(row.ticket_id), row);
  }

  // Obtener ticket_ids que YA tienen caso (MANUAL/CATEGORIZACION) para no duplicar.
  const existentes = await prisma.$queryRaw<{ ticket_id: string }[]>`
    SELECT DISTINCT ticket_id FROM qd_casos
    WHERE eliminado = FALSE AND origen IN ('MANUAL', 'CATEGORIZACION')
  `;
  const ticketsManuales = new Set(existentes.map((e) => String(e.ticket_id)));

  let casosCreados = 0;
  let casosActualizados = 0;
  let casosPreservados = 0;
  let ticketsVinculados = 0;
  let duplicados = 0;
  const reconciliacion: ReconstruccionResultado["reconciliacion"] = [];
  const gruposMultiticket: ReconstruccionResultado["gruposMultiticket"] = [];

  for (const g of grupos) {
    const tipo = g.principal.tipo;
    const numero = `${tipo === "devolucion" ? "DEV" : "QUE"}-${String(g.principal.ticketId).padStart(5, "0")}`;
    const fechaApertura = new Date(g.principal.fecha);
    const ticketKey = String(g.principal.ticketId);

    // ── VALIDACIONES OBLIGATORIAS ANTES DE CREAR ──
    // 1. Canal debe ser CORREO o CHAT.
    if (!canalValido(g.principal.canal)) {
      duplicados++;
      continue;
    }
    // 2. Estado Zendesk debe ser closed o solved.
    if (!estadoZendeskCandidato(g.principal.estado)) {
      duplicados++;
      continue;
    }
    // 3. Dominio válido.
    if (!dominioValido(g.dominio)) {
      duplicados++;
      continue;
    }

    // CASO A: Ticket tiene caso MANUAL/CATEGORIZACION → NO tocar.
    if (ticketsManuales.has(ticketKey)) {
      duplicados++;
      continue;
    }

    const casoExistente = backfillMap.get(ticketKey);

    if (casoExistente) {
      // CASO B: Caso BACKFILL ya existe.
      if (tieneDatosOperativos(casoExistente)) {
        // B1: Tiene datos operativos → PRESERVAR completamente, no actualizar nada.
        casosPreservados++;
      } else {
        // B2: Sin datos operativos → actualizar solo campos de origen (dominio, pais, asesor).
        await prisma.$executeRaw`
          UPDATE qd_casos
          SET dominio = ${g.dominio ?? null},
              pais = ${g.principal.pais ?? null},
              asesor = ${g.principal.asesor ?? null},
              updated_at = now()
          WHERE id = ${casoExistente.id}
            AND estado = 'Pendiente de conciliación'
            AND resultado IS NULL
            AND (monto_pagado IS NULL OR monto_pagado = 0)
        `;
        casosActualizados++;
      }

      // Vincular tickets faltantes.
      for (const t of g.tickets) {
        const tipoRel = t.ticketId === g.principal.ticketId ? "principal" : "relacionada";
        await prisma.$executeRaw`
          INSERT INTO qd_caso_interacciones (id, caso_id, ticket_id, tipo_relacion, created_by, canal, fecha)
          VALUES (gen_random_uuid(), ${casoExistente.id}, ${t.ticketId}, ${tipoRel}, ${t.asesor ?? null}, ${t.canal ?? null}, ${new Date(t.fecha)})
          ON CONFLICT (caso_id, ticket_id) DO NOTHING
        `;
        ticketsVinculados++;
      }
    } else {
      // CASO C: Caso nuevo → INSERT.
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
    }

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
    casosActualizados,
    casosPreservados,
    ticketsVinculados,
    quejas: { tickets: quejasTickets.length, casos: quejasCasos },
    devoluciones: { tickets: devoTickets.length, casos: devoCasos },
    gruposMultiticket,
    reconciliacion,
    ticketsSinCaso: 0,
    duplicados,
  };
}

/**
 * Reconcilia tickets de v_unificado_norm con casos QyD existentes.
 * Detecta tickets válidos sin caso correspondiente y los crea.
 *
 * REGLA: NUNCA sobrescribir datos operativos de casos existentes.
 *
 * Flujo por ticket:
 *   1. Validar categoría (queja o devolución).
 *   2. Validar dominio (debe existir y ser válido).
 *   3. Verificar que no exista ya un caso para ticket_id + tipo.
 *   4. Si todo OK → crear caso.
 *
 * @param desde Fecha inicio (YYYY-MM-DD)
 * @param hasta Fecha fin (YYYY-MM-DD)
 * @returns Array de resultados por ticket.
 */
export async function reconciliarCasosQD(desde: string, hasta: string): Promise<ResultadoReconciliacionTicket[]> {
  const historial = await qdRepository.historial(desde, hasta);
  const resultados: ResultadoReconciliacionTicket[] = [];

  for (const h of historial) {
    const ticketId = h.ticketId;
    const tipo = h.tipo;

    // 1. Validar canal (debe ser CORREO o CHAT).
    if (!canalValido(h.canal)) {
      resultados.push({
        ticketId,
        tipo,
        resultado: "CANAL_NO_VALIDO",
        dominio: h.dominio ?? null,
        detalle: `Canal '${h.canal ?? "(vacío)"}' no es válido para crear caso QyD`,
      });
      continue;
    }

    // 2. Validar estado Zendesk (debe ser closed o solved).
    if (!estadoZendeskCandidato(h.estado)) {
      resultados.push({
        ticketId,
        tipo,
        resultado: "ESTADO_NO_VALIDO",
        dominio: h.dominio ?? null,
        detalle: `Estado '${h.estado ?? "(vacío)"}' no es candidato a caso QyD`,
      });
      continue;
    }

    // 3. Validar dominio.
    if (!dominioValido(h.dominio)) {
      resultados.push({
        ticketId,
        tipo,
        resultado: "SIN_DOMINIO",
        dominio: h.dominio ?? null,
        detalle: "Dominio ausente o no válido",
      });
      continue;
    }

    // 4. Verificar si ya existe caso (cualquier origen).
    const existente = await qdRepository.porTicket(ticketId, tipo);
    if (existente) {
      resultados.push({
        ticketId,
        tipo,
        resultado: "YA_EXISTE",
        casoId: existente.id,
        casoNumero: existente.numero,
        dominio: existente.dominio,
      });
      continue;
    }

    // 5. Crear caso.
    const dominio = normalizarDominio(h.dominio);
    try {
      const caso = await qdRepository.crear({
        tipo,
        ticketId,
        dominio,
        pais: h.pais ?? null,
        asesor: h.asesor ?? null,
        estado: "Pendiente de conciliación",
        observacion: h.subcategoria ?? null,
        origen: "BACKFILL",
      });

      await qdRepository.registrarAuditoria(
        caso.id, "system", "creacion_reconciliacion", "caso", null,
        `Caso ${caso.numero} creado por reconciliación automática (ticket #${ticketId})`,
      );

      resultados.push({
        ticketId,
        tipo,
        resultado: "CREADO",
        casoId: caso.id,
        casoNumero: caso.numero,
        dominio,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      resultados.push({
        ticketId,
        tipo,
        resultado: "ERROR",
        dominio,
        detalle: msg,
      });
    }
  }

  return resultados;
}
