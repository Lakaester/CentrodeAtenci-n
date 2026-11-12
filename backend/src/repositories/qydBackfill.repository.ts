import { prisma } from "./prisma";
import { genId } from "./facturacion.types";

export type BackfillEstado = "EN_PROGRESO" | "COMPLETADO" | "FALLIDO" | "DETENIDO";

export interface BackfillRunRow {
  id: string;
  desde: string;
  hasta: string;
  estado: BackfillEstado;
  dry_run: boolean;
  cursor_ventana: string | null;
  cursor_pagina: number | null;
  iniciado_por: string | null;
  iniciado_at: Date;
  actualizado_at: Date;
  finalizado_at: Date | null;
  error_detalle: string | null;
}

export interface BackfillCheckpointRow {
  id: string;
  run_id: string;
  ventana_desde: string;
  ventana_hasta_exclusiva: string;
  pagina: number;
  estado: "EN_PROGRESO" | "COMPLETADO" | "FALLIDO";
  ultimo_ticket_id: string | null;
  procesados: number;
  error_detalle: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BackfillItemRow {
  id: string;
  run_id: string;
  ticket_id: string;
  ticket_created_at: Date | null;
  categoria_raw: string | null;
  subcategoria_raw: string | null;
  tipo: string | null;
  estado: string;
  motivo: string | null;
  caso_id: string | null;
  numero: string | null;
  fecha_solicitud: string | null;
  created_at: Date;
}

const RUN_COLUMNS = `
  id, desde::text AS desde, hasta::text AS hasta, estado, dry_run,
  cursor_ventana::text AS cursor_ventana, cursor_pagina,
  iniciado_por, iniciado_at, actualizado_at, finalizado_at, error_detalle
`;

export const qydBackfillRepository = {
  async crearRun(datos: {
    desde: string;
    hasta: string;
    dryRun: boolean;
    usuario: string | null;
  }): Promise<BackfillRunRow> {
    const id = genId();
    const rows = await prisma.$queryRawUnsafe<BackfillRunRow[]>(
      `INSERT INTO qd_backfill_zendesk_runs (id, desde, hasta, dry_run, iniciado_por)
       VALUES ($1, $2::date, $3::date, $4, $5)
       RETURNING ${RUN_COLUMNS}`,
      id, datos.desde, datos.hasta, datos.dryRun, datos.usuario,
    );
    return rows[0];
  },

  async obtenerRun(id: string): Promise<BackfillRunRow | null> {
    const rows = await prisma.$queryRawUnsafe<BackfillRunRow[]>(
      `SELECT ${RUN_COLUMNS} FROM qd_backfill_zendesk_runs WHERE id = $1`,
      id,
    );
    return rows[0] ?? null;
  },

  async runActivo(): Promise<BackfillRunRow | null> {
    const rows = await prisma.$queryRawUnsafe<BackfillRunRow[]>(
      `SELECT ${RUN_COLUMNS} FROM qd_backfill_zendesk_runs
       WHERE estado = 'EN_PROGRESO' ORDER BY iniciado_at DESC LIMIT 1`,
    );
    return rows[0] ?? null;
  },

  async actualizarRun(id: string, patch: {
    estado?: BackfillEstado;
    cursorVentana?: string | null;
    cursorPagina?: number | null;
    errorDetalle?: string | null;
    finalizado?: boolean;
  }): Promise<void> {
    const sets: string[] = ["actualizado_at = now()"];
    const vals: unknown[] = [];
    if (patch.estado !== undefined) { sets.push(`estado = $${vals.length + 1}`); vals.push(patch.estado); }
    if (patch.cursorVentana !== undefined) { sets.push(`cursor_ventana = $${vals.length + 1}::date`); vals.push(patch.cursorVentana); }
    if (patch.cursorPagina !== undefined) { sets.push(`cursor_pagina = $${vals.length + 1}`); vals.push(patch.cursorPagina); }
    if (patch.errorDetalle !== undefined) { sets.push(`error_detalle = $${vals.length + 1}`); vals.push(patch.errorDetalle); }
    if (patch.finalizado) sets.push("finalizado_at = now()");
    vals.push(id);
    await prisma.$executeRawUnsafe(
      `UPDATE qd_backfill_zendesk_runs SET ${sets.join(", ")} WHERE id = $${vals.length}`,
      ...vals,
    );
  },

  async asegurarCheckpoint(datos: {
    runId: string;
    ventanaDesde: string;
    ventanaHastaExclusiva: string;
    pagina: number;
  }): Promise<BackfillCheckpointRow> {
    const id = genId();
    const rows = await prisma.$queryRawUnsafe<BackfillCheckpointRow[]>(
      `INSERT INTO qd_backfill_zendesk_checkpoints
         (id, run_id, ventana_desde, ventana_hasta_exclusiva, pagina)
       VALUES ($1, $2, $3::date, $4::date, $5)
       ON CONFLICT (run_id, ventana_desde, ventana_hasta_exclusiva, pagina)
       DO UPDATE SET updated_at = now()
       RETURNING id, run_id, ventana_desde::text AS ventana_desde,
                 ventana_hasta_exclusiva::text AS ventana_hasta_exclusiva,
                 pagina, estado, ultimo_ticket_id, procesados, error_detalle,
                 created_at, updated_at`,
      id, datos.runId, datos.ventanaDesde, datos.ventanaHastaExclusiva, datos.pagina,
    );
    return rows[0];
  },

  async marcarCheckpoint(id: string, datos: {
    estado: "EN_PROGRESO" | "COMPLETADO" | "FALLIDO";
    procesados?: number;
    ultimoTicketId?: string | null;
    errorDetalle?: string | null;
  }): Promise<void> {
    await prisma.$executeRawUnsafe(
      `UPDATE qd_backfill_zendesk_checkpoints
       SET estado = $2,
           procesados = COALESCE($3, procesados),
           ultimo_ticket_id = COALESCE($4, ultimo_ticket_id),
           error_detalle = $5,
           updated_at = now()
       WHERE id = $1`,
      id, datos.estado, datos.procesados ?? null,
      datos.ultimoTicketId ?? null, datos.errorDetalle ?? null,
    );
  },

  async existeItem(runId: string, ticketId: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ existe: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM qd_backfill_zendesk_items
        WHERE run_id = ${runId} AND ticket_id = ${ticketId}
      ) AS existe
    `;
    return rows[0]?.existe === true;
  },

  /** Inserta el resultado de un ticket. Devuelve false si ya estaba procesado. */
  async registrarItem(datos: {
    runId: string;
    ticketId: string;
    ticketCreatedAt: Date | null;
    categoriaRaw: string | null;
    subcategoriaRaw: string | null;
    tipo: string | null;
    estado: string;
    motivo: string | null;
    casoId: string | null;
    numero: string | null;
    fechaSolicitud: string | null;
  }): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO qd_backfill_zendesk_items
        (id, run_id, ticket_id, ticket_created_at, categoria_raw, subcategoria_raw,
         tipo, estado, motivo, caso_id, numero, fecha_solicitud)
      VALUES
        (${genId()}, ${datos.runId}, ${datos.ticketId}, ${datos.ticketCreatedAt},
         ${datos.categoriaRaw}, ${datos.subcategoriaRaw}, ${datos.tipo}, ${datos.estado},
         ${datos.motivo}, ${datos.casoId}, ${datos.numero}, ${datos.fechaSolicitud})
      ON CONFLICT (run_id, ticket_id) DO NOTHING
      RETURNING id
    `;
    return rows.length > 0;
  },

