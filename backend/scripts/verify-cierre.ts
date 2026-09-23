import { prisma } from "../src/repositories/prisma";

async function main() {
  const bd = await prisma.$queryRaw<any[]>`
    SELECT numero, ticket_id, estado, caso_cerrado, cerrado_at, cerrado_por
    FROM qd_casos WHERE eliminado = FALSE AND ticket_id IN (
      '33352','31753','31460','31550','30146','29523','29164','28297',
      '24894','28075','27919','23739','21281','29937','33068','32584',
      '32492','32273','32252','8578','8230','31795','31593','31559',
      '5646','5221','30843','33144','33055','32682','32644','32638',
      '32641','32406','32407','32281','32220','32027','31921','7709',
      '31509','31511','31415','31451','31269','31060','30890','30713',
      '30651','30602','30544','30443','30092'
    ) ORDER BY numero`;

  console.log("=== VERIFICACIÓN POST-CIERRE ===");
  console.log("Total casos del Excel:", bd.length);
  
  const cerrados = bd.filter(r => r.caso_cerrado);
  const abiertos = bd.filter(r => !r.caso_cerrado);
  
  console.log("CERRADOS:", cerrados.length);
  console.log("ABIERTOS:", abiertos.length);
  
  console.log("\n--- CASOS ABIERTOS (deben ser 3) ---");
  abiertos.forEach(r => console.log("  " + r.numero + " | " + r.estado + " | cerrado=" + r.caso_cerrado));

  console.log("\n--- AUDITORÍA ---");
  const audit = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as cnt FROM qd_auditoria WHERE accion = 'cierre_excel'`;
  console.log("Registros cierre_excel:", audit[0].cnt);
  
  const totalAudit = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as cnt FROM qd_auditoria`;
  console.log("Total auditoría:", totalAudit[0].cnt);
  
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
