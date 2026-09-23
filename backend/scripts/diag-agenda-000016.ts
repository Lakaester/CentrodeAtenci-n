import { prisma } from "../src/repositories/prisma";

async function main() {
  // 1. Query AGD-000016 by ticket field
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      id, ticket, tipo, asesor_nombre, asesor_correo,
      fecha, hora_inicio, hora_fin, estado,
      calendar_event_id,
      calendar_sync_status,
      calendar_sync_error,
      calendar_html_link,
      calendar_meet_link,
      created_at, updated_at, created_by, eliminado
    FROM agendas
    WHERE ticket = 'AGD-000016'
  `;

  console.log("=== AGD-000016 EN POSTGRESQL ===");
  if (rows.length === 0) {
    console.log("NO SE ENCONTRÓ la agenda con ticket='AGD-000016'");
    // Try partial match
    const partial = await prisma.$queryRaw<any[]>`
      SELECT id, ticket, estado, calendar_event_id, calendar_sync_status, eliminado
      FROM agendas WHERE ticket ILIKE '%000016%'
    `;
    console.log("Búsqueda parcial '%000016%':", JSON.stringify(partial));
  } else {
    const a = rows[0];
    console.log("id:", a.id);
    console.log("ticket:", a.ticket);
    console.log("tipo:", a.tipo);
    console.log("asesor_nombre:", a.asesor_nombre);
    console.log("asesor_correo:", a.asesor_correo);
    console.log("fecha:", a.fecha);
    console.log("hora_inicio:", a.hora_inicio);
    console.log("hora_fin:", a.hora_fin);
    console.log("estado:", a.estado);
    console.log("created_at:", a.created_at);
    console.log("updated_at:", a.updated_at);
    console.log("created_by:", a.created_by);
    console.log("eliminado:", a.eliminado);
    console.log("");
    console.log("--- CAMPOS GOOGLE CALENDAR ---");
    console.log("calendar_event_id:", JSON.stringify(a.calendar_event_id));
    console.log("calendar_sync_status:", JSON.stringify(a.calendar_sync_status));
    console.log("calendar_sync_error:", JSON.stringify(a.calendar_sync_error));
    console.log("calendar_html_link:", JSON.stringify(a.calendar_html_link));
    console.log("calendar_meet_link:", JSON.stringify(a.calendar_meet_link));
  }

  // 2. Check all agendas with similar ticket
  const allRows = await prisma.$queryRaw<any[]>`
    SELECT id, ticket, estado, calendar_event_id, calendar_sync_status, calendar_html_link, calendar_meet_link, eliminado
    FROM agendas
    WHERE ticket LIKE 'AGD-00001%'
    ORDER BY ticket
  `;
  console.log("\n=== AGENDAS CON ticket LIKE 'AGD-00001%' ===");
  allRows.forEach(r => console.log(`  ${r.ticket} | ${r.estado} | event_id=${r.calendar_event_id} | sync=${r.calendar_sync_status} | eliminado=${r.eliminado}`));

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
