const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function ejecutar() {
  const bloques = [

    // =========================================================
    // 1. CATEGORÍAS
    // =========================================================
    `
    CREATE TABLE IF NOT EXISTS facturacion_categorias (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      orden INT NOT NULL DEFAULT 0,
      es_interno BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_categorias_activo
    ON facturacion_categorias (activo, orden)
    `,

    `
    INSERT INTO facturacion_categorias
      (id, nombre, activo, orden, es_interno)
    VALUES
      ('cat-facturacion-electronica', 'Facturación electrónica', TRUE, 10, TRUE),
      ('cat-otro', 'Otro', TRUE, 20, FALSE)
    ON CONFLICT (nombre) DO NOTHING
    `,

    // =========================================================
    // 2. RELACIÓN CATEGORÍA → SUBCATEGORÍA
    // =========================================================
    `
    ALTER TABLE facturacion_subcategorias
    ADD COLUMN IF NOT EXISTS categoria_id TEXT
    `,

    // =========================================================
    // 3. CASOS
    // =========================================================
    `
    CREATE TABLE IF NOT EXISTS facturacion_casos (
      id TEXT PRIMARY KEY,
      dominio TEXT NOT NULL UNIQUE,
      ruc TEXT,
      proveedor TEXT,
      unidad_negocio_id TEXT,
      cliente_nombre TEXT,

      estado_operativo TEXT NOT NULL DEFAULT 'PENDIENTE',

      categoria_id TEXT,
      subcategoria_id TEXT,

      facturas_iniciales INTEGER,
      boletas_iniciales INTEGER,
      total_inicial INTEGER,

      ultimas_facturas INTEGER,
      ultimas_boletas INTEGER,
      ultimo_total INTEGER,

      primera_deteccion TIMESTAMPTZ NOT NULL DEFAULT now(),
      ultima_deteccion TIMESTAMPTZ NOT NULL DEFAULT now(),

      asesor_actual TEXT,
      fecha_asignacion TIMESTAMPTZ,
      asignado_por TEXT,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_casos_estado
    ON facturacion_casos (estado_operativo)
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_casos_asesor
    ON facturacion_casos (asesor_actual)
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_casos_ultima_deteccion
    ON facturacion_casos (ultima_deteccion)
    `,

    // =========================================================
    // 4. FK CATEGORÍA
    // =========================================================
    `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_facturacion_casos_categoria'
      ) THEN
        ALTER TABLE facturacion_casos
        ADD CONSTRAINT fk_facturacion_casos_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES facturacion_categorias(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
    `,

    // =========================================================
    // 5. FK SUBCATEGORÍA
    // =========================================================
    `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_facturacion_casos_subcategoria'
      ) THEN
        ALTER TABLE facturacion_casos
        ADD CONSTRAINT fk_facturacion_casos_subcategoria
        FOREIGN KEY (subcategoria_id)
        REFERENCES facturacion_subcategorias(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
    `,

    // =========================================================
    // 6. SNAPSHOTS HISTÓRICOS
    // =========================================================
    `
    CREATE TABLE IF NOT EXISTS facturacion_caso_snapshots (
      id TEXT PRIMARY KEY,
      caso_id TEXT NOT NULL
        REFERENCES facturacion_casos(id)
        ON DELETE CASCADE,

      fecha_snapshot DATE NOT NULL DEFAULT CURRENT_DATE,

      facturas INTEGER,
      boletas INTEGER,
      total INTEGER,

      origen TEXT NOT NULL DEFAULT 'MANUAL',

      created_by TEXT,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (caso_id, fecha_snapshot)
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_caso_snapshots_caso
    ON facturacion_caso_snapshots (caso_id, fecha_snapshot)
    `,

    // =========================================================
    // 7. HISTORIAL DE ASIGNACIONES
    // =========================================================
    `
    CREATE TABLE IF NOT EXISTS facturacion_caso_asignaciones (
      id TEXT PRIMARY KEY,

      caso_id TEXT NOT NULL
        REFERENCES facturacion_casos(id)
        ON DELETE CASCADE,

      asesor TEXT NOT NULL,
      asignado_por TEXT,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_caso_asignaciones_caso
    ON facturacion_caso_asignaciones (caso_id, created_at)
    `,

    // =========================================================
    // 8. RELACIÓN CASO ↔ INTERVENCIÓN
    // =========================================================
    `
    CREATE TABLE IF NOT EXISTS facturacion_caso_intervenciones (
      id TEXT PRIMARY KEY,

      caso_id TEXT NOT NULL
        REFERENCES facturacion_casos(id)
        ON DELETE CASCADE,

      intervencion_id TEXT NOT NULL
        REFERENCES facturacion_intervenciones(id)
        ON DELETE CASCADE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (caso_id, intervencion_id)
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_caso_intervenciones_caso
    ON facturacion_caso_intervenciones (caso_id)
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_caso_intervenciones_interv
    ON facturacion_caso_intervenciones (intervencion_id)
    `,

    // =========================================================
    // 9. CASO_ID DIRECTO EN INTERVENCIONES
    // =========================================================
    `
    ALTER TABLE facturacion_intervenciones
    ADD COLUMN IF NOT EXISTS caso_id TEXT
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_intervenciones_caso
    ON facturacion_intervenciones (caso_id)
    `,

    `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_facturacion_intervenciones_caso'
      ) THEN
        ALTER TABLE facturacion_intervenciones
        ADD CONSTRAINT fk_facturacion_intervenciones_caso
        FOREIGN KEY (caso_id)
        REFERENCES facturacion_casos(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
    `,

    // =========================================================
    // 10. AUDITORÍA
    // =========================================================
    `
    CREATE TABLE IF NOT EXISTS facturacion_auditoria (
      id TEXT PRIMARY KEY,

      entidad TEXT NOT NULL,
      entidad_id TEXT,

      accion TEXT NOT NULL,

      asesor TEXT,

      detalle TEXT,

      valor_anterior TEXT,
      valor_nuevo TEXT,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_auditoria_entidad
    ON facturacion_auditoria (entidad, entidad_id)
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_facturacion_auditoria_fecha
    ON facturacion_auditoria (created_at)
    `,

    // =========================================================
    // 11. PERMISOS
    // =========================================================
    `
    INSERT INTO cope_permisos
      (id, modulo, accion, rol_id, permitido)

    SELECT
      'perm-control-facturacion-' || accion,
      'Control de Facturación',
      accion,
      'rol-admin',
      TRUE

    FROM (
      VALUES
        ('ver'),
        ('crear'),
        ('editar'),
        ('eliminar'),
        ('exportar'),
        ('administrar')
    ) AS v(accion)

    WHERE EXISTS (
      SELECT 1
      FROM cope_roles
      WHERE id = 'rol-admin'
    )

    ON CONFLICT (modulo, accion, rol_id)
    DO UPDATE SET
      permitido = TRUE,
      updated_at = now()
    `
  ];

  let ok = 0;
  let errores = 0;

  console.log("");
  console.log("==============================================");
  console.log(" CONTROL DE FACTURACIÓN - FASE 1");
  console.log(" Migración de motor histórico");
  console.log("==============================================");
  console.log("");

  for (let i = 0; i < bloques.length; i++) {
    try {
      await prisma.$executeRawUnsafe(bloques[i]);
      ok++;
      console.log(`OK  Bloque ${i + 1}/${bloques.length}`);
    } catch (error) {
      errores++;
      console.error(`ERROR Bloque ${i + 1}:`);
      console.error(error.message);
    }
  }

  console.log("");
  console.log("==============================================");
  console.log(" VERIFICACIÓN");
  console.log("==============================================");
  console.log("");

  const tablas = [
    "facturacion_categorias",
    "facturacion_casos",
    "facturacion_caso_snapshots",
    "facturacion_caso_asignaciones",
    "facturacion_caso_intervenciones",
    "facturacion_auditoria"
  ];

  for (const tabla of tablas) {
    const resultado = await prisma.$queryRawUnsafe(`
      SELECT to_regclass('public.${tabla}')::text AS tabla
    `);

    console.log(
      `TABLA ${tabla}:`,
      resultado[0].tabla || "FALTA"
    );
  }

  const columnaCaso = await prisma.$queryRawUnsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'facturacion_intervenciones'
      AND column_name = 'caso_id'
  `);

  console.log(
    "COLUMNA facturacion_intervenciones.caso_id:",
    columnaCaso.length ? "OK" : "FALTA"
  );

  const permisos = await prisma.$queryRawUnsafe(`
    SELECT accion
    FROM cope_permisos
    WHERE rol_id = 'rol-admin'
      AND modulo = 'Control de Facturación'
    ORDER BY accion
  `);

  console.log(
    "PERMISOS:",
    permisos.length
      ? permisos.map(x => x.accion).join(", ")
      : "NO ENCONTRADOS"
  );

  console.log("");
  console.log("==============================================");
  console.log(`RESULTADO: ${ok} bloques OK / ${errores} errores`);
  console.log("==============================================");
  console.log("");

  await prisma.$disconnect();

  if (errores > 0) {
    process.exit(1);
  }
}

ejecutar().catch(async (error) => {
  console.error("");
  console.error("ERROR FATAL:");
  console.error(error);

  await prisma.$disconnect();
  process.exit(1);
});