import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { genId, type IntervencionRow, type PausaRow, type ActividadRow } from "./facturacion.types";

export interface CrearIntervencionInput {
  asesor: string;
  unidadNegocioId?: string | null;
  clienteNombre?: string | null;
  ruc?: string | null;
  dominio: string;
  proveedor?: string | null;
  facturasPendientes?: number | null;
  boletasPendientes?: number | null;
  subcategoriaId?: string | null;
  estadoId?: string | null;
  casoId?: string | null;
}

export interface FinalizarInput {
  causa: string | null;
  resultado: string | null;
  observacion: string | null;
  subcategoriaId?: string | null;
  estadoId?: string | null;
  mensajeError?: string | null;
}

export const facturacionRepository = {
  async crear(input: CrearIntervencionInput): Promise<IntervencionRow> {
    const id = genId();
    const rows = await prisma.$queryRaw<IntervencionRow[]>`
      INSERT INTO facturacion_intervenciones
        (id, asesor, unidad_negocio_id, cliente_nombre, ruc, dominio, proveedor,
         facturas_pendientes, boletas_pendientes, subcategoria_id, estado_id, status, caso_id)
      VALUES
        (${id}, ${input.asesor}, ${input.unidadNegocioId ?? null}, ${input.clienteNombre ?? null},
         ${input.ruc ?? null}, ${input.dominio}, ${input.proveedor ?? null},
         ${input.facturasPendientes ?? null}, ${input.boletasPendientes ?? null},
         ${input.subcategoriaId ?? null}, ${input.estadoId ?? null}, 'EN_DIAGNOSTICO', ${input.casoId ?? null})
      RETURNING *
    `;
    return rows[0];
  },

  async activaPorAsesor(asesor: string): Promise<IntervencionRow | null> {
    const rows = await prisma.$queryRaw<IntervencionRow[]>`
      SELECT * FROM facturacion_intervenciones
      WHERE asesor = ${asesor} AND status IN ('EN_DIAGNOSTICO', 'PAUSADA')
      ORDER BY started_at DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async porId(id: string): Promise<IntervencionRow | null> {
    const rows = await prisma.$queryRaw<IntervencionRow[]>`
      SELECT * FROM facturacion_intervenciones WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async listar(asesor: string, limite = 50): Promise<IntervencionRow[]> {
    return prisma.$queryRaw<IntervencionRow[]>`
      SELECT * FROM facturacion_intervenciones
      WHERE asesor = ${asesor}
      ORDER BY started_at DESC
      LIMIT ${limite}
    `;
  },

  async listarPorCliente(unidadNegocioId: string | null, dominios: string[]): Promise<IntervencionRow[]> {
    const conditions: Prisma.Sql[] = [];
    if (unidadNegocioId) {
      conditions.push(Prisma.sql`unidad_negocio_id = ${unidadNegocioId}`);
    }
    if (dominios.length > 0) {
      conditions.push(Prisma.sql`dominio = ANY(${dominios})`);
    }
    if (conditions.length === 0) return [];

    const where = Prisma.join(conditions, " OR ");
    return prisma.$queryRaw<IntervencionRow[]>(Prisma.sql`
      SELECT * FROM facturacion_intervenciones
      WHERE ${where}
      ORDER BY started_at DESC
    `);
  },

  async pausas(intervencionId: string): Promise<PausaRow[]> {
    return prisma.$queryRaw<PausaRow[]>`
      SELECT * FROM facturacion_intervencion_pausas
      WHERE intervencion_id = ${intervencionId}
      ORDER BY started_at ASC
    `;
  },

  async actividades(intervencionId: string): Promise<ActividadRow[]> {
    return prisma.$queryRaw<ActividadRow[]>`
      SELECT * FROM facturacion_intervencion_actividades
      WHERE intervencion_id = ${intervencionId}
      ORDER BY created_at ASC
    `;
  },

  async pausaActiva(intervencionId: string): Promise<PausaRow | null> {
    const rows = await prisma.$queryRaw<PausaRow[]>`
      SELECT * FROM facturacion_intervencion_pausas
      WHERE intervencion_id = ${intervencionId} AND finished_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async pausar(intervencionId: string, motivo: string | null): Promise<PausaRow> {
    const id = genId();
    const rows = await prisma.$queryRaw<PausaRow[]>`
      INSERT INTO facturacion_intervencion_pausas (id, intervencion_id, motivo)
      VALUES (${id}, ${intervencionId}, ${motivo ?? null})
      RETURNING *
    `;
    await prisma.$executeRaw`
      UPDATE facturacion_intervenciones SET status = 'PAUSADA', updated_at = now()
      WHERE id = ${intervencionId}
    `;
    return rows[0];
  },

  async reanudar(intervencionId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE facturacion_intervencion_pausas SET finished_at = now()
      WHERE intervencion_id = ${intervencionId} AND finished_at IS NULL
    `;
    await prisma.$executeRaw`
      UPDATE facturacion_intervenciones SET status = 'EN_DIAGNOSTICO', updated_at = now()
      WHERE id = ${intervencionId}
    `;
  },

  async actualizar(intervencionId: string, patch: Record<string, unknown>): Promise<IntervencionRow | null> {
    const allowed = ["causa", "resultado", "observacion", "unidad_negocio_id", "cliente_nombre", "ruc", "dominio", "proveedor", "facturas_pendientes", "boletas_pendientes", "estado_id", "subcategoria_id", "mensaje_error"];
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const key of allowed) {
      if (key in patch) {
        sets.push(`${key} = ${`$${values.length + 1}`}`);
        values.push(patch[key]);
      }
    }

    if (sets.length === 0) return this.porId(intervencionId);

    const sql = `
      UPDATE facturacion_intervenciones
      SET ${sets.join(", ")}, updated_at = now()
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    values.push(intervencionId);

    const rows = await prisma.$queryRawUnsafe<IntervencionRow[]>(sql, ...values);
    return rows[0] ?? null;
  },

  async finalizar(intervencionId: string, status: string, input: FinalizarInput): Promise<IntervencionRow | null> {
    const rows = await prisma.$queryRaw<IntervencionRow[]>`
      UPDATE facturacion_intervenciones
      SET status = ${status}, finished_at = now(),
          causa = COALESCE(${input.causa ?? null}, causa),
          resultado = COALESCE(${input.resultado ?? null}, resultado),
          observacion = COALESCE(${input.observacion ?? null}, observacion),
          subcategoria_id = COALESCE(${input.subcategoriaId ?? null}, subcategoria_id),
          estado_id = COALESCE(${input.estadoId ?? null}, estado_id),
          mensaje_error = COALESCE(${input.mensajeError ?? null}, mensaje_error),
          updated_at = now()
      WHERE id = ${intervencionId}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  async registrarActividad(intervencionId: string, tipo: string, detalle: string | null): Promise<void> {
    const id = genId();
    await prisma.$executeRaw`
      INSERT INTO facturacion_intervencion_actividades (id, intervencion_id, tipo, detalle)
      VALUES (${id}, ${intervencionId}, ${tipo}, ${detalle ?? null})
    `;
  },
};
