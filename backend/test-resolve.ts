/**
 * Test: resolver localbi_id → unidad de negocio
 */
import { config } from "dotenv";
config();
import { LocalbiClient } from "./src/integrations/localbi/client/LocalbiClient";

const client = new LocalbiClient();

async function main() {
  // Test 1: buscar "Dariel Fallas" en lista y ver la estructura completa
  console.log("=== getListaUnidadesNegocio: buscar Dariel Fallas ===");
  const lista = await client.getListaUnidadesNegocio();
  const data = lista.data as any[];
  const dariel = data?.find((u: any) => u.unidad_negocio === "Dariel Fallas");
  if (dariel) {
    console.log("ESTRUCTURA COMPLETA:");
    console.log(JSON.stringify(dariel, null, 2));
  } else {
    console.log("No encontrado en lista");
  }

  // Test 2: getHistoriaClinica de Dariel Fallas - ver estructura de locals
  console.log("\n=== getHistoriaClinica Dariel Fallas ===");
  const hist = await client.getHistoriaClinicaPorPath("Dariel Fallas");
  const histTipo = String(hist.tipo ?? "3");
  if (histTipo === "1" || histTipo === "2") {
    const ficha = hist.data;
    console.log("unidadnegocio_id:", ficha.unidadnegocio_id);
    console.log("unidadnegocio_nombre:", ficha.unidadnegocio_nombre);
    for (const dom of ficha.dominios ?? []) {
      console.log(`\nDominio: ${dom.dominio}`);
      for (const loc of dom.locales ?? []) {
        console.log(`  Local: ${loc.nombre}, localbi_id: ${loc.localbi_id}`);
      }
    }
  }

  // Test 3: Probar si getHistoriaClinica acepta localbi_id como parámetro
  console.log("\n=== Probar getHistoriaClinica con localbi_id ===");
  const testIds = ["8981-restaurant.pe-12831", "8995-restaurant.pe-12850"];
  for (const id of testIds) {
    try {
      const r = await client.getHistoriaClinicaPorPath(id);
      console.log(`  ${id}: tipo=${r.tipo}, data=${r.data ? "SI" : "NO"}`);
    } catch (e: any) {
      console.log(`  ${id}: ERROR - ${e.message}`);
    }
  }

  // Test 4: Probar getHistoriaClinicaPorBody con localbi_id
  console.log("\n=== Probar getHistoriaClinicaPorBody con localbi_id ===");
  for (const id of testIds) {
    try {
      const r = await client.getHistoriaClinicaPorBody(id);
      console.log(`  ${id}: tipo=${r.tipo}, data=${r.data ? "SI" : "NO"}`);
    } catch (e: any) {
      console.log(`  ${id}: ERROR - ${e.message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
