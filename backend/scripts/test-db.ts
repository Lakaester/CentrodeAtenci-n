import { prisma } from "../src/repositories/prisma";

async function main() {
  const users = await prisma.$queryRaw<any[]>`SELECT id, email, nombre, estado FROM cope_usuarios ORDER BY email`;
  console.log("=== USUARIOS ===");
  users.forEach(u => console.log(`  ${u.email} | ${u.nombre} | ${u.estado}`));

  const sessions = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as cnt FROM cope_sessions`;
  console.log("\nSesiones activas:", sessions[0].cnt);

  // Test the critical query
  console.log("\n=== TEST: findSesionByTokenHash (sin token) ===");
  const rows = await prisma.$queryRaw<any[]>`SELECT * FROM cope_sessions WHERE token_hash = 'nonexistent' LIMIT 1`;
  console.log("Resultado:", rows.length === 0 ? "OK (vacío)" : rows);

  await prisma.$disconnect();
}
main().catch(e => { console.error("FALLO:", e.message, e.code); process.exit(1); });
