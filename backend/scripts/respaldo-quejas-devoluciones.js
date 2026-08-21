/**
 * RESPALDO — Quejas y Devoluciones (antes de la reconstrucción conceptual).
 * Exporta a JSON:
 *   1. Todos los registros actuales de qd_casos (incluidos BACKFILL y MANUAL).
 *   2. Todos los tickets históricos Q/D de v_unificado_norm (Abr-Aug 2026).
 *   3. Estado actual de qd_caso_interacciones.
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const OUT = path.join(__dirname, "respaldo-quejas-devoluciones.json");

async function main() {
  const casos = await prisma.$queryRaw`SELECT * FROM qd_casos ORDER BY created_at`;
  const historico = await prisma.$queryRaw`
    SELECT
      ticket_id::text AS ticket_id, fecha::date AS fecha, canal, subcanal,
      NULLIF(TRIM(contacto),'') AS contacto, NULLIF(TRIM(numero),'') AS numero,
      NULLIF(TRIM(dominio),'') AS dominio, NULLIF(TRIM(pais),'') AS pais,
      NULLIF(TRIM(asesor),'') AS asesor, categoria, subcategoria,
      cope_scat_normalizada(subcategoria) AS tipo
    FROM v_unificado_norm
    WHERE fecha::date BETWEEN '2026-04-01' AND '2026-08-31'
      AND cope_scat_normalizada(subcategoria) IN ('queja','solicitud de devolucion')
    ORDER BY fecha, ticket_id
  `;
  const interacciones = await prisma.$queryRaw`SELECT * FROM qd_caso_interacciones ORDER BY created_at`;

  const payload = {
    generado: new Date().toISOString(),
    resumen: {
      qd_casos: casos.length,
      historico_tickets: historico.length,
      qd_caso_interacciones: interacciones.length,
    },
    qd_casos: casos,
    historico_tickets: historico,
    qd_caso_interacciones: interacciones,
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), "utf-8");
  console.log("Respaldo generado en:", OUT);
  console.log("Resumen:", JSON.stringify(payload.resumen));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
