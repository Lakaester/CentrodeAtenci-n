import { prisma } from "./prisma";
import { normalizeDomain } from "../domain/contacto/normalizacion";

/** Ejecutor de SQL (cliente Prisma o transacción) para atomicidad (O4-B). */
export type AgendasDbExecutor = Pick<typeof prisma, "$executeRawUnsafe" | "$queryRawUnsafe">;

export interface AgendaRow {
  id: string;
  ticket: string;
  tipo: string;
  asesor_id: string;
  asesor_nombre: string;
  asesor_correo: string;
  dominio: string | null;
  cliente_nombre: string | null;
  cliente_numero: string | null;
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  duracion_min: number | null;
  estado: string;
  descripcion: string | null;
  hora_inicio_real: string | null;
  hora_fin_real: string | null;
  duracion_real_min: number | null;
  resultado: string | null;
  calendar_event_id: string | null;
  calendar_html_link: string | null;
  calendar_sync_status: string | null;
  calendar_sync_error: string | null;
  calendar_meet_link: string | null;
  acta_file_id: string | null;
  acta_nombre: string | null;
  acta_tipo: string | null;
  acta_tamano: number | null;
  acta_contenido: any | null;
  acta_estado: string | null;
  grabacion_url: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  eliminado: boolean;
}

export interface CrearAgendaInput {
  tipo: string;
  asesorId: string;
  asesorNombre: string;
  asesorCorreo: string;
  dominio?: string | null;
  clienteNombre?: string | null;
  clienteNumero?: string | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado?: string;
  descripcion?: string | null;
  grabacionUrl?: string | null;
}

export interface ActualizarAgendaInput {
  tipo?: string;
  dominio?: string | null;
  clienteNombre?: string | null;
  clienteNumero?: string | null;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  estado?: string;
  resultado?: string | null;
  descripcion?: string | null;
  grabacionUrl?: string | null;
}

function mapRow(row: any): AgendaRow {
  return {
    id: row.id,
    ticket: row.ticket,
    tipo: row.tipo,
    asesor_id: row.asesor_id,
    asesor_nombre: row.asesor_nombre,
    asesor_correo: row.asesor_correo,
    dominio: row.dominio,
    cliente_nombre: row.cliente_nombre,
    cliente_numero: row.cliente_numero,
    fecha: row.fecha,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    duracion_min: row.duracion_min != null ? Number(row.duracion_min) : null,
    estado: row.estado,
    descripcion: row.descripcion,
    hora_inicio_real: row.hora_inicio_real,
    hora_fin_real: row.hora_fin_real,
    duracion_real_min: row.duracion_real_min != null ? Number(row.duracion_real_min) : null,
    resultado: row.resultado,
    calendar_event_id: row.calendar_event_id,
    calendar_html_link: row.calendar_html_link,
    calendar_sync_status: row.calendar_sync_status,
    calendar_sync_error: row.calendar_sync_error,
    calendar_meet_link: row.calendar_meet_link,
    acta_file_id: row.acta_file_id,
    acta_nombre: row.acta_nombre,
    acta_tipo: row.acta_tipo,
    acta_tamano: row.acta_tamano,
    acta_contenido: row.acta_contenido,
    acta_estado: row.acta_estado,
    grabacion_url: row.grabacion_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    eliminado: row.eliminado,
  };
}

