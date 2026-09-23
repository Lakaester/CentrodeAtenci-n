const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE agendas ADD COLUMN IF NOT EXISTS calendar_html_link TEXT
    `);
    await prisma.$executeRawUnsafe(`
      COMMENT ON COLUMN agendas.calendar_html_link IS 'URL real devuelta por Google Calendar API (htmlLink)'
    `);
    console.log('Columna calendar_html_link agregada/verificada');
    console.log('Migracion completada exitosamente');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
