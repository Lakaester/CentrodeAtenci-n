import { prisma } from "./prisma";
import { normalizeDomain } from "../domain/contacto/normalizacion";

export interface ApoyoRow {
  id: string;
  ticket: string;
  asesor_id: string;
  asesor_nombre: string;
  dominio: string | null;
  cliente_nombre: string | null;
  fecha: Date;
  hora_inicio: Date | null;
  hora_fin: Date | null;
  duracion_min: number | null;
  estado: string;
  categoria: string;
  subcategoria_fun: string | null;
  sub_subcategoria_fun: string | null;
  area: string;
  persona_apoyo: string | null;
  comentario: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  cerrado_at: Date | null;
  cerrado_by: string | null;
  eliminado: boolean;
}

export interface CrearApoyoInput {
  asesorId: string;
  asesorNombre: string;
  dominio?: string | null;
  clienteNombre?: string | null;
  fecha: string;
  horaInicio?: string | null;
  horaFin?: string | null;
  estado?: string;
  categoria: string;
  subcategoriaFun?: string | null;
  subSubcategoriaFun?: string | null;
  area: string;
  personaApoyo?: string | null;
  comentario?: string | null;
}

export interface ActualizarApoyoInput {
  dominio?: string | null;
  clienteNombre?: string | null;
  fecha?: string;
  horaInicio?: string | null;
  horaFin?: string | null;
  estado?: string;
  categoria?: string;
  subcategoriaFun?: string | null;
  subSubcategoriaFun?: string | null;
  area?: string;
  personaApoyo?: string | null;
  comentario?: string | null;
  cerrar?: boolean;
}

function mapRow(row: any): ApoyoRow {
  return {
    id: row.id,
    ticket: row.ticket,
    asesor_id: row.asesor_id,
    asesor_nombre: row.asesor_nombre,
    dominio: row.dominio,
    cliente_nombre: row.cliente_nombre,
    fecha: row.fecha,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    duracion_min: row.duracion_min != null ? Number(row.duracion_min) : null,
    estado: row.estado,
    categoria: row.categoria,
    subcategoria_fun: row.subcategoria_fun,
    sub_subcategoria_fun: row.sub_subcategoria_fun,
    area: row.area,
    persona_apoyo: row.persona_apoyo,
    comentario: row.comentario,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    cerrado_at: row.cerrado_at,
    cerrado_by: row.cerrado_by,
    eliminado: row.eliminado,
  };
}

