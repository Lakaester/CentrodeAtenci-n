/**
 * Utilidades reutilizables del dashboard: construcción de filtros SQL,
 * cálculo del período anterior y comparación de KPIs.
 * TODAS las consultas del dashboard reutilizan estas piezas (no duplicar).
 */
import { Prisma } from "@prisma/client";
import type { DashboardFilters } from "../types";

export interface KpiComparado {
  valor: number | null;
  anterior: number | null;
  deltaPct: number | null;
  direccion: "up" | "down" | "flat" | null;
}

/** Traduce los filtros a un WHERE seguro y parametrizado sobre v_unificado_norm. */
export function construirWhere(f: DashboardFilters): Prisma.Sql {
  const c: Prisma.Sql[] = [];
  if (f.fechaHoraInicio)
    c.push(Prisma.sql`(fecha::date + hora::time) >= ${f.fechaHoraInicio}::timestamp`);
  if (f.fechaHoraFin)
    c.push(Prisma.sql`(fecha::date + hora::time) <= ${f.fechaHoraFin}::timestamp`);
  if (f.canal?.length) c.push(Prisma.sql`canal = ANY(${f.canal})`);
  if (f.subcanal?.length) c.push(Prisma.sql`subcanal = ANY(${f.subcanal})`);
  if (f.pais?.length) c.push(Prisma.sql`pais = ANY(${f.pais})`);
  if (f.asesor?.length) c.push(Prisma.sql`asesor = ANY(${f.asesor})`);
  if (f.categoria?.length) c.push(Prisma.sql`categoria = ANY(${f.categoria})`);
  if (f.subcategoria?.length) c.push(Prisma.sql`subcategoria = ANY(${f.subcategoria})`);
  if (f.dominio?.length) c.push(Prisma.sql`dominio = ANY(${f.dominio})`);
  if (f.estado?.length) c.push(Prisma.sql`estado_homologado = ANY(${f.estado})`);
  if (f.tipoCliente?.length) c.push(Prisma.sql`tipo_cliente = ANY(${f.tipoCliente})`);
  if (f.rangoAtencion?.length) c.push(Prisma.sql`rango_atencion = ANY(${f.rangoAtencion})`);
  if (f.rangoPrimeraRespuesta?.length)
    c.push(Prisma.sql`rango_primera_respuesta = ANY(${f.rangoPrimeraRespuesta})`);
  if (f.search && f.search.trim()) {
    const s = `%${f.search.trim()}%`;
    c.push(Prisma.sql`(contacto ILIKE ${s} OR numero ILIKE ${s} OR asesor ILIKE ${s})`);
  }
  return c.length ? Prisma.sql`WHERE ${Prisma.join(c, ` AND `)}` : Prisma.empty;
}

/** Período inmediatamente anterior, de igual duración.
 *  Acepta "YYYY-MM-DD" o "YYYY-MM-DD HH:mm" (extrae la parte de fecha). */
export function rangoAnterior(inicio: string, fin: string): { inicio: string; fin: string } {
  const dInicio = new Date(`${inicio.slice(0, 10)}T00:00:00Z`);
  const dFin = new Date(`${fin.slice(0, 10)}T00:00:00Z`);
  const dias = Math.round((dFin.getTime() - dInicio.getTime()) / 86400000) + 1;
  const prevFin = new Date(dInicio.getTime() - 86400000);
  const prevInicio = new Date(prevFin.getTime() - (dias - 1) * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { inicio: fmt(prevInicio), fin: fmt(prevFin) };
}

/** Compara valor actual vs anterior y entrega % y dirección. */
export function comparar(actual: number | null, anterior: number | null): KpiComparado {
  let deltaPct: number | null = null;
  let direccion: KpiComparado["direccion"] = null;
  if (actual !== null && anterior !== null && anterior !== 0) {
    deltaPct = Math.round(((actual - anterior) / anterior) * 1000) / 10;
    direccion = deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : "flat";
  }
  return { valor: actual, anterior, deltaPct, direccion };
}
