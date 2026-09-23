/**
 * Test: verificar si localbi_id de v_unificado_norm permite encontrar la unidad
 */
import { config } from "dotenv";
config();
import { prisma } from "./src/repositories/prisma";
import { LocalbiClient } from "./src/integrations/localbi/client/LocalbiClient";

const client = new LocalbiClient();

async function main() {
  // 1. Encontrar localbi_id para lorenzocafe.restaurant.pe
  console.log("=== v_unificado_norm: lorenzocafe.restaurant.pe ===");
  const rows = await prisma.$queryRaw<{ dominio: string; localbi_id: string }[]>`
    SELECT DISTINCT dominio, localbi_id 
    FROM public.v_unificado_norm 
    WHERE dominio = 'lorenzocafe.restaurant.pe' AND localbi_id IS NOT NULL
    LIMIT 10
  `;
  console.log("Rows:", rows);

  // 2. Probar buscar con localbi_id
  if (rows.length > 0) {
    const localbiId = rows[0].localbi_id;
    console.log(`\nBuscando LocalBI con localbi_id: "${localbiId}"`);
    const resp = await client.getUnidadesNegocioBusqueda(localbiId, 1, 10);
    console.log(`tipo: ${resp.tipo}, total: ${resp.totalRegistros}, units: ${resp.data?.length ?? 0}`);
    for (const u of resp.data ?? []) {
      console.log(`  - unidad: "${u.unidad_negocio}", nombre: "${u.nombre}"`);
    }

    // 3. Probar con la primera parte del localbi_id
    const parte1 = localbiId.split("-")[0];
    console.log(`\nBuscando LocalBI con "${parte1}":`);
    const resp2 = await client.getUnidadesNegocioBusqueda(parte1, 1, 10);
    console.log(`tipo: ${resp2.tipo}, total: ${resp2.totalRegistros}, units: ${resp2.data?.length ?? 0}`);
    for (const u of resp2.data ?? []) {
      console.log(`  - unidad: "${u.unidad_negocio}", nombre: "${u.nombre}"`);
    }
  }

  // 4. Verificar getListaUnidadesNegocio y buscar por.localbi_id  
  console.log("\n=== getListaUnidadesNegocio: buscar 'Dariel' ===");
  const lista = await client.getListaUnidadesNegocio();
  const listaData = lista.data as any[];
  const dariel = listaData?.filter((u: any) => 
    u.unidad_negocio?.toLowerCase().includes("dariel") ||
    u.nombre?.toLowerCase().includes("dariel")
  );
  console.log(`Encontrados: ${dariel?.length ?? 0}`);
  for (const u of dariel ?? []) {
    console.log(`  - unidad: "${u.unidad_negocio}", nombre: "${u.nombre}", locales: ${u.total_locales}`);
  }

  // 5. Verificar: buscar en lista por "angelina"  
  console.log("\n=== getListaUnidadesNegocio: buscar 'angelina' ===");
  const angelina = listaData?.filter((u: any) => 
    u.unidad_negocio?.toLowerCase().includes("angelina") ||
    u.nombre?.toLowerCase().includes("angelina")
  );
  console.log(`Encontrados: ${angelina?.length ?? 0}`);
  for (const u of angelina ?? []) {
    console.log(`  - unidad: "${u.unidad_negocio}", nombre: "${u.nombre}"`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