export const apoyosRepository = {
  async listar(filtros?: {
    desde?: string;
    hasta?: string;
    estado?: string;
    area?: string;
    categoria?: string;
    asesorId?: string;
    dominio?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ApoyoRow[]; total: number }> {
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
    if (filtros?.area) {
      conditions.push(`a.area = $${idx}`);
      params.push(filtros.area);
      idx++;
    }
    if (filtros?.categoria) {
      conditions.push(`a.categoria = $${idx}`);
      params.push(filtros.categoria);
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
      `SELECT COUNT(*) as count FROM apoyos a ${where}`,
      ...params
    );
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT a.* FROM apoyos a ${where} ORDER BY a.fecha DESC, a.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset
    );

    return { data: rows.map(mapRow), total };
  },

  async porId(id: string): Promise<ApoyoRow | null> {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM apoyos WHERE id = $1 AND eliminado = FALSE`,
      id
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async crear(input: CrearApoyoInput, createdBy: string | null): Promise<ApoyoRow> {
    const dominioNorm = input.dominio ? normalizeDomain(input.dominio) : null;
    const horaInicio = input.horaInicio || null;
    const horaFin = input.horaFin || null;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO apoyos (
        asesor_id, asesor_nombre, dominio, cliente_nombre, fecha,
        hora_inicio, hora_fin, estado, categoria, subcategoria_fun,
        sub_subcategoria_fun, area, persona_apoyo, comentario, created_by
      ) VALUES ($1,$2,$3,$4,$5::date,$6::time,$7::time,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      input.asesorId,
      input.asesorNombre,
      dominioNorm,
      input.clienteNombre ?? null,
      input.fecha,
      horaInicio,
      horaFin,
      input.estado ?? "PENDIENTE",
      input.categoria,
      input.subcategoriaFun ?? null,
      input.subSubcategoriaFun ?? null,
      input.area,
      input.personaApoyo ?? null,
      input.comentario ?? null,
      createdBy
    );
    return mapRow(rows[0]);
  },

  async actualizar(id: string, input: ActualizarApoyoInput, updatedBy: string | null): Promise<ApoyoRow | null> {
    const sets: string[] = ["updated_at = NOW()"];
    const params: any[] = [];
    let idx = 1;

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
    if (input.fecha !== undefined) {
      sets.push(`fecha = $${idx}::date`);
      params.push(input.fecha);
      idx++;
    }
    if (input.horaInicio !== undefined) {
      sets.push(`hora_inicio = $${idx}::time`);
      params.push(input.horaInicio || null);
      idx++;
    }
    if (input.horaFin !== undefined) {
      sets.push(`hora_fin = $${idx}::time`);
      params.push(input.horaFin || null);
      idx++;
    }
    if (input.estado !== undefined) {
      sets.push(`estado = $${idx}`);
      params.push(input.estado);
      idx++;
    }
    if (input.categoria !== undefined) {
      sets.push(`categoria = $${idx}`);
      params.push(input.categoria);
      idx++;
    }
    if (input.subcategoriaFun !== undefined) {
      sets.push(`subcategoria_fun = $${idx}`);
      params.push(input.subcategoriaFun);
      idx++;
    }
    if (input.subSubcategoriaFun !== undefined) {
      sets.push(`sub_subcategoria_fun = $${idx}`);
      params.push(input.subSubcategoriaFun);
      idx++;
    }
    if (input.area !== undefined) {
      sets.push(`area = $${idx}`);
      params.push(input.area);
      idx++;
    }
    if (input.personaApoyo !== undefined) {
      sets.push(`persona_apoyo = $${idx}`);
      params.push(input.personaApoyo);
      idx++;
    }
    if (input.comentario !== undefined) {
      sets.push(`comentario = $${idx}`);
      params.push(input.comentario);
      idx++;
    }
    if (input.cerrar) {
      sets.push(`cerrado_at = NOW()`);
      sets.push(`cerrado_by = $${idx}`);
      params.push(updatedBy);
      idx++;
    }

    if (sets.length === 1) return this.porId(id);

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE apoyos SET ${sets.join(", ")} WHERE id = $${idx} AND eliminado = FALSE RETURNING *`,
      ...params,
      id
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async cerrar(id: string, closedBy: string | null): Promise<ApoyoRow | null> {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE apoyos
       SET estado = 'CERRADO', cerrado_at = NOW(), cerrado_by = $2, updated_at = NOW()
       WHERE id = $1 AND eliminado = FALSE AND estado != 'CERRADO'
       RETURNING *`,
      id,
      closedBy
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async eliminar(id: string): Promise<boolean> {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE apoyos SET eliminado = TRUE, updated_at = NOW() WHERE id = $1 AND eliminado = FALSE`,
      id
    );
    return result > 0;
  },

  async contarPorEstado(): Promise<Record<string, number>> {
    const rows = await prisma.$queryRawUnsafe<{ estado: string; count: bigint }[]>(
      `SELECT estado, COUNT(*) as count FROM apoyos WHERE eliminado = FALSE GROUP BY estado`
    );
    const result: Record<string, number> = {};
    for (const r of rows) {
      result[r.estado] = Number(r.count);
    }
    return result;
  },

  async listarParaExportar(filtros?: {
    desde?: string;
    hasta?: string;
    estado?: string;
    area?: string;
    categoria?: string;
    asesorId?: string;
    dominio?: string;
  }): Promise<ApoyoRow[]> {
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
    if (filtros?.area) {
      conditions.push(`a.area = $${idx}`);
      params.push(filtros.area);
      idx++;
    }
    if (filtros?.categoria) {
      conditions.push(`a.categoria = $${idx}`);
      params.push(filtros.categoria);
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
      `SELECT a.* FROM apoyos a ${where} ORDER BY a.fecha DESC, a.created_at DESC`,
      ...params
    );

    return rows.map(mapRow);
  },

  async listarAreas(): Promise<{ id: string; nombre: string }[]> {
    return prisma.$queryRawUnsafe(
      `SELECT id, nombre FROM qd_areas WHERE activo = TRUE ORDER BY orden, nombre`
    );
  },

  /**
   * Lista asesores del equipo "Soporte Especializado" (activos, excluyendo roles admin).
   * Fuente oficial: cope_usuarios con JOIN a cope_equipos.
   */
  async listarAsesores(): Promise<{ id: string; nombre: string; apellido: string | null; email: string; iniciales: string | null }[]> {
    return prisma.$queryRawUnsafe(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.iniciales
       FROM cope_usuarios u
       INNER JOIN cope_equipos e ON u.equipo_id = e.id
       WHERE e.nombre = 'Soporte Especializado'
         AND u.estado = 'activo'
         AND u.rol != 'rol-admin'
       ORDER BY u.nombre ASC`
    );
  },

  /**
   * Lista categorías funcionales de la Columna B del Google Sheet.
   * Fuente: public.homologacion_categorias (sincronizado via subir_categorias.py).
   * Muestra valores REALES de la fuente, sin homologar ni deduplicar.
   */
  async listarCategoriasFun(): Promise<{ categoria: string }[]> {
    return prisma.$queryRawUnsafe<{ categoria: string }[]>(
      `SELECT DISTINCT categoria
       FROM public.homologacion_categorias
       WHERE categoria IS NOT NULL AND TRIM(categoria) <> ''
       ORDER BY categoria ASC`
    );
  },

  /**
   * Lista subcategorías (Columna A) filtradas por categoría (Columna B).
   * Fuente: public.homologacion_categorias (Google Sheet → subir_categorias.py).
   * Filtra por comparación accent-insensitive para manejar variantes de escritura.
   */
  async listarSubcategoriasDeCategoria(categoria: string): Promise<{ subcategoria: string }[]> {
    const normCategoria = categoria
      .toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const rows = await prisma.$queryRawUnsafe<{ subcategoria: string; cat_norm: string }[]>(
      `SELECT DISTINCT subcategoria,
              LOWER(TRIM(categoria)) AS cat_norm
       FROM public.homologacion_categorias
       WHERE subcategoria IS NOT NULL AND TRIM(subcategoria) <> ''
       ORDER BY subcategoria ASC`
    );

    const filtered = rows
      .filter((r) => {
        const catNorm = r.cat_norm
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return catNorm === normCategoria;
      })
      .map((r) => ({ subcategoria: r.subcategoria }));

    return filtered;
  },
};
