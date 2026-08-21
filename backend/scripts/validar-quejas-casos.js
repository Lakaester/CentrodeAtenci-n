/**
 * VALIDACIÓN — Estado final del modelo CASO → N TICKETS tras la reconstrucción.
 * Verifica invariantes y genera la reconciliación completa ticket → caso.
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const p = new PrismaClient();

async function main() {
  const casos = await p.$queryRaw`SELECT * FROM qd_casos ORDER BY created_at`;
  const ints = await p.$queryRaw`SELECT * FROM qd_caso_interacciones ORDER BY caso_id, ticket_id`;
  const historial = await p.$queryRaw`
    SELECT ticket_id::text AS ticket_id, fecha::date AS fecha, dominio,
      cope_scat_normalizada(subcategoria) AS tipo
    FROM v_unificado_norm
    WHERE fecha::date BETWEEN '2026-04-01' AND '2026-08-31'
      AND cope_scat_normalizada(subcategoria) IN ('queja','solicitud de devolucion')
    ORDER BY fecha, ticket_id`;

  const rels = await p.$queryRaw`SELECT ticket_id, ticket_padre_id, followup_ids, origen FROM qd_relaciones_ticket ORDER BY ticket_id`;

  console.log("== RESUMEN FINAL ==");
  const resumen = {
    casos_totales: casos.length,
    backfill: casos.filter((c) => c.origen === "BACKFILL" && !c.eliminado).length,
    eliminados: casos.filter((c) => c.eliminado).length,
    manual: casos.filter((c) => c.origen === "MANUAL").length,
    interacciones: ints.length,
    relaciones_cargadas: rels.length,
  };
  console.table(resumen);

  console.log("\n== CASOS BACKFILL ACTIVOS ==");
  const activos = casos.filter((c) => c.origen === "BACKFILL" && !c.eliminado);
  for (const c of activos) {
    const tks = ints.filter((i) => i.caso_id === c.id).map((i) => i.ticket_id);
    console.log(`${c.numero} | ${c.tipo} | ${c.dominio ?? "SIN DOMINIO"} | apertura ${c.created_at.toISOString().slice(0,10)} | tickets(${tks.length})=${tks.join(",")}`);
  }

  // Reconciliación ticket → caso
  const casoPorTicket = new Map();
  for (const c of casos) {
    if (c.origen === "BACKFILL") {
      casoPorTicket.set(c.ticket_id, c.numero);
      for (const i of ints.filter((x) => x.caso_id === c.id)) casoPorTicket.set(i.ticket_id, c.numero);
    }
  }
  const reconciliacion = historial.map((h) => ({
    ticket: h.ticket_id,
    tipo: h.tipo === "solicitud de devolucion" ? "devolucion" : "queja",
    dominio: h.dominio ?? null,
    fecha: h.fecha.toISOString().slice(0, 10),
    caso: casoPorTicket.get(h.ticket_id) ?? "SIN CASO",
  }));

  fs.writeFileSync(path.join(__dirname, "conciliacion-quejas-devoluciones.json"), JSON.stringify(reconciliacion, null, 2), "utf-8");

  console.log("\n== CONCILIACIÓN (ticket | tipo | dominio | fecha | caso) ==");
  for (const r of reconciliacion) {
    console.log(`${r.ticket} | ${r.tipo} | ${r.dominio ?? "-"} | ${r.fecha} | ${r.caso}`);
  }

  // Invariantes
  console.log("\n== INVARIANTES ==");
  const sinCaso = reconciliacion.filter((r) => r.caso === "SIN CASO").length;
  console.log(`Tickets sin caso: ${sinCaso} (debe ser 0)`);

  // ¿Algún ticket asignado a más de un caso?
  const ticketsPorCaso = new Map();
  for (const r of reconciliacion) {
    if (!ticketsPorCaso.has(r.ticket)) ticketsPorCaso.set(r.ticket, new Set());
    ticketsPorCaso.get(r.ticket).add(r.caso);
  }
  const multi = [...ticketsPorCaso.entries()].filter(([, s]) => s.size > 1);
  console.log(`Tickets con más de un caso: ${multi.length} (debe ser 0)`);

  // Casos con tipos mixtos
  const tiposPorCaso = new Map();
  for (const r of reconciliacion) {
    if (!tiposPorCaso.has(r.caso)) tiposPorCaso.set(r.caso, new Set());
    tiposPorCaso.get(r.caso).add(r.tipo);
  }
  const mixtos = [...tiposPorCaso.entries()].filter(([, s]) => s.size > 1);
  console.log(`Casos con tipos mixtos: ${mixtos.length} (debe ser 0)`);

  // Dominios distintos dentro de un mismo caso (excluye follow_up explícito)
  const dominiosPorCaso = new Map();
  for (const r of reconciliacion) {
    if (!dominiosPorCaso.has(r.caso)) dominiosPorCaso.set(r.caso, new Set());
    dominiosPorCaso.get(r.caso).add(r.dominio ?? "SIN_DOMINIO");
  }
  const domMix = [...dominiosPorCaso.entries()].filter(([, s]) => s.size > 1);
  console.log(`Casos con dominios distintos: ${domMix.length} (se revisan manualmente)`);
  for (const [caso, s] of domMix) {
    const tickets = reconciliacion.filter((r) => r.caso === caso).map((r) => r.ticket).join(",");
    console.log(`  ${caso}: dominios=[${[...s].join(",")}] tickets=[${tickets}]`);
  }

  await p.$disconnect();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });