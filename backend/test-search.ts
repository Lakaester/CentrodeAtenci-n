/**
 * Script temporal de debug — prueba el flujo completo de buscarUnidades.
 * Ejecutar: npx tsx backend/test-search.ts
 */
import { buscarDominiosCandidatos } from "./src/repositories/dominioDiscovery.repository";
import { normalizeDomain, isValidDomainFormat } from "./src/domain/contacto/normalizacion";
import { prisma } from "./src/repositories/prisma";

const dominio = "lorenzocafe.restaurant.pe";

async function main() {
  console.log("=== TEST 1: Discovery SQL para 'lorenzo' ===");
  const dominios = await buscarDominiosCandidatos("lorenzo");
  console.log("Dominios encontrados:", dominios);
  console.log("");

  console.log("=== TEST 2: Normalización ===");
  const d = normalizeDomain(dominio);
  console.log(`normalizeDomain("${dominio}") = "${d}"`);
  console.log(`isValidDomainFormat("${d}") = ${isValidDomainFormat(d)}`);
  const subdominio = d.split(".")[0];
  console.log(`subdominio = "${subdominio}"`);
  console.log("");

  console.log("=== TEST 3: Buscar 'lorenzo' en v_unificado_norm ===");
  const rows = await prisma.$queryRaw<{ dominio: string; count: bigint }[]>`
    SELECT dominio, COUNT(*)::bigint as count
    FROM public.v_unificado_norm
    WHERE dominio ILIKE '%lorenzo%'
    GROUP BY dominio
  `;
  console.log("Rows:", rows);
  console.log("");

  console.log("=== TEST 4: Buscar 'angelina' en v_unificado_norm ===");
  const rows2 = await prisma.$queryRaw<{ dominio: string; count: bigint }[]>`
    SELECT dominio, COUNT(*)::bigint as count
    FROM public.v_unificado_norm
    WHERE dominio ILIKE '%angelina%'
    GROUP BY dominio
  `;
  console.log("Rows:", rows2);
  console.log("");

  console.log("=== TEST 5: Buscar 'dariel' en v_unificado_norm ===");
  const rows3 = await prisma.$queryRaw<{ dominio: string; count: bigint }[]>`
    SELECT dominio, COUNT(*)::bigint as count
    FROM public.v_unificado_norm
    WHERE dominio ILIKE '%dariel%'
    GROUP BY dominio
  `;
  console.log("Rows:", rows3);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
