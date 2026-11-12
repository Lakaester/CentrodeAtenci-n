import { prisma } from "./prisma";
import { genId } from "./facturacion.types";
import { normalizeDomain } from "../domain/contacto/normalizacion";
import {
  DOMINIO_SIN_DOMINIO,
  ESTADO_CERRADO,
  esDominioSinDominio,
} from "../domain/contacto/dominioQyd";
import { fechaLimaHoy } from "../utils/fechaQyd";

/** Ejecutor de SQL (cliente Prisma o cliente de transacción) para atomicidad. */
export type DbExecutor = Pick<typeof prisma, "$executeRaw" | "$queryRaw" | "$executeRawUnsafe" | "$queryRawUnsafe">;

export interface QdCasoRow {
  id: string;
  tipo: "devolucion" | "queja";
  numero: string;
  ticket_id: string | null;
  ticket_padre_id: string | null;
  dominio: string | null;
  pais: string | null;
  asesor: string | null;
  estado: string | null;
  resultado: string | null;
  moneda: string | null;             // PEN | USD
  monto_pagado: number | null;
  tipo_monto: string | null;
  area: string | null;
  motivo: string | null;
  porcentaje: number | null;
  monto_devuelto: number | null;
  clasificacion: string | null;
  producto: string | null;
  observacion: string | null;
  fecha_solicitud: string | null;     // YYYY-MM-DD o ISO exacto YYYY-MM-DDTHH:MM:SSZ
  origen: string | null;               // MANUAL | CATEGORIZACION | BACKFILL
  eliminado: boolean;
  eliminado_at: Date | null;
  eliminado_por: string | null;
  consolidado_en: string | null;       // caso principal si este caso fue consolidado
  caso_cerrado: boolean;
  cerrado_at: Date | null;
  cerrado_por: string | null;
  created_at: Date;
  updated_at: Date;
  total_interacciones?: number | null;
}

export interface QdInteraccionRow {
  id: string;
  caso_id: string;
  ticket_id: string;
  tipo_relacion: string;
  created_by: string | null;
  canal: string | null;
  fecha: Date | null;
  created_at: Date;
}

export interface QdAuditoriaRow {
  id: string;
  caso_id: string;
  usuario: string | null;
  accion: string;
  campo: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  created_at: Date;
}

export interface CrearCasoInput {
  tipo: "devolucion" | "queja";
  ticketId?: string | null;
  ticketPadreId?: string | null;
  dominio?: string | null;
  pais?: string | null;
  asesor?: string | null;
  estado?: string | null;
  resultado?: string | null;
  moneda?: string | null;          // PEN | USD
  montoPagado?: number | null;
  tipoMonto?: string | null;
  area?: string | null;
  motivo?: string | null;
  porcentaje?: number | null;
  montoDevuelto?: number | null;
  clasificacion?: string | null;
  producto?: string | null;
  observacion?: string | null;
  /** YYYY-MM-DD o ISO exacto YYYY-MM-DDTHH:MM:SSZ. */
  fechaSolicitud?: string | null;
  origen?: string | null;    // MANUAL | CATEGORIZACION | BACKFILL
  /** true solo para expedientes SIN DOMINIO que deben quedar CERRADOS. */
  casoCerrado?: boolean;
  cerradoPor?: string | null;
}

/**
 * Fila histórica de Quejas/Devoluciones leída de public.v_unificado_norm.
 * Es la fuente real de la carga retroactiva (backfill): NUNCA datos ficticios.
 */
export interface QdHistorialRow {
  fecha: Date;
  ticketId: string;
  contacto: string | null;
  numero: string | null;
  telefono: string | null;
  canal: string | null;
  subcanal: string | null;
  dominio: string | null;
  pais: string | null;
  asesor: string | null;
  categoria: string | null;
  subcategoria: string | null;
  tipo: "queja" | "devolucion";   // clasificación oficial derivada de la subcategoría
  estado: string | null;           // estado Zendesk (closed, solved, etc.)
}

/** Resultado de una ejecución de backfill (reconstrucción por evidencia). */

/**
 * Normaliza el dominio para persistencia, preservando el valor explícito
 * `SIN DOMINIO` (no debe convertirse a minúsculas ni a null).
 */
function dominioPersistible(d: string | null | undefined): string | null {
  if (d == null || String(d).trim() === "") return null;
  if (esDominioSinDominio(d)) return DOMINIO_SIN_DOMINIO;
  return normalizeDomain(d) || null;
}

