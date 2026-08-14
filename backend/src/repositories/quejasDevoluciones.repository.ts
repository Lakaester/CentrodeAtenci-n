import { prisma } from "./prisma";
import { genId } from "./facturacion.types";

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
  monto_pagado: number | null;
  tipo_monto: string | null;
  area: string | null;
  motivo: string | null;
  porcentaje: number | null;
  monto_devuelto: number | null;
  clasificacion: string | null;
  producto: string | null;
  observacion: string | null;
  origen: string | null;               // MANUAL | CATEGORIZACION
  eliminado: boolean;
  eliminado_at: Date | null;
  eliminado_por: string | null;
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
  montoPagado?: number | null;
  tipoMonto?: string | null;
  area?: string | null;
  motivo?: string | null;
  porcentaje?: number | null;
  montoDevuelto?: number | null;
  clasificacion?: string | null;
  producto?: string | null;
  observacion?: string | null;
  origen?: string | null;    // MANUAL | CATEGORIZACION
}

export const qdRepository = {
  async listar(tipo: string, limite = 200): Promise<QdCasoRow[]> {
    return prisma.$queryRaw<QdCasoRow[]>`
      SELECT c.*, COUNT(i.id)::int AS total_interacciones
      FROM qd_casos c
      LEFT JOIN qd_caso_interacciones i ON i.caso_id = c.id
      WHERE c.tipo = ${tipo} AND c.eliminado = FALSE
      GROUP BY c.id
      ORDER BY c.created_at DESC LIMIT ${limite}
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
    if (f.desde) { conds.push(`created_at >= $${vals.length + 1}::timestamp`); vals.push(`${f.desde}T00:00:00`); }
    if (f.hasta) { conds.push(`created_at <= $${vals.length + 1}::timestamp`); vals.push(`${f.hasta}T23:59:59`); }
    if (f.pais) { conds.push(`pais = $${vals.length + 1}`); vals.push(f.pais); }
    if (f.estado) { conds.push(`estado = $${vals.length + 1}`); vals.push(f.estado); }
    if (f.resultado) { conds.push(`resultado = $${vals.length + 1}`); vals.push(f.resultado); }
    if (f.asesor) { conds.push(`asesor = $${vals.length + 1}`); vals.push(f.asesor); }
    if (f.area) { conds.push(`area = $${vals.length + 1}`); vals.push(f.area); }
    if (f.producto) { conds.push(`producto = $${vals.length + 1}`); vals.push(f.producto); }
    if (f.tipoQueja) { conds.push(`clasificacion = $${vals.length + 1}`); vals.push(f.tipoQueja); }
    conds.push(`c.eliminado = FALSE`);
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    return prisma.$queryRawUnsafe<QdCasoRow[]>(
      `SELECT c.*, COUNT(i.id)::int AS total_interacciones
       FROM qd_casos c
       LEFT JOIN qd_caso_interacciones i ON i.caso_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
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

  async porTicket(ticketId: string, tipo: string): Promise<QdCasoRow | null> {
    const rows = await prisma.$queryRaw<QdCasoRow[]>`SELECT * FROM qd_casos WHERE ticket_id = ${ticketId} AND tipo = ${tipo} AND eliminado = FALSE LIMIT 1`;
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
  async porTicketGeneral(ticketId: string, tipo: string): Promise<QdCasoRow | null> {
    const rows = await prisma.$queryRaw<QdCasoRow[]>`
      SELECT c.* FROM qd_casos c
      WHERE c.tipo = ${tipo} AND c.eliminado = FALSE
        AND (c.ticket_id = ${ticketId}
             OR c.ticket_padre_id = ${ticketId}
             OR EXISTS (SELECT 1 FROM qd_caso_interacciones i WHERE i.caso_id = c.id AND i.ticket_id = ${ticketId}))
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /** Interacciones relacionadas de un caso (sin el ticket principal). */
  async interacciones(casoId: string): Promise<QdInteraccionRow[]> {
    return prisma.$queryRaw<QdInteraccionRow[]>`
      SELECT * FROM qd_caso_interacciones WHERE caso_id = ${casoId} ORDER BY created_at ASC
    `;
  },

  /** Asocia un ticket a un caso como interacción relacionada. Idempotente por (caso_id, ticket_id). */
  async asociarInteraccion(casoId: string, ticketId: string, usuario: string | null, tipoRelacion = "relacionada"): Promise<QdInteraccionRow | null> {
    const id = genId();
    const rows = await prisma.$queryRaw<QdInteraccionRow[]>`
      INSERT INTO qd_caso_interacciones (id, caso_id, ticket_id, tipo_relacion, created_by)
      VALUES (${id}, ${casoId}, ${ticketId}, ${tipoRelacion}, ${usuario ?? null})
      ON CONFLICT (caso_id, ticket_id) DO NOTHING
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  async crear(input: CrearCasoInput): Promise<QdCasoRow> {
    const id = genId();
    const numero = `${input.tipo === "devolucion" ? "DEV" : "QUE"}-${String(Date.now()).slice(-5)}`;
    const rows = await prisma.$queryRaw<QdCasoRow[]>`
      INSERT INTO qd_casos
        (id, tipo, numero, ticket_id, ticket_padre_id, dominio, pais, asesor, estado, resultado,
         monto_pagado, tipo_monto, area, motivo, porcentaje, monto_devuelto, clasificacion, producto, observacion, origen)
      VALUES
        (${id}, ${input.tipo}, ${numero}, ${input.ticketId ?? null}, ${input.ticketPadreId ?? null}, ${input.dominio ?? null}, ${input.pais ?? null},
         ${input.asesor ?? null}, ${input.estado ?? null}, ${input.resultado ?? null},
         ${input.montoPagado ?? null}, ${input.tipoMonto ?? null}, ${input.area ?? null}, ${input.motivo ?? null},
         ${input.porcentaje ?? null}, ${input.montoDevuelto ?? null}, ${input.clasificacion ?? null}, ${input.producto ?? null},
         ${input.observacion ?? null}, ${input.origen ?? "MANUAL"})
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Eliminación lógica: marca el caso como eliminado pero conserva el registro.
   * Las interacciones relacionadas no se tocan (trazabilidad).
   */
  async eliminarLogico(id: string, usuario: string | null): Promise<QdCasoRow | null> {
    const rows = await prisma.$queryRaw<QdCasoRow[]>`
      UPDATE qd_casos
      SET eliminado = TRUE, eliminado_at = now(), eliminado_por = ${usuario ?? null}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  async actualizar(id: string, patch: Partial<Omit<CrearCasoInput, "tipo" | "ticketId">> & { ticketId?: string | null }): Promise<QdCasoRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    const map: Record<string, unknown> = {
      ticket_id: patch.ticketId,
      dominio: patch.dominio,
      pais: patch.pais,
      asesor: patch.asesor,
      estado: patch.estado,
      resultado: patch.resultado,
      monto_pagado: patch.montoPagado,
      tipo_monto: patch.tipoMonto,
      area: patch.area,
      motivo: patch.motivo,
      porcentaje: patch.porcentaje,
      monto_devuelto: patch.montoDevuelto,
      clasificacion: patch.clasificacion,
      producto: patch.producto,
      observacion: patch.observacion,
    };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { sets.push(`${col} = $${values.length + 1}`); values.push(val); }
    }
    if (sets.length === 0) return this.porId(id);
    sets.push("updated_at = now()");
    values.push(id);
    const rows = await prisma.$queryRawUnsafe<QdCasoRow[]>(
      `UPDATE qd_casos SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
      ...values,
    );
    return rows[0] ?? null;
  },

  async auditoria(casoId: string): Promise<QdAuditoriaRow[]> {
    return prisma.$queryRaw<QdAuditoriaRow[]>`SELECT * FROM qd_auditoria WHERE caso_id = ${casoId} ORDER BY created_at ASC`;
  },

  async registrarAuditoria(casoId: string, usuario: string | null, accion: string, campo: string | null, anterior: string | null, nuevo: string | null): Promise<void> {
    const id = genId();
    await prisma.$executeRaw`
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
