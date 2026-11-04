import "dotenv/config";
import { calidadRegistroRepository } from "../src/repositories/calidadRegistro.repository";
import { prisma } from "../src/repositories/prisma";

const filters = {
  fechaHoraInicio: "2025-12-01 00:00",
  fechaHoraFin: "2026-11-02 23:59",
};

async function main() {
  console.time("calidad-registro");
  const data = await calidadRegistroRepository.obtener(filters, "mes");
  console.timeEnd("calidad-registro");
  console.log({
    total: data.resumen.actual.total,
    evolucion: data.evolucion.length,
    tabla: data.tabla.length,
  });
  await prisma.$disconnect();
}

void main();