export const qdRepository = {
  async listar(tipo: string, limite = 200): Promise<QdCasoRow[]> {
    return prisma.$queryRaw<QdCasoRow[]>`
      SELECT c.*, COUNT(i.id)::int AS total_interacciones
      FROM qd_casos c
      LEFT JOIN qd_caso_interacciones i ON i.caso_id = c.id
      WHERE c.tipo = ${tipo} AND c.eliminado = FALSE AND c.consolidado_en IS NULL
      GROUP BY c.id
      ORDER BY COALESCE(c.fecha_solicitud::date, c.created_at::date) DESC, c.created_at DESC
      LIMIT ${limite}
    `;
  },

  /**
   * Lista casos aplicando los mismos filtros que la bandeja del módulo.
   * Cada caso es UNA fila (un caso = un registro, sin multiplicar por interacciones).
   */
  async listarConFiltros(f: {
    tipo?: string;            // 'devolucion' | 'queja' | 'todas'
    desde?: string;           // YYYY-MM-DD
    hasta?: string;           // YYYY-MM-DD
    pais?: string;
    estado?: string;
    resultado?: string;
    asesor?: string;
    area?: string;
    producto?: string;
    tipoQueja?: string;
  }): Promise<QdCasoRow[]> {
    const conds: string[] = [];
    const vals: unknown[] = [];
    if (f.tipo && f.tipo !== "todas") { conds.push(`tipo = $${vals.length + 1}`); vals.push(f.tipo); }
    // La columna Fecha del módulo es fecha_solicitud (origen del ticket). Si un
    // registro histórico no la tiene, se usa la fecha de incorporación solo
    // para poder filtrar; el dato se repara desde Zendesk por separado.
    const fechaEfectiva = `COALESCE(c.fecha_solicitud, to_char(c.created_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD'))`;
    if (f.desde) { conds.push(`${fechaEfectiva} >= $${vals.length + 1}`); vals.push(f.desde); }
    if (f.hasta) { conds.push(`${fechaEfectiva} <= $${vals.length + 1}`); vals.push(f.hasta); }
    if (f.pais) { conds.push(`pais = $${vals.length + 1}`); vals.push(f.pais); }
    if (f.estado) { conds.push(`estado = $${vals.length + 1}`); vals.push(f.estado); }
    if (f.resultado) { conds.push(`resultado = $${vals.length + 1}`); vals.push(f.resultado); }
    if (f.asesor) { conds.push(`asesor = $${vals.length + 1}`); vals.push(f.asesor); }
    if (f.area) { conds.push(`area = $${vals.length + 1}`); vals.push(f.area); }
    if (f.producto) { conds.push(`producto = $${vals.length + 1}`); vals.push(f.producto); }
    if (f.tipoQueja) { conds.push(`clasificacion = $${vals.length + 1}`); vals.push(f.tipoQueja); }
    conds.push(`c.eliminado = FALSE`);
    conds.push(`c.consolidado_en IS NULL`);
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    return prisma.$queryRawUnsafe<QdCasoRow[]>(
      `SELECT c.*, COUNT(i.id)::int AS total_interacciones
       FROM qd_casos c
       LEFT JOIN qd_caso_interacciones i ON i.caso_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY COALESCE(c.fecha_solicitud::date, c.created_at::date) DESC, c.created_at DESC`,
      ...vals,
    );
  },

  /** Registra una exportación en la auditoría de exportaciones. */
  async registrarExportacion(datos: { usuario: string | null; tipo: string; filtros: Record<string, unknown>; registros: number }): Promise<void> {
    const id = genId();
    await prisma.$executeRaw`
      INSERT INTO qd_exportaciones (id, usuario, tipo, filtros, registros)
      VALUES (${id}, ${datos.usuario ?? null}, ${datos.tipo}, CAST(${JSON.stringify(datos.filtros)} AS jsonb), ${datos.registros})
    `;
  },

  async porId(id: string): Promise<QdCasoRow | null> {
    const rows = await prisma.$queryRaw<QdCasoRow[]>`SELECT * FROM qd_casos WHERE id = ${id} AND eliminado = FALSE LIMIT 1`;
    return rows[0] ?? null;
  },

  async porTicket(ticketId: string, tipo: string, executor: DbExecutor = prisma): Promise<QdCasoRow | null> {
    const rows = await executor.$queryRaw<QdCasoRow[]>`SELECT * FROM qd_casos WHERE ticket_id = ${ticketId} AND tipo = ${tipo} AND eliminado = FALSE LIMIT 1`;
    return rows[0] ?? null;
  },

  /**
   * Busca un caso por su ticket padre (origen del hilo follow_up).
   * Ejemplo: ticket #33085 (follow_up de #32913) → devuelve el caso de #32913.
   */
  async porTicketPadre(ticketPadreId: string, tipo: string): Promise<QdCasoRow | null> {
    const rows = await prisma.$queryRaw<QdCasoRow[]>`SELECT * FROM qd_casos WHERE ticket_id = ${ticketPadreId} AND tipo = ${tipo} AND eliminado = FALSE LIMIT 1`;
    return rows[0] ?? null;
  },

  /**
   * Busca un caso por cualquier ticket que lo referencie:
   * ticket principal (qd_casos.ticket_id), ticket padre (ticket_padre_id),
   * o interacción relacionada (qd_caso_interacciones).
   */
  async porTicketGeneral(ticketId: string, tipo: string, executor: DbExecutor = prisma): Promise<QdCasoRow | null> {
    const rows = await executor.$queryRaw<QdCasoRow[]>`
      SELECT c.* FROM qd_casos c
      WHERE c.tipo = ${tipo} AND c.eliminado = FALSE
        AND (c.ticket_id = ${ticketId}
             OR c.ticket_padre_id = ${ticketId}
             OR EXISTS (SELECT 1 FROM qd_caso_interacciones i WHERE i.caso_id = c.id AND i.ticket_id = ${ticketId}))
      ORDER BY
        CASE
          WHEN c.ticket_id = ${ticketId} THEN 0
          WHEN c.ticket_padre_id = ${ticketId} THEN 1
          ELSE 2
        END,
        c.created_at ASC,
        c.id ASC
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Lee la relación verificada cacheada de un ticket. Solo lectura: el
   * dry-run no debe escribir ni refrescar qd_relaciones_ticket.
   */
  async relacionCache(ticketId: string): Promise<{
    ticket_padre_id: string | null;
    followup_ids: string[];
    origen: string;
    fetched_at: Date;
  } | null> {
    const rows = await prisma.$queryRaw<{
      ticket_padre_id: string | null;
      followup_ids: unknown;
      origen: string;
      fetched_at: Date;
    }[]>`
      SELECT ticket_padre_id, followup_ids, origen, fetched_at
      FROM qd_relaciones_ticket
      WHERE ticket_id = ${ticketId}
      LIMIT 1
    `;
    const r = rows[0];
    if (!r) return null;
    return {
      ticket_padre_id: r.ticket_padre_id,
      followup_ids: Array.isArray(r.followup_ids) ? r.followup_ids.map(String) : [],
      origen: r.origen,
      fetched_at: r.fetched_at,
    };
  },

  /** Interacciones relacionadas de un caso (sin el ticket principal). */
  async interacciones(casoId: string): Promise<QdInteraccionRow[]> {
    return prisma.$queryRaw<QdInteraccionRow[]>`
      SELECT * FROM qd_caso_interacciones WHERE caso_id = ${casoId} ORDER BY fecha ASC NULLS LAST, created_at ASC
    `;
  },

  /** Asocia un ticket a un caso como interacción relacionada. Idempotente por (caso_id, ticket_id). */
  async asociarInteraccion(casoId: string, ticketId: string, usuario: string | null, tipoRelacion = "relacionada", canal: string | null = null, fecha: Date | null = null, executor: DbExecutor = prisma): Promise<QdInteraccionRow | null> {
    const id = genId();
    const rows = await executor.$queryRaw<QdInteraccionRow[]>`
      INSERT INTO qd_caso_interacciones (id, caso_id, ticket_id, tipo_relacion, created_by, canal, fecha)
      VALUES (${id}, ${casoId}, ${ticketId}, ${tipoRelacion}, ${usuario ?? null}, ${canal ?? null}, ${fecha ?? null})
      ON CONFLICT (caso_id, ticket_id) DO NOTHING
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /**
   * Asigna (o actualiza) el dominio de un caso manualmente. Auditable.
   * Asignar dominio NO fusiona casos automáticamente.
   */
  async asignarDominio(casoId: string, dominio: string | null, usuario: string | null, executor: DbExecutor = prisma): Promise<QdCasoRow | null> {
    const d = dominioPersistible(dominio);
    const rows = await executor.$queryRaw<QdCasoRow[]>`
      UPDATE qd_casos SET dominio = ${d}, updated_at = now()
      WHERE id = ${casoId}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /** Cierra un caso manualmente. CAS: solo si NO está cerrado ni consolidado. */
  async cerrarCaso(casoId: string, usuario: string | null, executor: DbExecutor = prisma): Promise<QdCasoRow | null> {
    const rows = await executor.$queryRaw<QdCasoRow[]>`
      UPDATE qd_casos SET caso_cerrado = TRUE, cerrado_at = now(), cerrado_por = ${usuario ?? null}, updated_at = now()
      WHERE id = ${casoId} AND caso_cerrado = FALSE AND consolidado_en IS NULL
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /**
   * Reabre un caso cerrado. CAS: solo si está cerrado.
   */
  async reabrirCaso(casoId: string, usuario: string | null, executor: DbExecutor = prisma): Promise<QdCasoRow | null> {
    const rows = await executor.$queryRaw<QdCasoRow[]>`
      UPDATE qd_casos
      SET caso_cerrado = FALSE, cerrado_at = NULL, cerrado_por = NULL, updated_at = now()
      WHERE id = ${casoId} AND caso_cerrado = TRUE
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /**
   * CONSOLIDA varios casos secundarios en un caso principal.
   *
   * - Bloquea todos los casos con `FOR UPDATE` para que la operación sea atómica
   *   frente a consolidaciones concurrentes.
   * - No modifica el estado del principal ni de los secundarios.
   * - Incorpora al principal:
   *     a) el ticket principal de cada secundario;
   *     b) el `ticket_padre_id` de cada secundario, si existe;
   *     c) todas las interacciones ya vinculadas a los secundarios.
   *   Todo con `ON CONFLICT (caso_id, ticket_id) DO NOTHING`, por lo que los
   *   tickets repetidos no generan duplicados.
   * - Marca los secundarios con `consolidado_en = principalId`.
   * - Devuelve cuántos secundarios quedaron consolidados; si no fueron todos,
   *   el llamador debe lanzar error para que la transacción haga rollback.
   */
  async consolidarCasos(principalId: string, idsSecundarios: string[], usuario: string | null, executor: DbExecutor = prisma): Promise<number> {
    const secs = [...new Set(idsSecundarios.filter((id) => id !== principalId))];
    if (secs.length === 0) return 0;
    const todos = [principalId, ...secs];

    const bloqueados = await executor.$queryRaw<QdCasoRow[]>`
      SELECT * FROM qd_casos
      WHERE id = ANY(${todos}::text[])
        AND eliminado = FALSE
      FOR UPDATE
    `;
    if (bloqueados.length !== todos.length) return 0;

    const principal = bloqueados.find((c) => c.id === principalId);
    if (!principal || principal.consolidado_en) return 0;
    const secundarios = bloqueados.filter((c) => c.id !== principalId);
    if (secundarios.some((c) => c.consolidado_en)) return 0;
    if (secundarios.some((c) => c.tipo !== principal.tipo)) return 0;

    // 1) Tickets de los secundarios + interacciones existentes.
    //    Se excluye el ticket que ya es principal del caso destino.
    await executor.$executeRaw`
      INSERT INTO qd_caso_interacciones (id, caso_id, ticket_id, tipo_relacion, created_by, canal, fecha)
      SELECT gen_random_uuid(), ${principalId}, t.ticket_id, 'relacionada',
             t.created_by, t.canal, t.fecha
      FROM (
        SELECT c.ticket_id AS ticket_id,
               COALESCE(c.asesor, ${usuario ?? null}) AS created_by,
               NULL::text AS canal,
               CASE
                 WHEN NULLIF(btrim(c.fecha_solicitud), '') IS NOT NULL
                   THEN c.fecha_solicitud::timestamptz
                 ELSE NULL::timestamptz
               END AS fecha
        FROM qd_casos c
        JOIN qd_casos p ON p.id = ${principalId}
        WHERE c.id = ANY(${secs}::text[])
          AND c.ticket_id IS NOT NULL
          AND c.ticket_id IS DISTINCT FROM p.ticket_id
        UNION ALL
        SELECT c.ticket_padre_id,
               COALESCE(c.asesor, ${usuario ?? null}),
               NULL::text,
               NULL::timestamptz
        FROM qd_casos c
        JOIN qd_casos p ON p.id = ${principalId}
        WHERE c.id = ANY(${secs}::text[])
          AND c.ticket_padre_id IS NOT NULL
          AND c.ticket_padre_id IS DISTINCT FROM p.ticket_id
        UNION ALL
        SELECT i.ticket_id, i.created_by, i.canal, i.fecha
        FROM qd_caso_interacciones i
        WHERE i.caso_id = ANY(${secs}::text[])
      ) t
      WHERE t.ticket_id IS NOT NULL
      ON CONFLICT (caso_id, ticket_id) DO NOTHING
    `;

    // 2) Marcar secundarios como consolidados. Sin tocar estado ni fecha.
    const res = await executor.$executeRaw`
      UPDATE qd_casos
      SET consolidado_en = ${principalId}, updated_at = now()
      WHERE id = ANY(${secs}::text[])
        AND id <> ${principalId}
        AND consolidado_en IS NULL
    `;
    return Number(res ?? 0);
  },

  async crear(input: CrearCasoInput, executor: DbExecutor = prisma): Promise<QdCasoRow> {
    const id = genId();
    const numero = `${input.tipo === "devolucion" ? "DEV" : "QUE"}-${String(Date.now()).slice(-5)}`;
    const d = dominioPersistible(input.dominio);
    // Ningún expediente nuevo puede quedar sin fecha de solicitud. La fecha
    // histórica del ticket se pasa explícitamente; si el llamador no la tiene,
    // se usa la fecha de incorporación en Lima (nunca NULL).
    const fechaSolicitud = input.fechaSolicitud ?? fechaLimaHoy();
    const casoCerrado = input.casoCerrado === true;
    const cerradoAt = casoCerrado ? new Date() : null;
    const cerradoPor = casoCerrado ? input.cerradoPor ?? null : null;
    const rows = await executor.$queryRaw<QdCasoRow[]>`
      INSERT INTO qd_casos
        (id, tipo, numero, ticket_id, ticket_padre_id, dominio, pais, asesor, estado, resultado,
         moneda, monto_pagado, tipo_monto, area, motivo, porcentaje, monto_devuelto, clasificacion, producto, observacion, fecha_solicitud, origen,
         caso_cerrado, cerrado_at, cerrado_por)
      VALUES
        (${id}, ${input.tipo}, ${numero}, ${input.ticketId ?? null}, ${input.ticketPadreId ?? null}, ${d}, ${input.pais ?? null},
         ${input.asesor ?? null}, ${input.estado ?? null}, ${input.resultado ?? null},
         ${input.moneda ?? "PEN"}, ${input.montoPagado ?? null}, ${input.tipoMonto ?? null}, ${input.area ?? null}, ${input.motivo ?? null},
         ${input.porcentaje ?? null}, ${input.montoDevuelto ?? null}, ${input.clasificacion ?? null}, ${input.producto ?? null},
         ${input.observacion ?? null}, ${fechaSolicitud}, ${input.origen ?? "MANUAL"},
         ${casoCerrado}, ${cerradoAt}, ${cerradoPor})
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Carga retroactiva (BACKFILL): lee el histórico real de Q/D de
   * public.v_unificado_norm en el rango [desde, hasta] (YYYY-MM-DD).
   * Clasifica cada fila con la lógica oficial (subcategoría normalizada).
   */
  async historial(desde: string, hasta: string): Promise<QdHistorialRow[]> {
    return prisma.$queryRaw<QdHistorialRow[]>`
      SELECT
        fecha AS fecha,
        ticket_id::text AS "ticketId",
        NULLIF(TRIM(contacto), '') AS contacto,
        NULLIF(TRIM(numero), '') AS numero,
        NULLIF(TRIM(telefono), '') AS telefono,
        NULLIF(TRIM(canal), '') AS canal,
        NULLIF(TRIM(subcanal), '') AS subcanal,
        NULLIF(TRIM(dominio), '') AS dominio,
        NULLIF(TRIM(pais), '') AS pais,
        NULLIF(TRIM(asesor), '') AS asesor,
        NULLIF(TRIM(categoria), '') AS categoria,
        NULLIF(TRIM(subcategoria), '') AS subcategoria,
        NULLIF(TRIM(estado), '') AS estado,
        CASE WHEN cope_scat_normalizada(subcategoria) = 'solicitud de devolucion' THEN 'devolucion'
             ELSE 'queja' END AS tipo
      FROM public.v_unificado_norm
      WHERE fecha::date >= ${desde}::date
        AND fecha::date <= ${hasta}::date
        AND cope_scat_normalizada(subcategoria) IN ('queja', 'solicitud de devolucion', 'reclamo', 'queja y devolucion', 'queja y devoluciones')
      ORDER BY fecha ASC, ticket_id ASC
    `;
  },

  /** Eliminación lógica: marca el caso como eliminado pero conserva el registro.
    * Las interacciones relacionadas no se tocan (trazabilidad).
    */
  async eliminarLogico(id: string, usuario: string | null, executor: DbExecutor = prisma): Promise<QdCasoRow | null> {
    const rows = await executor.$queryRaw<QdCasoRow[]>`
      UPDATE qd_casos
      SET eliminado = TRUE, eliminado_at = now(), eliminado_por = ${usuario ?? null}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  async actualizar(id: string, patch: Partial<Omit<CrearCasoInput, "tipo" | "ticketId">> & { ticketId?: string | null }, executor: DbExecutor = prisma): Promise<QdCasoRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    const map: Record<string, unknown> = {
      ticket_id: patch.ticketId,
      dominio: patch.dominio != null ? dominioPersistible(patch.dominio) : patch.dominio,
      pais: patch.pais,
      asesor: patch.asesor,
      estado: patch.estado,
      resultado: patch.resultado,
      moneda: patch.moneda,
      monto_pagado: patch.montoPagado,
      tipo_monto: patch.tipoMonto,
      area: patch.area,
      motivo: patch.motivo,
      porcentaje: patch.porcentaje,
      monto_devuelto: patch.montoDevuelto,
      clasificacion: patch.clasificacion,
      producto: patch.producto,
      observacion: patch.observacion,
      fecha_solicitud: patch.fechaSolicitud,
    };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { sets.push(`${col} = $${values.length + 1}`); values.push(val); }
    }
    if (sets.length === 0) return this.porId(id);
    sets.push("updated_at = now()");
    values.push(id);
    const rows = await executor.$queryRawUnsafe<QdCasoRow[]>(
      `UPDATE qd_casos SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      ...values,
    );
    return rows[0] ?? null;
  },

  async auditoria(casoId: string): Promise<QdAuditoriaRow[]> {
    return prisma.$queryRaw<QdAuditoriaRow[]>`SELECT * FROM qd_auditoria WHERE caso_id = ${casoId} ORDER BY created_at ASC`;
  },

  /** Casos activos sin fecha_solicitud: candidatos a reparación desde Zendesk. */
  async casosSinFecha(limite = 500): Promise<{ id: string; ticket_id: string | null; created_at: Date }[]> {
    return prisma.$queryRaw<{ id: string; ticket_id: string | null; created_at: Date }[]>`
      SELECT id, ticket_id, created_at FROM qd_casos
      WHERE fecha_solicitud IS NULL AND eliminado = FALSE
      ORDER BY created_at ASC
      LIMIT ${limite}
    `;
  },

  /** Repara la fecha de origen solo si sigue vacía (idempotente). */
  async actualizarFechaSolicitud(
    casoId: string,
    fecha: string,
    executor: DbExecutor = prisma,
  ): Promise<QdCasoRow | null> {
    const rows = await executor.$queryRaw<QdCasoRow[]>`
      UPDATE qd_casos SET fecha_solicitud = ${fecha}, updated_at = now()
      WHERE id = ${casoId} AND fecha_solicitud IS NULL
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /**
   * Regulariza un expediente existente sin dominio utilizable:
   * - persiste `SIN DOMINIO`;
   * - lo deja cerrado (si ya estaba cerrado, conserva su estado operativo).
   *
   * No toca montos, resultado, observaciones ni otros datos operativos.
   */
  async regularizarSinDominio(
    casoId: string,
    usuario: string | null,
    executor: DbExecutor = prisma,
  ): Promise<QdCasoRow | null> {
    const rows = await executor.$queryRaw<QdCasoRow[]>`
      UPDATE qd_casos
      SET dominio = ${DOMINIO_SIN_DOMINIO},
          estado = CASE
            WHEN caso_cerrado = TRUE AND NULLIF(TRIM(estado), '') IS NOT NULL THEN estado
            ELSE ${ESTADO_CERRADO}
          END,
          caso_cerrado = TRUE,
          cerrado_at = COALESCE(cerrado_at, now()),
          cerrado_por = COALESCE(cerrado_por, ${usuario ?? null}),
          updated_at = now()
      WHERE id = ${casoId}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /** Registra una incidencia de datos (por ejemplo, fecha no verificable). */
  async registrarIncidenciaDato(datos: {
    casoId: string;
    ticketId?: string | null;
    tipo: string;
    detalle: string;
  }): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO qd_incidencias_datos (id, caso_id, ticket_id, tipo, detalle)
      VALUES (${genId()}, ${datos.casoId}, ${datos.ticketId ?? null}, ${datos.tipo}, ${datos.detalle})
      ON CONFLICT (caso_id, tipo) DO NOTHING
      RETURNING id
    `;
    return rows.length > 0;
  },

  async listarIncidencias(limite = 200): Promise<{
    id: string; caso_id: string | null; ticket_id: string | null;
    tipo: string; detalle: string; created_at: Date;
  }[]> {
    return prisma.$queryRaw`
      SELECT id, caso_id, ticket_id, tipo, detalle, created_at
      FROM qd_incidencias_datos
      ORDER BY created_at DESC
      LIMIT ${limite}
    `;
  },

  async registrarAuditoria(casoId: string, usuario: string | null, accion: string, campo: string | null, anterior: string | null, nuevo: string | null, executor: DbExecutor = prisma): Promise<void> {
    const id = genId();
    await executor.$executeRaw`
      INSERT INTO qd_auditoria (id, caso_id, usuario, accion, campo, valor_anterior, valor_nuevo)
      VALUES (${id}, ${casoId}, ${usuario ?? null}, ${accion}, ${campo ?? null}, ${anterior ?? null}, ${nuevo ?? null})
    `;
  },

  // ── Catálogos configurables ──
  async listarCatalogo(tabla: string): Promise<{ id: string; nombre: string; activo: boolean; orden: number }[]> {
    return prisma.$queryRawUnsafe<{ id: string; nombre: string; activo: boolean; orden: number }[]>(
      `SELECT id, nombre, activo, orden FROM ${tabla} ORDER BY orden ASC, nombre ASC`,
    );
  },

  /**
   * Dominios crudos (sin normalizar) presentes en la fuente histórica
   * (v_unificado_norm) y en los casos existentes (qd_casos.dominio).
   * La normalización y deduplicación se realiza en la capa de servicio.
   */
  async listarDominiosRaw(): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ d: string | null }[]>`
      SELECT DISTINCT NULLIF(TRIM(dominio), '') AS d FROM v_unificado_norm WHERE NULLIF(TRIM(dominio), '') IS NOT NULL
      UNION
      SELECT DISTINCT NULLIF(TRIM(dominio), '') AS d FROM qd_casos WHERE NULLIF(TRIM(dominio), '') IS NOT NULL
    `;
    return rows.map((r) => r.d).filter((x): x is string => !!x);
  },

  async crearCatalogo(tabla: string, nombre: string): Promise<{ id: string; nombre: string }> {
    const id = genId();
    const max = await prisma.$queryRawUnsafe<{ m: number | null }[]>(`SELECT MAX(orden) AS m FROM ${tabla}`);
    const orden = (max[0]?.m ?? 0) + 10;
    await prisma.$queryRawUnsafe(`INSERT INTO ${tabla} (id, nombre, orden) VALUES ($1, $2, $3)`, id, nombre, orden);
    return { id, nombre };
  },

  async actualizarCatalogo(tabla: string, id: string, patch: { nombre?: string; activo?: boolean; orden?: number }): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (patch.nombre !== undefined) { sets.push("nombre = $" + (values.length + 1)); values.push(patch.nombre); }
    if (patch.activo !== undefined) { sets.push("activo = $" + (values.length + 1)); values.push(patch.activo); }
    if (patch.orden !== undefined) { sets.push("orden = $" + (values.length + 1)); values.push(patch.orden); }
    if (sets.length === 0) return;
    sets.push("updated_at = now()");
    values.push(id);
    await prisma.$queryRawUnsafe(`UPDATE ${tabla} SET ${sets.join(", ")} WHERE id = $${values.length}`, ...values);
  },
};
