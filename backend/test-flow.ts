/**
 * Script de diagnóstico completo — prueba el flujo completo sin auth.
 * Ejecutar desde la raíz del backend: npx tsx backend/test-flow.ts
 */
import { config } from "dotenv";
config();

import { LocalbiClient } from "./src/integrations/localbi/client/LocalbiClient";
import { buscarDominiosCandidatos } from "./src/repositories/dominioDiscovery.repository";
import { normalizeDomain } from "./src/domain/contacto/normalizacion";
import { prisma } from "./src/repositories/prisma";

const client = new LocalbiClient();

async function testBusquedaLocalBI(termino: string) {
  console.log(`\n--- LocalBI search: "${termino}" ---`);
  try {
    const resp = await client.getUnidadesNegocioBusqueda(termino, 1, 10);
    const tipo = String(resp.tipo ?? "3");
    console.log(`  tipo: ${tipo}, total: ${resp.totalRegistros}, units: ${resp.data?.length ?? 0}`);
    for (const u of resp.data ?? []) {
      console.log(`    - unidad_negocio: "${u.unidad_negocio}", nombre: "${u.nombre}"`);
    }
    return resp.data ?? [];
  } catch (e: any) {
    console.log(`  ERROR: ${e.message}`);
    return [];
  }
}

async function testHistoria(unidad: string) {
  console.log(`\n--- LocalBI historia: "${unidad}" ---`);
  try {
    const resp = await client.getHistoriaClinicaPorPath(unidad);
    const tipo = String(resp.tipo ?? "3");
    console.log(`  tipo: ${tipo}`);
    if (tipo === "1" || tipo === "2") {
      const f = resp.data;
      console.log(`  nombre: "${f.unidadnegocio_nombre}", segmento: "${f.segmento}"`);
      console.log(`  dominios (${f.dominios?.length ?? 0}):`);
      for (const dom of f.dominios ?? []) {
        console.log(`    - dominio: "${dom.dominio}", locales: ${dom.locales?.length ?? 0}`);
        for (const loc of dom.locales?.slice(0, 3) ?? []) {
          console.log(`      * local: "${loc.nombre}", id: "${loc.localbi_id}"`);
        }
      }
      return f;
    }
    console.log(`  mensajes: ${resp.mensajes?.join(", ")}`);
    return null;
  } catch (e: any) {
    console.log(`  ERROR: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log("========================================");
  console.log("  DIAGNÓSTICO COMPLETO DE BÚSQUEDA");
  console.log("========================================");

  // TEST 1: Discovery SQL
  console.log("\n\n=== PASO 1: Discovery SQL (v_unificado_norm) ===");
  for (const term of ["lorenzo", "angelina", "dariel", "Lorenzo Cafe"]) {
    const dominios = await buscarDominiosCandidatos(term);
    console.log(`  "${term}" → [${dominios.map((d) => d.dominio).join(", ")}]`);
  }

  // TEST 2: Normalización
  console.log("\n\n=== PASO 2: Normalización ===");
  for (const d of ["lorenzocafe.restaurant.pe", "angelinacafe.restaurant.pe", "lorenzocafe.restaurant.pe/"]) {
    const norm = normalizeDomain(d);
    const sub = norm.split(".")[0];
    console.log(`  "${d}" → norm="${norm}", subdominio="${sub}"`);
  }

  // TEST 3: LocalBI búsqueda directa
  console.log("\n\n=== PASO 3: LocalBI búsqueda directa ===");
  for (const term of ["lorenzo", "Lorenzo Cafe", "lorenzocafe", "Dariel Fallas", "angelina", "Angelina Cafe"]) {
    await testBusquedaLocalBI(term);
  }

  // TEST 4: LocalBI Historia Clínica
  console.log("\n\n=== PASO 4: LocalBI Historia Clínica ===");
  // Probemos con "Dariel Fallas" que es el nombre de la unidad que esperamos
  await testHistoria("Dariel Fallas");

  // TEST 5: Flujo completo resolverDominioAUnidad manual
  console.log("\n\n=== PASO 5: Flujo manual de resolución ===");
  const dominioPrueba = "lorenzocafe.restaurant.pe";
  const d = normalizeDomain(dominioPrueba);
  const subdominio = d.split(".")[0];
  console.log(`\nDominio: "${dominioPrueba}" → subdominio: "${subdominio}"`);

  // Paso 5a: buscar subdominio
  const unidades = await testBusquedaLocalBI(subdominio);

  // Paso 5b: si no hay, intentar separaciones
  if (unidades.length === 0) {
    console.log(`\n  Sin resultados para "${subdominio}", intentando separaciones...`);
    const consultas: string[] = [];
    for (let i = 2; i < subdominio.length - 1; i++) {
      const a = subdominio.slice(0, i);
      const b = subdominio.slice(i);
      if (a.length >= 2 && b.length >= 2) consultas.push(`${a} ${b}`);
    }
    console.log(`  Separaciones: [${consultas.join(", ")}]`);
    for (const q of consultas.slice(0, 5)) {
      await testBusquedaLocalBI(q);
    }
  }

  // Paso 5c: historia de candidatos
  if (unidades.length > 0) {
    for (const u of unidades.slice(0, 3)) {
      const ficha = await testHistoria(u.unidad_negocio);
      if (ficha) {
        const dominiosFicha = ficha.dominios?.map((x) => normalizeDomain(x.dominio)) ?? [];
        console.log(`  ¿Dominio "${d}" en ficha? ${dominiosFicha.includes(d)}`);
      }
    }
  }

  await prisma.$disconnect();
  console.log("\n\n=== FIN DEL DIAGNÓSTICO ===");
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await prisma.$disconnect();
  process.exit(1);
});
