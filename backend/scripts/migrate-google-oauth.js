const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS google_oauth_tokens (
        id            SMALLINT PRIMARY KEY DEFAULT 1,
        access_token  TEXT NOT NULL,
        refresh_token TEXT,
        expiry_date   BIGINT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT google_oauth_tokens_single_row CHECK (id = 1)
      )
    `);
    console.log('Tabla google_oauth_tokens creada/verificada');

    await prisma.$executeRawUnsafe(`
      COMMENT ON TABLE google_oauth_tokens IS 'Tokens OAuth 2.0 de la cuenta central de Google Calendar (COPE)'
    `);

    await prisma.$executeRawUnsafe(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON google_oauth_tokens TO pgvector_user
    `);
    console.log('Permisos otorgados');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE agendas ADD COLUMN IF NOT EXISTS calendar_meet_link TEXT
    `);
    await prisma.$executeRawUnsafe(`
      COMMENT ON COLUMN agendas.calendar_meet_link IS 'URL de Google Meet asociada al evento de Calendar'
    `);
    console.log('Columna calendar_meet_link agregada/verificada');

    console.log('Migraciones completadas exitosamente');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
