import "dotenv/config";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";

async function main() {
  const f = { fechaHoraInicio: "2026-10-01 00:00", fechaHoraFin: "2026-10-31 23:59" };
  const t = Date.now();
  const d = await unificadoRepository.zendesk(f);
  console.log("ms", Date.now() - t);
  console.log(
    JSON.stringify(
      {
        kpis: d.kpis,
        estados: d.estados,
        backlog: d.backlog,
        evolucion: {
          actual: d.evolucion.actual.length,
          anterior: d.evolucion.anterior.length,
          totalActual: d.evolucion.totalActual,
          totalAnterior: d.evolucion.totalAnterior,
          variacionAbs: d.evolucion.variacionAbs,
          variacionPct: d.evolucion.variacionPct,
        },
        sumaActual: d.evolucion.actual.reduce((s, r) => s + r.total, 0),
        sumaAnterior: d.evolucion.anterior.reduce((s, r) => s + r.total, 0),
        insights: d.insights,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}
void main();
