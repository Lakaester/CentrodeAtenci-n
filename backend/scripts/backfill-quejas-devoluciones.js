/**
 * BACKFILL — Quejas y Devoluciones (carga retroactiva del histórico real).
 *
 * ⚠️ DEPRECADO: este script se mantiene por compatibilidad de invocación.
 * La lógica real de reconstrucción ahora vive en scripts/reconstruir-quejas-casos.ts
 * (modelo CASO → N TICKETS con evidencia). Este script delega en ella.
 *
 * Uso:
 *   node scripts/backfill-quejas-devoluciones.js [YYYY-MM-DD] [YYYY-MM-DD]
 *   (sin argumentos usa 2026-04-01 → 2026-08-31)
 */
const { spawnSync } = require("child_process");
const path = require("path");

const desde = process.argv[2] ?? "2026-04-01";
const hasta = process.argv[3] ?? "2026-08-31";

const script = path.join(__dirname, "reconstruir-quejas-casos.ts");
const res = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", script, desde, hasta],
  { stdio: "inherit", shell: process.platform === "win32" },
);
process.exit(res.status ?? 1);