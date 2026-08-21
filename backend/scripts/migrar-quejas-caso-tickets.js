/**
 * Aplica la migración del modelo CASO → N TICKETS de Quejas y Devoluciones.
 * Uso: node scripts/migrar-quejas-caso-tickets.js
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

function splitSql(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .map((c) => c.split(/\r?\n/).filter((l) => !/^\s*--/.test(l)).join("\n").trim())
    .filter(Boolean);
}

async function main() {
  const file = path.join(__dirname, "..", "prisma", "migrations", "quejas-devoluciones-caso-tickets.sql");
  const sql = fs.readFileSync(file, "utf-8");
  const statements = splitSql(sql);

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log("Migración aplicada OK (", statements.length, "sentencias ).");
  await prisma.$disconnect();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; });