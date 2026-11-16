/**
 * Validación end-to-end del submódulo Seguimiento Proactivo.
 *
 * Uso:
 *   cd backend && npx tsx scripts/validar-seguimiento-proactivo.ts
 *
 * Cubre:
 *  - detección de candidatos con la lógica del reporte,
 *  - generación idempotente del lote semanal,
 *  - resumen y bandeja,
 *  - detalle y atenciones,
 *  - transiciones de estado y bitácora,
 *  - backlog de semanas anteriores.
 *
 * No toca casos reales al probar la escritura: usa un caso temporal.
 */
import "dotenv/config";
import { randomUUID } from "crypto";
import { prisma } from "../src/repositories/prisma";
import { seguimientoProactivoService as service } from "../src/services/seguimientoProactivo.service";
import { seguimientoProactivoRepository as repo } from "../src/repositories/seguimientoProactivo.repository";
import { DomainError } from "../src/core/errors/types";
import type { AuthMe } from "../src/services/auth.service";

const auth: AuthMe = {
  id: "usr-bootstrap-1786716846581",
  nombre: "Administrador",
  apellido: null,
  correo: "admin@restaurant.pe",
  rol: "rol-admin",
  equipo: null,
  estado: "activo",
  permisos: [],
};

let ok = 0;
let fail = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    ok++;
    console.log(`  OK   ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail++;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("1) Candidatos");
  const cand = await service.candidatos({});
  check("hay candidatos", cand.total > 0, `${cand.total} clientes en ${cand.desde} → ${cand.hasta}`);
  check(
    "todos cumplen la regla del reporte",
    cand.rows.every((r) => r.total >= 3 && r.senales >= 2),
  );
  console.log(
    "   primeros:",
    cand.rows.slice(0, 3).map((r) => `${r.cliente} (${r.senales} señales, ${r.total} atenciones)`),
  );

  console.log("2) Crear lote (primera vez)");
  const lote1 = await service.crearLote({}, auth);
  check("lote creado", Boolean(lote1.lote.id), `${lote1.lote.semanaIso} · ${lote1.lote.periodo}`);
  check("casos creados o actualizados", lote1.creados + lote1.actualizados === lote1.candidatos,
    `creados=${lote1.creados}, actualizados=${lote1.actualizados}`);

  console.log("3) Idempotencia (segunda vez)");
  const lote2 = await service.crearLote({}, auth);
  check("no duplica casos", lote2.creados === 0, `creados=${lote2.creados}`);
  check("reutiliza el mismo lote", lote2.lote.id === lote1.lote.id);
  check("actualiza los existentes", lote2.actualizados === lote1.candidatos,
    `actualizados=${lote2.actualizados}`);

  console.log("4) Resumen");
  const resumen = await service.resumen({});
  check("KPIs de la semana", resumen.kpis.totalSemana > 0, `totalSemana=${resumen.kpis.totalSemana}`);
  check("backlog calculado", resumen.kpis.backlog >= resumen.kpis.backlogSinContacto);
  console.log("   kpis:", resumen.kpis);
  console.log("   señales:", resumen.porSenal.slice(0, 4));
  console.log("   lotes:", resumen.lotes.length, "asesores:", resumen.asesores.length);

  console.log("5) Bandeja");
  const lista = await service.listar({ scope: "semana", page: 1, pageSize: 5 }, auth);
  check("la semana tiene casos", lista.total > 0, `total=${lista.total}`);
  check("paginación respetada", lista.rows.length <= 5);
  const caso = lista.rows[0];
  check("el caso expone motivos y estado", Boolean(caso && caso.motivos.length > 0 && caso.estado),
    caso ? `${caso.cliente} · ${caso.estado}` : "");

  console.log("6) Detalle y atenciones");
  const detalle = await service.detalle(caso.id);
  check("detalle con métricas", detalle.id === caso.id && detalle.total > 0);
  const atenciones = await service.atenciones(caso.id, { page: 1, pageSize: 5 });
  check("historial de atenciones", atenciones.total > 0, `total=${atenciones.total}`);
  if (atenciones.rows[0]) {
    const a = atenciones.rows[0];
    check("atención con ticket/categoría/asesor",
      Boolean(a.ticket && a.categoria && a.asesor),
      `#${a.ticket} · ${a.categoria} · ${a.asesor}`);
  }

  console.log("7) Escritura sobre caso temporal");
  const tempId = randomUUID();
  const clave = `__test_sp_${Date.now()}__`;
  await prisma.$executeRaw`
    INSERT INTO sp_casos (id, clave_cliente, cliente, estado, total, senales, semana_deteccion, periodo_deteccion)
    VALUES (${tempId}, ${clave}, ${clave}, 'sin_seguimiento', 5, 2, ${resumen.semanaActual}, ${resumen.periodoActual})
  `;

  const g1 = await service.gestionar(tempId, {
    contactoAt: "2026-11-16 10:30",
    proximoContactoAt: "2026-11-18 09:00",
    resumen: "Se llamó al local y se acordó reprogramar la capacitación.",
    estadoNuevo: "con_pendientes",
  }, auth);
  check("estado con_pendientes", g1.estado === "con_pendientes");
  check("bitácora registrada", g1.gestiones.length === 1);
  check("próximo contacto guardado", g1.proximoContactoAt === "2026-11-18 09:00",
    String(g1.proximoContactoAt));

  let transicionInvalida = false;
  try {
    await service.gestionar(tempId, {
      contactoAt: "2026-11-16 11:00",
      resumen: "Intento inválido de volver a sin seguimiento.",
      estadoNuevo: "sin_seguimiento",
    }, auth);
  } catch (err) {
    transicionInvalida = err instanceof DomainError && err.code === "TRANSICION_INVALIDA";
  }
  check("rechaza transición inválida", transicionInvalida);

  const g2 = await service.gestionar(tempId, {
    contactoAt: "2026-11-16 12:00",
    resumen: "Se confirmó la capacitación y se cerró el caso.",
    estadoNuevo: "finalizado",
  }, auth);
  check("estado finalizado", g2.estado === "finalizado");
  check("bitácora acumulada", g2.gestiones.length === 2);

  await prisma.$executeRaw`DELETE FROM sp_casos WHERE id = ${tempId}`;
  check("caso temporal eliminado", (await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM sp_casos WHERE id = ${tempId}
  `)[0].n === 0);

  console.log("8) Backlog de semanas anteriores");
  const backlogId = randomUUID();
  const claveVieja = `__test_backlog_${Date.now()}__`;
  await prisma.$executeRaw`
    INSERT INTO sp_casos (
      id, clave_cliente, cliente, estado, total, senales,
      semana_deteccion, periodo_deteccion, primera_deteccion_at
    ) VALUES (
      ${backlogId}, ${claveVieja}, ${claveVieja}, 'sin_seguimiento', 4, 2,
      '2026-W01', '2026-01', now() - interval '30 days'
    )
  `;
  const backlog = await service.listar({ scope: "backlog", page: 1, pageSize: 100 }, auth);
  check("el caso viejo aparece en backlog",
    backlog.rows.some((r) => r.id === backlogId),
    `backlog total=${backlog.total}`);
  const resumen2 = await service.resumen({});
  check("el backlog se refleja en KPIs", resumen2.kpis.backlog >= 1);
  await prisma.$executeRaw`DELETE FROM sp_casos WHERE id = ${backlogId}`;

  console.log("9) Consulta de asesores");
  const asesores = await repo.resumen(resumen.semanaActual, resumen.periodoActual);
  check("asesores activos disponibles", asesores.asesores.length >= 7,
    `${asesores.asesores.length} usuarios`);

  console.log(`\nResultado: ${ok} OK · ${fail} FAIL`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