export const agendasRepository = {
  async listar(filtros?: {
    desde?: string;
    hasta?: string;
    estado?: string;
    tipo?: string;
    asesorId?: string;
    dominio?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AgendaRow[]; total: number }> {
    const conditions: string[] = ["a.eliminado = FALSE"];
    const params: any[] = [];
    let idx = 1;

    if (filtros?.desde) {
      conditions.push(`a.fecha >= $${idx}::date`);
      params.push(filtros.desde);
      idx++;
    }
    if (filtros?.hasta) {
      conditions.push(`a.fecha <= $${idx}::date`);
      params.push(filtros.hasta);
      idx++;
    }
    if (filtros?.estado) {
      conditions.push(`a.estado = $${idx}`);
      params.push(filtros.estado);
      idx++;
    }
    if (filtros?.tipo) {
      conditions.push(`a.tipo = $${idx}`);
      params.push(filtros.tipo);
      idx++;
    }
    if (filtros?.asesorId) {
      conditions.push(`a.asesor_id = $${idx}`);
      params.push(filtros.asesorId);
      idx++;
    }
    if (filtros?.dominio) {
      const norm = normalizeDomain(filtros.dominio);
      conditions.push(`LOWER(a.dominio) = $${idx}`);
      params.push(norm);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const page = filtros?.page ?? 1;
    const limit = Math.min(filtros?.limit ?? 50, 200);
    const offset = (page - 1) * limit;

    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM agendas a ${where}`,
      ...params
    );
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT a.* FROM agendas a ${where} ORDER BY a.fecha DESC, a.hora_inicio DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset
    );

    return { data: rows.map(mapRow), total };
  },

  async porId(id: string): Promise<AgendaRow | null> {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM agendas WHERE id = $1 AND eliminado = FALSE`,
      id
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async crear(input: CrearAgendaInput, createdBy: string | null): Promise<AgendaRow> {
    const dominioNorm = input.dominio ? normalizeDomain(input.dominio) : null;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO agendas (
        tipo, asesor_id, asesor_nombre, asesor_correo, dominio,
        cliente_nombre, cliente_numero, fecha, hora_inicio, hora_fin,
        estado, descripcion, grabacion_url, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,$9::time,$10::time,$11,$12,$13,$14)
      RETURNING *`,
      input.tipo,
      input.asesorId,
      input.asesorNombre,
      input.asesorCorreo,
      dominioNorm,
      input.clienteNombre ?? null,
      input.clienteNumero ?? null,
      input.fecha,
      input.horaInicio,
      input.horaFin,
      input.estado ?? "PENDIENTE",
      input.descripcion ?? null,
      input.grabacionUrl || null,
      createdBy
    );
    return mapRow(rows[0]);
  },

  async actualizar(id: string, input: ActualizarAgendaInput): Promise<AgendaRow | null> {
    const sets: string[] = ["updated_at = NOW()"];
    const params: any[] = [];
    let idx = 1;

    if (input.tipo !== undefined) {
      sets.push(`tipo = $${idx}`);
      params.push(input.tipo);
      idx++;
    }
    if (input.dominio !== undefined) {
      sets.push(`dominio = $${idx}`);
      params.push(input.dominio ? normalizeDomain(input.dominio) : null);
      idx++;
    }
    if (input.clienteNombre !== undefined) {
      sets.push(`cliente_nombre = $${idx}`);
      params.push(input.clienteNombre);
      idx++;
    }
    if (input.clienteNumero !== undefined) {
      sets.push(`cliente_numero = $${idx}`);
      params.push(input.clienteNumero);
      idx++;
    }
    if (input.fecha !== undefined) {
      sets.push(`fecha = $${idx}::date`);
      params.push(input.fecha);
      idx++;
    }
    if (input.horaInicio !== undefined) {
      sets.push(`hora_inicio = $${idx}::time`);
      params.push(input.horaInicio);
      idx++;
    }
    if (input.horaFin !== undefined) {
      sets.push(`hora_fin = $${idx}::time`);
      params.push(input.horaFin);
      idx++;
    }
    if (input.estado !== undefined) {
      sets.push(`estado = $${idx}`);
      params.push(input.estado);
      idx++;
    }
    if (input.descripcion !== undefined) {
      sets.push(`descripcion = $${idx}`);
      params.push(input.descripcion);
      idx++;
    }
    if (input.grabacionUrl !== undefined) {
      sets.push(`grabacion_url = $${idx}`);
      params.push(input.grabacionUrl);
      idx++;
    }

    if (sets.length === 1) return this.porId(id);

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE agendas SET ${sets.join(", ")} WHERE id = $${idx} AND eliminado = FALSE RETURNING *`,
      ...params,
      id
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async actualizarEstado(id: string, estado: string, calendarEventId: string | null | undefined, estadoEsperado: string, executor: AgendasDbExecutor = prisma): Promise<AgendaRow | null> {
    const rows = await executor.$queryRawUnsafe<any[]>(
      `UPDATE agendas
       SET estado = $2, updated_at = NOW(),
           calendar_event_id = COALESCE($3, calendar_event_id)
       WHERE id = $1 AND eliminado = FALSE AND estado = $4
       RETURNING *`,
      id,
      estado,
      calendarEventId ?? null,
      estadoEsperado
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async eliminar(id: string): Promise<boolean> {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE agendas SET eliminado = TRUE, updated_at = NOW() WHERE id = $1 AND eliminado = FALSE`,
      id
    );
    return result > 0;
  },

  async contarPorEstado(): Promise<Record<string, number>> {
    const rows = await prisma.$queryRawUnsafe<{ estado: string; count: bigint }[]>(
      `SELECT estado, COUNT(*) as count FROM agendas WHERE eliminado = FALSE GROUP BY estado`
    );
    const result: Record<string, number> = {};
    for (const r of rows) {
      result[r.estado] = Number(r.count);
    }
    return result;
  },

  async listarPorFechaRango(desde: string, hasta: string): Promise<AgendaRow[]> {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM agendas
       WHERE eliminado = FALSE AND fecha >= $1::date AND fecha <= $2::date
       ORDER BY fecha ASC, hora_inicio ASC`,
      desde,
      hasta
    );
    return rows.map(mapRow);
  },

  async listarParaExportar(filtros?: {
    desde?: string;
    hasta?: string;
    estado?: string;
    tipo?: string;
    asesorId?: string;
    dominio?: string;
  }): Promise<AgendaRow[]> {
    const conditions: string[] = ["a.eliminado = FALSE"];
    const params: any[] = [];
    let idx = 1;

    if (filtros?.desde) {
      conditions.push(`a.fecha >= $${idx}::date`);
      params.push(filtros.desde);
      idx++;
    }
    if (filtros?.hasta) {
      conditions.push(`a.fecha <= $${idx}::date`);
      params.push(filtros.hasta);
      idx++;
    }
    if (filtros?.estado) {
      conditions.push(`a.estado = $${idx}`);
      params.push(filtros.estado);
      idx++;
    }
    if (filtros?.tipo) {
      conditions.push(`a.tipo = $${idx}`);
      params.push(filtros.tipo);
      idx++;
    }
    if (filtros?.asesorId) {
      conditions.push(`a.asesor_id = $${idx}`);
      params.push(filtros.asesorId);
      idx++;
    }
    if (filtros?.dominio) {
      const norm = normalizeDomain(filtros.dominio);
      conditions.push(`LOWER(a.dominio) = $${idx}`);
      params.push(norm);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT a.* FROM agendas a ${where} ORDER BY a.fecha DESC, a.hora_inicio DESC`,
      ...params
    );

    return rows.map(mapRow);
  },

  async registrarTiempoReal(
    id: string,
    campos: {
      hora_inicio_real?: string | null;
      hora_fin_real?: string | null;
      duracion_real_min?: number | null;
      resultado?: string | null;
    },
    executor: AgendasDbExecutor = prisma
  ): Promise<AgendaRow | null> {
    const sets: string[] = ["updated_at = NOW()"];
    const params: any[] = [];
    let idx = 1;

    if (campos.hora_inicio_real !== undefined) {
      sets.push(`hora_inicio_real = $${idx}::time`);
      params.push(campos.hora_inicio_real);
      idx++;
    }
    if (campos.hora_fin_real !== undefined) {
      sets.push(`hora_fin_real = $${idx}::time`);
      params.push(campos.hora_fin_real);
      idx++;
    }
    if (campos.duracion_real_min !== undefined) {
      sets.push(`duracion_real_min = $${idx}`);
      params.push(campos.duracion_real_min);
      idx++;
    }
    if (campos.resultado !== undefined) {
      sets.push(`resultado = $${idx}`);
      params.push(campos.resultado);
      idx++;
    }

    if (sets.length === 1) return this.porId(id);

    const rows = await executor.$queryRawUnsafe<any[]>(
      `UPDATE agendas SET ${sets.join(", ")} WHERE id = $${idx} AND eliminado = FALSE RETURNING *`,
      ...params,
      id
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async actualizarSyncCalendar(
    id: string,
    campos: {
      calendar_event_id?: string | null;
      calendar_html_link?: string | null;
      calendar_sync_status?: string | null;
      calendar_sync_error?: string | null;
      calendar_meet_link?: string | null;
    }
  ): Promise<AgendaRow | null> {
    const sets: string[] = ["updated_at = NOW()"];
    const params: any[] = [];
    let idx = 1;

    if (campos.calendar_event_id !== undefined) {
      sets.push(`calendar_event_id = $${idx}`);
      params.push(campos.calendar_event_id);
      idx++;
    }
    if (campos.calendar_html_link !== undefined) {
      sets.push(`calendar_html_link = $${idx}`);
      params.push(campos.calendar_html_link);
      idx++;
    }
    if (campos.calendar_sync_status !== undefined) {
      sets.push(`calendar_sync_status = $${idx}`);
      params.push(campos.calendar_sync_status);
      idx++;
    }
    if (campos.calendar_sync_error !== undefined) {
      sets.push(`calendar_sync_error = $${idx}`);
      params.push(campos.calendar_sync_error);
      idx++;
    }
    if (campos.calendar_meet_link !== undefined) {
      sets.push(`calendar_meet_link = $${idx}`);
      params.push(campos.calendar_meet_link);
      idx++;
    }

    if (sets.length === 1) return this.porId(id);

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE agendas SET ${sets.join(", ")} WHERE id = $${idx} AND eliminado = FALSE RETURNING *`,
      ...params,
      id
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async guardarActa(id: string, contenido: any, estado: string, executor: AgendasDbExecutor = prisma): Promise<AgendaRow | null> {
    const rows = await executor.$queryRawUnsafe<any[]>(
      `UPDATE agendas
       SET acta_contenido = $2, acta_estado = $3, updated_at = NOW()
       WHERE id = $1 AND eliminado = FALSE
       RETURNING *`,
      id,
      contenido,
      estado
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async actualizarMetadatosActa(
    id: string,
    campos: {
      acta_file_id?: string | null;
      acta_nombre?: string | null;
      acta_tipo?: string | null;
      acta_tamano?: number | null;
    },
    executor: AgendasDbExecutor = prisma
  ): Promise<AgendaRow | null> {
    const sets: string[] = ["updated_at = NOW()"];
    const params: any[] = [];
    let idx = 1;

    if (campos.acta_file_id !== undefined) {
      sets.push(`acta_file_id = $${idx}`);
      params.push(campos.acta_file_id);
      idx++;
    }
    if (campos.acta_nombre !== undefined) {
      sets.push(`acta_nombre = $${idx}`);
      params.push(campos.acta_nombre);
      idx++;
    }
    if (campos.acta_tipo !== undefined) {
      sets.push(`acta_tipo = $${idx}`);
      params.push(campos.acta_tipo);
      idx++;
    }
    if (campos.acta_tamano !== undefined) {
      sets.push(`acta_tamano = $${idx}`);
      params.push(campos.acta_tamano);
      idx++;
    }

    if (sets.length === 1) return this.porId(id);

    const rows = await executor.$queryRawUnsafe<any[]>(
      `UPDATE agendas SET ${sets.join(", ")} WHERE id = $${idx} AND eliminado = FALSE RETURNING *`,
      ...params,
      id
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },
};
