/**
 * CustomerMemoryMigrator — Migración única desde v_unificado_norm
 * Al ejecutarse, lee la vista unificada y crea los registros en clientes_cope.json
 * con los datos históricos de cada cliente (correo, dominio, categorías, etc.).
 */
import { prisma } from "../../repositories/prisma";
import { CustomerMemory } from "./CustomerMemory";
import * as fs from "fs";
import * as path from "path";

const MIGRATION_FLAG_PATH = path.join(__dirname, "..", "..", "..", "data", ".migracion_cope_010");

function migracionYaEjecutada(): boolean {
  try {
    return fs.existsSync(MIGRATION_FLAG_PATH);
  } catch {
    return false;
  }
}

function marcarMigracionCompletada(): void {
  try {
    fs.writeFileSync(MIGRATION_FLAG_PATH, new Date().toISOString(), "utf-8");
  } catch (err) {
    console.error("[CustomerMemory] No se pudo marcar migración:", err);
  }
}

interface FilaCliente {
  contacto: string;
  dominio: string | null;
  canal: string;
  categoria: string | null;
  subcategoria: string | null;
  total: number;
}

export async function ejecutarMigracion(): Promise<void> {
  if (migracionYaEjecutada()) {
    console.log("[CustomerMemory] Migración ya ejecutada anteriormente. Omitiendo.");
    return;
  }

  console.log("[CustomerMemory] Iniciando migración desde v_unificado_norm...");
  const inicio = Date.now();

  try {
    // Get all unique contacts with their associated data
    const filas = await prisma.$queryRaw<FilaCliente[]>`
      SELECT
        COALESCE(NULLIF(TRIM(contacto), ''), 'Sin contacto') AS contacto,
        NULLIF(TRIM(dominio), '') AS dominio,
        CASE
          WHEN canal ILIKE '%what%' THEN 'whatsapp'
          WHEN canal ILIKE '%zendesk%' OR canal ILIKE '%correo%' THEN 'correo'
          ELSE 'otro'
        END AS canal,
        NULLIF(TRIM(REPLACE(categoria, '_', ' ')), '') AS categoria,
        NULLIF(TRIM(REPLACE(subcategoria, '_', ' ')), '') AS subcategoria,
        COUNT(*)::int AS total
      FROM public.v_unificado_norm
      WHERE contacto IS NOT NULL
        AND TRIM(contacto) <> ''
        AND contacto NOT LIKE '%@%'  -- Only email-like contacts
      GROUP BY contacto, dominio, canal, categoria, subcategoria
      ORDER BY total DESC
    `;

    // Count contacts without email (we'll skip them)
    const contactosSinCorreo = filas.filter((f) => !f.contacto.includes("@"));
    const contactosConCorreo = filas.filter((f) => f.contacto.includes("@"));

    console.log(`[CustomerMemory] ${contactosConCorreo.length} contactos con email, ${contactosSinCorreo.length} sin email`);

    // Group by email
    const grupos = new Map<string, {
      nombre: string;
      dominios: Set<string>;
      categorias: Set<string>;
      subcategorias: Set<string>;
      totalTickets: number;
      canales: Set<string>;
    }>();

    for (const f of contactosConCorreo) {
      const email = f.contacto.trim().toLowerCase();
      if (!grupos.has(email)) {
        grupos.set(email, {
          nombre: email.split("@")[0],
          dominios: new Set(),
          categorias: new Set(),
          subcategorias: new Set(),
          totalTickets: 0,
          canales: new Set(),
        });
      }
      const g = grupos.get(email)!;
      if (f.dominio) g.dominios.add(f.dominio);
      if (f.categoria) g.categorias.add(f.categoria);
      if (f.subcategoria) g.subcategorias.add(f.subcategoria);
      g.totalTickets += f.total;
      if (f.canal) g.canales.add(f.canal);
    }

    // Create each client in CustomerMemory
    let creados = 0;
    for (const [email, data] of grupos) {
      const cliente = CustomerMemory.obtenerOCrear(email, data.nombre);
      CustomerMemory.actualizar(cliente.id, {
        dominios: [...data.dominios],
        categorias: [...data.categorias],
        subcategorias: [...data.subcategorias],
        totalTickets: data.totalTickets,
      });
      // Register each domain
      for (const d of data.dominios) {
        CustomerMemory.vincularDominio(email, d);
      }
      // Register each category
      for (const cat of data.categorias) {
        for (const sub of data.subcategorias) {
          CustomerMemory.registrarCategoria(email, cat, sub);
        }
      }
      creados++;
    }

    marcarMigracionCompletada();
    const duracion = Date.now() - inicio;
    console.log(`[CustomerMemory] Migración completada: ${creados} clientes creados en ${duracion}ms`);
  } catch (err) {
    console.error("[CustomerMemory] Error durante migración:", err);
  }
}
