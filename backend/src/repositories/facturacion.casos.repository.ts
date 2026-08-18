import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { genId } from "./facturacion.types";

// ── Tipos ──

export interface CasoRow {
  id: string;
  dominio: string;
  ruc: string | null;
  proveedor: string | null;
  unidad_negocio_id: string | null;
  cliente_nombre: string | null;
  estado_operativo: string;
  categoria_id: string | null;
  subcategoria_id: string | null;
  facturas_iniciales: number | null;
  boletas_iniciales: number | null;
  total_inicial: number | null;
  ultimas_facturas: number | null;
  ultimas_boletas: number | null;
  ultimo_total: number | null;
  primera_deteccion: Date;
  ultima_deteccion: Date;
  asesor_actual: string | null;
  fecha_asignacion: Date | null;
  asignado_por: string | null;
  created_at: Date;
  updated_at: Date;
  categoria_nombre?: string | null;
  subcategoria_nombre?: string | null;
}

export interface SnapshotRow {
  id: string;
  caso_id: string;
  fecha_snapshot: Date;
  facturas: number | null;
  boletas: number | null;
  total: number | null;
  origen: string;
  created_by: string | null;
  created_at: Date;
}

export interface AsignacionRow {
  id: string;
  caso_id: string;
  asesor: string;
  asignado_por: string | null;
  created_at: Date;
}

export interface AuditoriaRow {
  id: string;
  entidad: string;
  entidad_id: string | null;
  accion: string;
  asesor: string | null;
  detalle: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  created_at: Date;
}

export interface CasoCasoVinculadoRow {
  caso_id: string;
  intervencion_id: string;
  created_at: Date;
}

export interface FiltrosCasos {
  desde?: string;
  hasta?: string;
  asesor?: string;
  proveedor?: string;
  dominio?: string;
  ruc?: string;
  estado?: string;
  categoria?: string;
  subcategoria?: string;
  resultado?: string;
}

// ── Repositorio ──

function normalizarDominio(dominio: string): string {
  return dominio.trim().toLowerCase().replace(/\/+$/, "");
}

