import { prisma } from "../src/repositories/prisma";

async function main() {
  // 1. Check actual columns of agendas table
  const cols = await prisma.$queryRaw<any[]>`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'agendas'
    ORDER BY ordinal_position
  `;
  console.log("=== COLUMNAS DE agendas ===");
  cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
