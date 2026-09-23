import { prisma } from "../src/repositories/prisma";

async function main() {
  const bd = await prisma.$queryRaw<any[]>`
    SELECT numero, ticket_id, tipo, estado, caso_cerrado, cerrado_at, cerrado_por
    FROM qd_casos WHERE eliminado = FALSE AND ticket_id IN (
      '33352','31753','31460','31550','30146','29523','29164','28297',
      '24894','28075','27919','23739','21281','29937','33068','32584',
      '32492','32273','32252','8578','8230','31795','31593','31559',
      '5646','5221','30843','33144','33055','32682','32644','32638',
      '32641','32406','32407','32281','32220','32027','31921','7709',
      '31509','31511','31415','31451','31269','31060','30890','30713',
      '30651','30602','30544','30443','30092'
    ) ORDER BY numero`;

  console.log("=== 53 CASOS DEL EXCEL: caso_cerrado ===");
  const abiertos = bd.filter(r => !r.caso_cerrado);
  const cerrados = bd.filter(r => r.caso_cerrado);
  console.log("CERRADOS: " + cerrados.length);
  console.log("ABIERTOS: " + abiertos.length);
  if (abiertos.length > 0) {
    console.log("\nCASOS ABIERTOS (caso_cerrado=false):");
    abiertos.forEach(r => console.log("  " + r.numero + " | " + r.ticket_id + " | estado=" + r.estado + " | cerrado=" + r.caso_cerrado));
  }

  const extra = await prisma.$queryRaw<any[]>`
    SELECT numero, ticket_id, tipo, estado, caso_cerrado
    FROM qd_casos WHERE eliminado = FALSE AND ticket_id NOT IN (
      '33352','31753','31460','31550','30146','29523','29164','28297',
      '24894','28075','27919','23739','21281','29937','33068','32584',
      '32492','32273','32252','8578','8230','31795','31593','31559',
      '5646','5221','30843','33144','33055','32682','32644','32638',
      '32641','32406','32407','32281','32220','32027','31921','7709',
      '31509','31511','31415','31451','31269','31060','30890','30713',
      '30651','30602','30544','30443','30092'
    ) ORDER BY numero`;

  console.log("\n=== 22 CASOS NO EN EXCEL: caso_cerrado ===");
  extra.forEach(r => console.log("  " + r.numero + " | " + r.ticket_id + " | estado=" + r.estado + " | cerrado=" + r.caso_cerrado));

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
