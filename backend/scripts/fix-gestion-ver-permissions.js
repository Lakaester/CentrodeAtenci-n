/**
 * Migración CORRECTIVA: Asegurar que todo rol con permisos en submódulos
 * de Gestión tenga también "Gestión.ver" = TRUE.
 *
 * Problema: Roles como Asesor y Consulta tenían permisos en
 * Quejas y Devoluciones, Apoyos o Agendas, pero NO tenían
 * "Gestión.ver". Esto causaba que el header "Gestión" no se
 * mostrara en la matriz, y los submódulos aparecían visualmente
 * como hijos de "Control de Facturación".
 *
 * Solución: Insertar "Gestión.ver = TRUE" para todo rol que tenga
 * al menos un permiso TRUE en QyD, Apoyos o Agendas y carezca de
 * "Gestión.ver".
 *
 * IDEMPOTENTE: seguro de ejecutar múltiples veces.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function genId() {
  return "perm-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

async function main() {
  console.log("=== Fix: Gestión.ver para roles con submódulos ===\n");

  // 1. Encontrar roles que tienen permisos en submódulos pero NO tienen Gestión.ver
  const faltantes = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT sub.rol_id, r.nombre
    FROM cope_permisos sub
    JOIN cope_roles r ON r.id = sub.rol_id
    WHERE sub.modulo IN ('Quejas y Devoluciones', 'Apoyos', 'Agendas')
      AND sub.permitido = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM cope_permisos p
        WHERE p.rol_id = sub.rol_id
          AND p.modulo = 'Gestión'
          AND p.accion = 'ver'
          AND p.permitido = TRUE
      )
  `);

  console.log(`Roles que necesitan Gestión.ver: ${faltantes.length}`);
  let creados = 0;

  for (const { rol_id, nombre } of faltantes) {
    const id = genId();
    await prisma.$executeRawUnsafe(
      `INSERT INTO cope_permisos (id, modulo, accion, rol_id, permitido)
       VALUES ($1, 'Gestión', 'ver', $2, TRUE)
       ON CONFLICT (modulo, accion, rol_id)
       DO UPDATE SET permitido = TRUE, updated_at = now()`,
      id, rol_id
    );
    creados++;
    console.log(`  ✓ ${nombre} (${rol_id}): Gestión.ver = TRUE`);
  }

  // 2. Verificación final
  console.log("\n=== Verificación ===");
  const verificacion = await prisma.$queryRawUnsafe(`
    SELECT r.nombre,
      EXISTS(SELECT 1 FROM cope_permisos WHERE rol_id = r.id AND modulo = 'Gestión' AND accion = 'ver' AND permitido = TRUE) as gestion_ver,
      EXISTS(SELECT 1 FROM cope_permisos WHERE rol_id = r.id AND modulo IN ('Quejas y Devoluciones', 'Apoyos', 'Agendas') AND permitido = TRUE) as tiene_submodulos
    FROM cope_roles r
    ORDER BY r.nombre
  `);
  for (const v of verificacion) {
    const status = v.tiene_submodulos && v.gestion_ver ? "✓ OK" : v.tiene_submodulos ? "✗ FALTA" : "- (sin submódulos)";
    console.log(`  ${v.nombre}: Gestión.ver=${v.gestion_ver} | submódulos=${v.tiene_submodulos} → ${status}`);
  }

  console.log(`\nMigración completada: ${creados} permisos Gestión.ver creados`);
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
