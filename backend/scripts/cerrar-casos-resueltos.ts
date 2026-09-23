import { prisma } from "../src/repositories/prisma";

function genId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const TICKETS_A_CERRAR = [
  "5221","5646","8230","8578","31593","31795","32252","32273",
  "32584","33068","7709","30092","30443","30544","30602","30651",
  "30713","30890","31060","31415","31451","31509","31511","31921",
  "32027","32220","32281","32406","32407","32638","32641","32644",
  "32682","33055","33144","30843",
];

async function main() {
  console.log("=== CIERRE DE CASOS: caso_cerrado=true para Resueltos ===\n");

  const placeholders = TICKETS_A_CERRAR.map((_, i) => `$${i + 1}`).join(",");
  const casos = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, numero, ticket_id, fecha_solicitud FROM qd_casos
     WHERE ticket_id IN (${placeholders}) AND eliminado = FALSE`,
    ...TICKETS_A_CERRAR
  );

  console.log(`Casos a cerrar: ${casos.length}`);

  let cerrados = 0;
  let auditRecords = 0;

  await prisma.$transaction(async (tx) => {
    for (const caso of casos) {
      const cerradoAt = caso.fecha_solicitud
        ? new Date(caso.fecha_solicitud + "T12:00:00.000Z")
        : new Date();

      await tx.$executeRawUnsafe(
        `UPDATE qd_casos SET caso_cerrado = TRUE, cerrado_at = $1, cerrado_por = 'restauracion-forense', updated_at = now()
         WHERE id = $2`,
        cerradoAt,
        caso.id
      );

      await tx.$executeRaw`
        INSERT INTO qd_auditoria (id, caso_id, usuario, accion, campo, valor_anterior, valor_nuevo)
        VALUES (${genId()}, ${caso.id}, 'restauracion-forense', 'cierre_excel',
                'caso_cerrado', 'false', ${`Cerrado por Excel histórico: ${caso.numero} Resuelto`})
      `;

      cerrados++;
      auditRecords++;
      console.log(`  CERRADO: ${caso.numero} | ticket ${caso.ticket_id} | cerrado_at: ${caso.fecha_solicitud}`);
    }
  }, { timeout: 30000 });

  console.log(`\n=== RESULTADO ===`);
  console.log(`Casos cerrados: ${cerrados}`);
  console.log(`Auditorías: ${auditRecords}`);
  console.log(`DELETE: 0`);
  console.log(`Errores: 0`);
}

main().catch(console.error);
