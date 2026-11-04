import "dotenv/config";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";

async function main() {
  const f = { fechaHoraInicio: "2026-10-01 00:00", fechaHoraFin: "2026-10-31 23:59" };
  const t = Date.now();
  const s = await unificadoRepository.clientesV2(f);
  console.log("summary ms", Date.now() - t);
  console.log(JSON.stringify({ universo: s.universo, kpis: s.kpis, calidad: s.calidad, canales: s.canales, ranking: s.ranking.slice(0, 2), seguimiento: s.seguimiento.length }, null, 2));

  const list = await unificadoRepository.clientesLista(f, { page: 1, pageSize: 5 });
  console.log("lista", list.total, list.rows.slice(0, 2));
  const top = list.rows[0];
  if (top) {
    const cats = await unificadoRepository.clienteCategorias(f, top.clave);
    console.log("cats", cats.total, cats.categorias.length);
    const cat = cats.categorias[0];
    const subs = await unificadoRepository.clienteSubcategorias(f, top.clave, cat.categoria);
    console.log("subs", subs.total, subs.subcategorias.length);
    const sub = subs.subcategorias[0];
    const tickets = await unificadoRepository.clienteTickets(f, { clave: top.clave, categoria: cat.categoria, subcategoria: sub.subcategoria, page: 1, pageSize: 5 });
    console.log("tickets", tickets.total, tickets.rows.slice(0, 2));
    const evo = await unificadoRepository.clienteEvolucion(f, { clave: top.clave, granularidad: "semanal" });
    console.log("evo", evo.totalActual, evo.totalAnterior, evo.actual.length);
  }
  const sin = await unificadoRepository.clienteCategorias(f, "__sin_identificar__");
  console.log("sin cats", sin.total, sin.categorias.length);
  await prisma.$disconnect();
}
void main();