  async resumenItems(runId: string): Promise<{
    total: number;
    creados: number;
    reutilizados: number;
    omitidos: number;
    pendientes: number;
    errores: number;
    pendientesPorMotivo: Record<string, number>;
  }> {
    const rows = await prisma.$queryRawUnsafe<{ estado: string; motivo: string | null; n: number }[]>(
      `SELECT estado, motivo, COUNT(*)::int AS n
       FROM qd_backfill_zendesk_items WHERE run_id = $1
       GROUP BY estado, motivo`,
      runId,
    );
    const out = {
      total: 0, creados: 0, reutilizados: 0, omitidos: 0, pendientes: 0, errores: 0,
      pendientesPorMotivo: {} as Record<string, number>,
    };
    for (const r of rows) {
      out.total += r.n;
      if (r.estado === "CREADO") out.creados += r.n;
      else if (r.estado === "REUTILIZADO") out.reutilizados += r.n;
      else if (r.estado === "OMITIDO") out.omitidos += r.n;
      else if (r.estado === "PENDIENTE") {
        out.pendientes += r.n;
        const motivo = r.motivo ?? "SIN_MOTIVO";
        out.pendientesPorMotivo[motivo] = (out.pendientesPorMotivo[motivo] ?? 0) + r.n;
      } else if (r.estado === "ERROR") out.errores += r.n;
    }
    return out;
  },

  async items(runId: string, limite = 500): Promise<BackfillItemRow[]> {
    return prisma.$queryRawUnsafe<BackfillItemRow[]>(
      `SELECT * FROM qd_backfill_zendesk_items
       WHERE run_id = $1 ORDER BY created_at ASC LIMIT $2`,
      runId, limite,
    );
  },
};
