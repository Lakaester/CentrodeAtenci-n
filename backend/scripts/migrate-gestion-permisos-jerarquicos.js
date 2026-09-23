/**
 * Migración: Permisos jerárquicos para Módulo Gestión
 *
 * ANTES:
 *   "Gestión" (módulo único con todas las acciones para QyD, Apoyos y Agendas)
 *
 * DESPUÉS:
 *   "Gestión" → módulo padre (solo "ver" para acceso/navegación)
 *   "Quejas y Devoluciones" → submódulo (se mantiene como ya existe)
 *   "Apoyos" → submódulo (nuevo, con permisos CRUD independientes)
 *   "Agendas" → submódulo (nuevo, con permisos CRUD independientes)
 *
 * La migración es IDEMPOTENTE: puede ejecutarse múltiples veces sin duplicar datos.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ACCIONES_CRUD = ["ver", "crear", "editar", "eliminar", "exportar", "administrar"];

function genId() {
  return "perm-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

async function upsertPermiso(modulo, accion, rolId, permitido) {
  const id = genId();
  await prisma.$executeRawUnsafe(
    `INSERT INTO cope_permisos (id, modulo, accion, rol_id, permitido)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (modulo, accion, rol_id)
     DO UPDATE SET permitido = $5, updated_at = now()`,
    id, modulo, accion, rolId, permitido
  );
}

async function existePermiso(modulo, accion, rolId) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT permitido FROM cope_permisos
     WHERE modulo = $1 AND accion = $2 AND rol_id = $3
     LIMIT 1`,
    modulo, accion, rolId
  );
  return rows.length > 0 ? rows[0] : null;
}

async function main() {
  try {
    console.log("=== Migración: Permisos jerárquicos Gestión ===\n");

    // 1. Obtener todos los roles que tienen algún permiso en "Gestión"
    const rolesConGestion = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT rol_id FROM cope_permisos
       WHERE modulo = 'Gestión' AND permitido = TRUE`
    );
    console.log(`Roles con permisos en 'Gestión': ${rolesConGestion.length}`);

    let agendasCreados = 0;
    let apoyosCreados = 0;

    for (const { rol_id } of rolesConGestion) {
      console.log(`\nProcesando rol: ${rol_id}`);

      // === AGENDAS ===
      // Copiar acciones CRUD estándar
      for (const accion of ACCIONES_CRUD) {
        const existente = await existePermiso("Gestión", accion, rol_id);
        if (existente && existente.permitido) {
          await upsertPermiso("Agendas", accion, rol_id, true);
          agendasCreados++;
          console.log(`  Agendas.${accion} = TRUE`);
        }
      }

      // Mapear "cerrar" → "editar" en Agendas
      const tieneCerrar = await existePermiso("Gestión", "cerrar", rol_id);
      if (tieneCerrar && tieneCerrar.permitido) {
        await upsertPermiso("Agendas", "editar", rol_id, true);
        console.log(`  Agendas.editar = TRUE (desde cerrar)`);
      }

      // Mapear "ver_todos" → "ver" en Agendas
      const tieneVerTodos = await existePermiso("Gestión", "ver_todos", rol_id);
      if (tieneVerTodos && tieneVerTodos.permitido) {
        await upsertPermiso("Agendas", "ver", rol_id, true);
        console.log(`  Agendas.ver = TRUE (desde ver_todos)`);
      }

      // Mapear "gestionar_agendas" → "administrar" en Agendas
      const tieneGestionar = await existePermiso("Gestión", "gestionar_agendas", rol_id);
      if (tieneGestionar && tieneGestionar.permitido) {
        await upsertPermiso("Agendas", "administrar", rol_id, true);
        console.log(`  Agendas.administrar = TRUE (desde gestionar_agendas)`);
      }

      // === APOYOS ===
      for (const accion of ACCIONES_CRUD) {
        const existente = await existePermiso("Gestión", accion, rol_id);
        if (existente && existente.permitido) {
          await upsertPermiso("Apoyos", accion, rol_id, true);
          apoyosCreados++;
          console.log(`  Apoyos.${accion} = TRUE`);
        }
      }

      // Mapear "cerrar" → "cerrar" en Apoyos (acción específica)
      if (tieneCerrar && tieneCerrar.permitido) {
        await upsertPermiso("Apoyos", "cerrar", rol_id, true);
        console.log(`  Apoyos.cerrar = TRUE`);
      }

      // Mapear "ver_todos" → "ver" en Apoyos
      if (tieneVerTodos && tieneVerTodos.permitido) {
        await upsertPermiso("Apoyos", "ver", rol_id, true);
        console.log(`  Apoyos.ver = TRUE (desde ver_todos)`);
      }
    }

    // 2. Verificar "Quejas y Devoluciones" intacto
    console.log("\n=== Verificación: Quejas y Devoluciones ===");
    const qydPermisos = await prisma.$queryRawUnsafe(
      `SELECT modulo, accion, rol_id, permitido FROM cope_permisos
       WHERE modulo = 'Quejas y Devoluciones' AND permitido = TRUE
       ORDER BY rol_id, accion`
    );
    console.log(`Permisos existentes: ${qydPermisos.length}`);
    for (const p of qydPermisos) {
      console.log(`  ${p.rol_id}: ${p.accion} = ${p.permitido}`);
    }

    // 3. Verificar "Gestión > ver" (navegación)
    console.log("\n=== Verificación: Gestión > ver (navegación) ===");
    const gestionVer = await prisma.$queryRawUnsafe(
      `SELECT rol_id, permitido FROM cope_permisos
       WHERE modulo = 'Gestión' AND accion = 'ver'
       ORDER BY rol_id`
    );
    console.log(`Permisos: ${gestionVer.length}`);
    for (const p of gestionVer) {
      console.log(`  ${p.rol_id}: permitido = ${p.permitido}`);
    }

    // 4. Resumen
    console.log("\n=== Resumen ===");
    const counts = await prisma.$queryRawUnsafe(
      `SELECT modulo, COUNT(*) as n FROM cope_permisos
       WHERE modulo IN ('Gestión', 'Agendas', 'Apoyos', 'Quejas y Devoluciones')
       GROUP BY modulo ORDER BY modulo`
    );
    for (const c of counts) {
      console.log(`  ${c.modulo}: ${c.n} permisos`);
    }

    console.log(`\nMigración completada: ${agendasCreados} permisos Agendas, ${apoyosCreados} permisos Apoyos`);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
