const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const rows = await p.$queryRawUnsafe(
    `SELECT modulo, accion, rol_id, permitido FROM cope_permisos
     WHERE modulo IN ('Gestión', 'Agendas', 'Apoyos', 'Quejas y Devoluciones')
     ORDER BY modulo, rol_id, accion`
  );
  const grouped = {};
  for (const r of rows) {
    if (!grouped[r.modulo]) grouped[r.modulo] = [];
    grouped[r.modulo].push(`${r.rol_id}: ${r.accion} = ${r.permitido}`);
  }
  for (const [mod, perms] of Object.entries(grouped)) {
    console.log(`\n${mod} (${perms.length} permisos):`);
    perms.forEach(p => console.log(`  ${p}`));
  }

  const roles = await p.$queryRawUnsafe(`SELECT id, nombre FROM cope_roles ORDER BY orden`);
  console.log(`\nRoles: ${roles.length}`);
  roles.forEach(r => console.log(`  ${r.id}: ${r.nombre}`));

  const users = await p.$queryRawUnsafe(`SELECT id, nombre, email, rol FROM cope_usuarios ORDER BY nombre`);
  console.log(`\nUsuarios: ${users.length}`);
  users.forEach(u => console.log(`  ${u.nombre} (${u.email}) → ${u.rol}`));

  await p.$disconnect();
}
main();
