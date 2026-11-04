import "dotenv/config";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";

async function main() {
  const f = { fechaHoraInicio: "2026-10-01 00:00", fechaHoraFin: "2026-10-31 23:59" };
  const t = Date.now();
  const d = await unificadoRepository.quejasDevoluciones(f);
  console.log("ms", Date.now() - t);
  console.log(
    JSON.stringify(
      {
        kpis: d.kpis,
        estados: d.estados,
        canales: d.canales,
        asesores: d.asesores,
        evolucion: {
          actual: d.evolucion.actual.length,
          anterior: d.evolucion.anterior.length,
          totalActual: d.evolucion.totalActual,
          totalAnterior: d.evolucion.totalAnterior,
          variacionAbs: d.evolucion.variacionAbs,
          variacionPct: d.evolucion.variacionPct,
        },
        insights: d.insights,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}
void main();
