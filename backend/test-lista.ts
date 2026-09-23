/**
 * Test rápido: qué devuelve getListaUnidadesNegocio y getUnidadesNegocioCombo
 */
import { config } from "dotenv";
config();
import { LocalbiClient } from "./src/integrations/localbi/client/LocalbiClient";

const client = new LocalbiClient();

async function main() {
  console.log("=== getUnidadesNegocioCombo ===");
  try {
    const combo = await client.getUnidadesNegocioCombo();
    const tipo = String(combo.tipo ?? "3");
    console.log(`tipo: ${tipo}, items: ${combo.data?.length ?? 0}`);
    // Show first 20
    for (const nombre of (combo.data ?? []).slice(0, 20)) {
      console.log(`  - "${nombre}"`);
    }
    // Search for "dariel" or "angelina" or "lorenzo"
    const nombres = combo.data ?? [];
    const searched = nombres.filter((n) => 
      n.toLowerCase().includes("dariel") || 
      n.toLowerCase().includes("angelina") || 
      n.toLowerCase().includes("lorenzo")
    );
    console.log(`\n  Búsqueda en lista: [${searched.join(", ")}]`);
  } catch (e: any) {
    console.log(`  ERROR: ${e.message}`);
  }

  console.log("\n=== getListaUnidadesNegocio (primeros 5) ===");
  try {
    const lista = await client.getListaUnidadesNegocio();
    const tipo = String(lista.tipo ?? "3");
    console.log(`tipo: ${tipo}, items: ${Array.isArray(lista.data) ? lista.data.length : "N/A"}`);
    if (Array.isArray(lista.data)) {
      for (const item of lista.data.slice(0, 5)) {
        console.log(`  - ${JSON.stringify(item).slice(0, 200)}`);
      }
    }
  } catch (e: any) {
    console.log(`  ERROR: ${e.message}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
