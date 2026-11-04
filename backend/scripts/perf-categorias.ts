import "dotenv/config";
import { prisma } from "../src/repositories/prisma";
import { unificadoRepository } from "../src/repositories/unificado.repository";

async function main() {
  for (let i = 1; i <= 3; i++) {
    const t = Date.now();
    const r = await unificadoRepository.categoriasV2({});
    console.log(`run ${i}: ${Date.now() - t} ms | total=${r.universo.total} | jerarquia=${r.jerarquia.length} | asesor=${r.asesorDetalle.length}`);
  }
  await prisma.$disconnect();
}
void main();