export const facturacionCasosRepository = {
  /**
   * Devuelve el caso del dominio o lo crea (PENDIENTE) si no existe.
   * La restricción UNIQUE(dominio) de PostgreSQL protege contra concurrencia.
   */
  async crearOConsultarPorDominio(dominio: string, datos?: { ruc?: string | null; proveedor?: string | null; unidadNegocioId?: string | null; clienteNombre?: string | null }): Promise<CasoRow> {
    const d = normalizarDominio(dominio);
    const id = genId();
    const rows = await prisma.$queryRaw<CasoRow[]>`
      INSERT INTO facturacion_casos
        (id, dominio, ruc, proveedor, unidad_negocio_id, cliente_nombre,
         estado_operativo, primera_deteccion, ultima_deteccion)
      VALUES
        (${id}, ${d}, ${datos?.ruc ?? null}, ${datos?.proveedor ?? null},
         ${datos?.unidadNegocioId ?? null}, ${datos?.clienteNombre ?? null},
         'PENDIENTE', now(), now())
      ON CONFLICT (dominio) DO NOTHING
      RETURNING *
    `;
    if (rows[0]) return rows[0];
    return (await this.porDominio(d))!;
  },

  async porId(id: string): Promise<CasoRow | null> {
    const rows = await prisma.$queryRaw<CasoRow[]>`
      SELECT c.*, cat.nombre AS categoria_nombre, sub.nombre AS subcategoria_nombre
      FROM facturacion_casos c
      LEFT JOIN facturacion_categorias cat ON cat.id = c.categoria_id
      LEFT JOIN facturacion_subcategorias sub ON sub.id = c.subcategoria_id
      WHERE c.id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async porDominio(dominio: string): Promise<CasoRow | null> {
    const d = normalizarDominio(dominio);
    const rows = await prisma.$queryRaw<CasoRow[]>`
      SELECT c.*, cat.nombre AS categoria_nombre, sub.nombre AS subcategoria_nombre
      FROM facturacion_casos c
      LEFT JOIN facturacion_categorias cat ON cat.id = c.categoria_id
      LEFT JOIN facturacion_subcategorias sub ON sub.id = c.subcategoria_id
      WHERE c.dominio = ${d} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Lista casos históricos con filtros. La fecha permite buscar históricamente;
   * NO se limita a los dominios actualmente pendientes en el BI.
   */
  async listar(f: FiltrosCasos, limite = 200): Promise<CasoRow[]> {
    const conds: Prisma.Sql[] = [];
    if (f.desde) conds.push(Prisma.sql`c.primera_deteccion >= ${f.desde}::date`);
    if (f.hasta) conds.push(Prisma.sql`c.primera_deteccion <= ${f.hasta}::date + interval '1 day'`);
    if (f.asesor) conds.push(Prisma.sql`c.asesor_actual = ${f.asesor}`);
    if (f.proveedor) conds.push(Prisma.sql`c.proveedor = ${f.proveedor}`);
    if (f.dominio) conds.push(Prisma.sql`c.dominio ILIKE ${`%${f.dominio}%`}`);
    if (f.ruc) conds.push(Prisma.sql`c.ruc = ${f.ruc}`);
    if (f.estado) conds.push(Prisma.sql`c.estado_operativo = ${f.estado}`);
    if (f.categoria) conds.push(Prisma.sql`cat.nombre = ${f.categoria}`);
    if (f.subcategoria) conds.push(Prisma.sql`sub.nombre = ${f.subcategoria}`);
    if (f.resultado) conds.push(Prisma.sql`c.estado_operativo = ${f.resultado}`);

    const where = conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}` : Prisma.empty;
    return prisma.$queryRaw<CasoRow[]>(Prisma.sql`
      SELECT c.*, cat.nombre AS categoria_nombre, sub.nombre AS subcategoria_nombre
      FROM facturacion_casos c
      LEFT JOIN facturacion_categorias cat ON cat.id = c.categoria_id
      LEFT JOIN facturacion_subcategorias sub ON sub.id = c.subcategoria_id
      ${where}
      ORDER BY c.ultima_deteccion DESC
      LIMIT ${limite}
    `);
  },

  async actualizarCaso(id: string, patch: Record<string, unknown>): Promise<CasoRow | null> {
    const allowed = [
      "ruc", "proveedor", "unidad_negocio_id", "cliente_nombre",
      "categoria_id", "subcategoria_id", "asesor_actual", "fecha_asignacion", "asignado_por",
      "estado_operativo", "facturas_iniciales", "boletas_iniciales", "total_inicial",
      "ultimas_facturas", "ultimas_boletas", "ultimo_total", "primera_deteccion", "ultima_deteccion",
    ];
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in patch) {
        sets.push(`${key} = $${values.length + 1}`);
        values.push(patch[key]);
      }
    }
    if (sets.length === 0) return this.porId(id);
    const sql = `
      UPDATE facturacion_casos SET ${sets.join(", ")}, updated_at = now()
      WHERE id = $${values.length + 1} RETURNING *
    `;
    values.push(id);
    const rows = await prisma.$queryRawUnsafe<CasoRow[]>(sql, ...values);
    return rows[0] ?? null;
  },

  // ── Snapshots ──

  async snapshots(casoId: string): Promise<SnapshotRow[]> {
    return prisma.$queryRaw<SnapshotRow[]>`
      SELECT * FROM facturacion_caso_snapshots
      WHERE caso_id = ${casoId}
      ORDER BY fecha_snapshot ASC
    `;
  },

  /**
   * UPSERT diario: UNIQUE(caso_id, fecha_snapshot) → actualiza la fila del día
   * conservando el último estado conocido. Nunca borra días anteriores.
   */
  async registrarSnapshot(datos: { casoId: string; facturas: number | null; boletas: number | null; total: number | null; origen: string; usuario: string | null }): Promise<SnapshotRow> {
    const id = genId();
    const rows = await prisma.$queryRaw<SnapshotRow[]>`
      INSERT INTO facturacion_caso_snapshots (id, caso_id, fecha_snapshot, facturas, boletas, total, origen, created_by)
      VALUES (${id}, ${datos.casoId}, CURRENT_DATE, ${datos.facturas ?? null}, ${datos.boletas ?? null}, ${datos.total ?? null}, ${datos.origen}, ${datos.usuario ?? null})
      ON CONFLICT (caso_id, fecha_snapshot)
      DO UPDATE SET
        facturas = EXCLUDED.facturas,
        boletas = EXCLUDED.boletas,
        total = EXCLUDED.total,
        origen = EXCLUDED.origen,
        created_by = EXCLUDED.created_by
      RETURNING *
    `;
    return rows[0];
  },

  // ── Asignaciones ──

  async asignaciones(casoId: string): Promise<AsignacionRow[]> {
    return prisma.$queryRaw<AsignacionRow[]>`
      SELECT * FROM facturacion_caso_asignaciones
      WHERE caso_id = ${casoId}
      ORDER BY created_at ASC
    `;
  },

  async registrarAsignacion(casoId: string, asesor: string, asignadoPor: string | null): Promise<AsignacionRow> {
    const id = genId();
    const rows = await prisma.$queryRaw<AsignacionRow[]>`
      INSERT INTO facturacion_caso_asignaciones (id, caso_id, asesor, asignado_por)
      VALUES (${id}, ${casoId}, ${asesor}, ${asignadoPor ?? null})
      RETURNING *
    `;
    return rows[0];
  },

  // ── Intervenciones vinculadas ──

  async vincularIntervencion(casoId: string, intervencionId: string): Promise<void> {
    const id = genId();
    await prisma.$executeRaw`
      INSERT INTO facturacion_caso_intervenciones (id, caso_id, intervencion_id)
      VALUES (${id}, ${casoId}, ${intervencionId})
      ON CONFLICT (caso_id, intervencion_id) DO NOTHING
    `;
    await prisma.$executeRaw`
      UPDATE facturacion_intervenciones SET caso_id = ${casoId}, updated_at = now()
      WHERE id = ${intervencionId}
    `;
  },

  async intervencionesDelCaso(casoId: string): Promise<CasoCasoVinculadoRow[]> {
    return prisma.$queryRaw<CasoCasoVinculadoRow[]>`
      SELECT * FROM facturacion_caso_intervenciones
      WHERE caso_id = ${casoId}
      ORDER BY created_at ASC
    `;
  },

  // ── Auditoría ──

  async registrarAuditoria(datos: { entidad: string; entidadId: string | null; accion: string; asesor: string | null; detalle?: string | null; anterior?: string | null; nuevo?: string | null }): Promise<void> {
    const id = genId();
    await prisma.$executeRaw`
      INSERT INTO facturacion_auditoria (id, entidad, entidad_id, accion, asesor, detalle, valor_anterior, valor_nuevo)
      VALUES (${id}, ${datos.entidad}, ${datos.entidadId ?? null}, ${datos.accion}, ${datos.asesor ?? null},
              ${datos.detalle ?? null}, ${datos.anterior ?? null}, ${datos.nuevo ?? null})
    `;
  },

  async auditoriaDeCaso(casoId: string): Promise<AuditoriaRow[]> {
    return prisma.$queryRaw<AuditoriaRow[]>`
      SELECT * FROM facturacion_auditoria
      WHERE entidad = 'caso' AND entidad_id = ${casoId}
      ORDER BY created_at ASC
    `;
  },

  // ── Catálogos ──

  async listarCategorias(): Promise<{ id: string; nombre: string; activo: boolean; orden: number }[]> {
    return prisma.$queryRaw<{ id: string; nombre: string; activo: boolean; orden: number }[]>`
      SELECT id, nombre, activo, orden FROM facturacion_categorias ORDER BY orden ASC, nombre ASC
    `;
  },

  async listarSubcategoriasDeCategoria(categoriaId: string): Promise<{ id: string; nombre: string }[]> {
    return prisma.$queryRaw<{ id: string; nombre: string }[]>`
      SELECT id, nombre FROM facturacion_subcategorias
      WHERE activo = TRUE AND (categoria_id = ${categoriaId} OR categoria_id IS NULL)
      ORDER BY orden ASC, nombre ASC
    `;
  },
};
