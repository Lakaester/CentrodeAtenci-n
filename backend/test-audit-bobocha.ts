/**
 * Auditoría: inspeccionar payload real de LocalBI para "Bobocha"
 */
import { config } from "dotenv";
config();

import { LocalbiClient } from "./src/integrations/localbi/client/LocalbiClient";

const client = new LocalbiClient();

async function main() {
  console.log("=== PASO 1: Buscar \"Bobocha\" en LocalBI ===");
  const search = await client.getUnidadesNegocioBusqueda("Bobocha", 1, 10);
  console.log(`tipo: ${search.tipo}, total: ${search.totalRegistros}`);
  for (const u of search.data ?? []) {
    console.log(`  unidad_negocio: "${u.unidad_negocio}", nombre: "${u.nombre}"`);
  }

  // Tomar la primera unidad encontrada
  const unidad = search.data?.[0]?.unidad_negocio;
  if (!unidad) {
    console.log("No se encontró ninguna unidad para Bobocha");
    return;
  }

  console.log(`\n=== PASO 2: Historia Clínica de "${unidad}" ===`);
  const hist = await client.getHistoriaClinicaPorPath(unidad);
  const tipo = String(hist.tipo ?? "3");
  console.log(`tipo: ${tipo}`);

  if (tipo !== "1" && tipo !== "2") {
    console.log(`Mensajes: ${hist.mensajes?.join(", ")}`);
    return;
  }

  const ficha = hist.data;
  console.log(`unidadnegocio_id: "${ficha.unidadnegocio_id}"`);
  console.log(`unidadnegocio_nombre: "${ficha.unidadnegocio_nombre}"`);
  console.log(`segmento: "${ficha.segmento}"`);
  console.log(`dominios: ${ficha.dominios?.length ?? 0}`);

  for (const dom of ficha.dominios ?? []) {
    console.log(`\n  --- Dominio: "${dom.dominio}" ---`);
    console.log(`  locales: ${dom.locales?.length ?? 0}`);
    for (const loc of dom.locales ?? []) {
      console.log(`    localbi_id: "${loc.localbi_id}"`);
      console.log(`    nombre: "${loc.nombre}"`);
      console.log(`    link_dominio: "${loc.link_dominio}"`);
      console.log(`    ciudad: "${loc.ciudad}"`);
      console.log(`    pais: "${loc.pais}"`);
      console.log(`    estado: "${loc.estado}"`);
      console.log(`    plan: "${loc.plan}"`);
      console.log(`    ---`);
    }
  }

  // También imprimir el JSON completo para inspección
  console.log("\n=== PAYLOAD COMPLETO (data) ===");
  console.log(JSON.stringify(ficha, null, 2));
}

main().catch(async (e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
