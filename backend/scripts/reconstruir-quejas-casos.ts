/**
 * RECONSTRUCCIÓN — Quejas y Devoluciones: modelo CASO → N TICKETS con evidencia.
 *
 * Regla de negocio (documentada en src/services/quejasCasos.service.ts):
 *   1. Relación explícita follow_up de Zendesk (prioridad 1, identificador real).
 *   2. Identidad real + dominio normalizado + tipo (prioridad 2).
 *   3. Sin relación → caso independiente.
 *
 * Aplica la migración de la tabla de relaciones (idempotente), genera un
 * respaldo previo y reconstruye los casos BACKFILL del rango.
 *
 * Uso:
 *   npx tsx scripts/reconstruir-quejas-casos.ts [YYYY-MM-DD] [YYYY-MM-DD]
 *   (sin argumentos usa 2026-04-01 → 2026-08-31)
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { reconstruirCasosBackfill } from "../src/services/quejasCasos.service";

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const prisma = new PrismaClient();

  async function aplicarMigraciones() {
    function splitSql(sql: string): string[] {
      return sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((s) => s.trim())
        .map((c) => c.split(/\r?\n/).filter((l) => !/^\s*--/.test(l)).join("\n").trim())
        .filter(Boolean);
    }
    const archivos = [
      "quejas-devoluciones-agrupacion.sql",
      "quejas-devoluciones-caso-tickets.sql",
      "quejas-devoluciones-relaciones.sql",
    ];
    for (const file of archivos) {
      const sql = readFileSync(join(__dirname, "..", "prisma", "migrations", file), "utf-8");
      const statements = splitSql(sql);
      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
      }
      console.log(`Migración aplicada: ${file} (${statements.length} sentencias)`);
    }
  }

  const desde = process.argv[2] ?? "2026-04-01";
  const hasta = process.argv[3] ?? "2026-08-31";

  await aplicarMigraciones();
  await prisma.$disconnect();

  const r = await reconstruirCasosBackfill(desde, hasta);

  console.log("── Reconstrucción CASO → N TICKETS (evidencia) ──");
  console.log(`Período:                 ${r.desde} → ${r.hasta}`);
  console.log(`Tickets Q/D históricos:  ${r.ticketsHistoricos}`);
  console.log(`Casos BACKFILL borrados: ${r.casosBorrados}`);
  console.log(`Casos generados:         ${r.casosCreados}`);
  console.log(`Tickets vinculados:      ${r.ticketsVinculados}`);
  console.log(`Tickets sin caso:        ${r.ticketsSinCaso}`);
  console.log(`Duplicados:              ${r.duplicados}`);
  console.log(`Quejas:                  ${r.quejas.tickets} tickets → ${r.quejas.casos} casos`);
  console.log(`Devoluciones:            ${r.devoluciones.tickets} tickets → ${r.devoluciones.casos} casos`);
  console.log("── Casos con múltiples tickets ──");
  for (const g of r.gruposMultiticket) {
    console.log(`  ${g.numero} | ${g.tipo} | ${g.dominio ?? "SIN DOMINIO"} | apertura ${g.fechaApertura} | evidencia ${g.evidencia} | tickets=${g.tickets.join(",")}`);
  }
  console.log("───────────────────────────────────────────");
}

main().catch((e) => {
  console.error("ERROR:", e.message ?? e);
  process.exitCode = 1;
});