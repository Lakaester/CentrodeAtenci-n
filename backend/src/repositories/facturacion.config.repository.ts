import { prisma } from "./prisma";
import { genId } from "./facturacion.types";

export interface ConfigRow {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  es_interno: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(r: any): ConfigRow {
  return {
    id: r.id,
    nombre: r.nombre,
    activo: r.activo,
    orden: r.orden,
    es_interno: r.es_interno,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

async function listar(tabla: string): Promise<ConfigRow[]> {
  const rows = await prisma.$queryRawUnsafe(`SELECT * FROM ${tabla} ORDER BY orden ASC, nombre ASC`);
  return (rows as any[]).map(mapRow);
}

async function crear(tabla: string, nombre: string): Promise<ConfigRow> {
  const id = genId();
  const max = await prisma.$queryRawUnsafe<{ m: number | null }[]>(
    `SELECT MAX(orden) AS m FROM ${tabla}`,
  );
  const orden = (max[0]?.m ?? 0) + 10;
  const rows = await prisma.$queryRawUnsafe(
    `INSERT INTO ${tabla} (id, nombre, orden) VALUES ($1, $2, $3) RETURNING *`,
    id,
    nombre,
    orden,
  );
  return mapRow((rows as any[])[0]);
}

async function actualizar(tabla: string, id: string, patch: { nombre?: string; activo?: boolean; orden?: number }): Promise<ConfigRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.nombre !== undefined) { sets.push("nombre = $" + (values.length + 1)); values.push(patch.nombre); }
  if (patch.activo !== undefined) { sets.push("activo = $" + (values.length + 1)); values.push(patch.activo); }
  if (patch.orden !== undefined) { sets.push("orden = $" + (values.length + 1)); values.push(patch.orden); }
  if (sets.length === 0) return null;
  sets.push("updated_at = now()");
  values.push(id);
  const rows = await prisma.$queryRawUnsafe(
    `UPDATE ${tabla} SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    ...values,
  );
  return rows.length ? mapRow(rows[0]) : null;
}

async function contarDependencias(tabla: string, id: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ n: number }[]>(
    `SELECT COUNT(*)::int AS n FROM facturacion_intervenciones WHERE ${tabla === "facturacion_estados" ? "estado_id" : "subcategoria_id"} = $1`,
    id,
  );
  return rows[0]?.n ?? 0;
}

export const facturacionConfigRepository = {
  listarEstados: () => listar("facturacion_estados"),
  listarSubcategorias: () => listar("facturacion_subcategorias"),
  crearEstado: (nombre: string) => crear("facturacion_estados", nombre),
  crearSubcategoria: (nombre: string) => crear("facturacion_subcategorias", nombre),
  actualizarEstado: (id: string, patch: { nombre?: string; activo?: boolean; orden?: number }) => actualizar("facturacion_estados", id, patch),
  actualizarSubcategoria: (id: string, patch: { nombre?: string; activo?: boolean; orden?: number }) => actualizar("facturacion_subcategorias", id, patch),
  contarDependenciasEstados: (id: string) => contarDependencias("facturacion_estados", id),
  contarDependenciasSubcategorias: (id: string) => contarDependencias("facturacion_subcategorias", id),
};
