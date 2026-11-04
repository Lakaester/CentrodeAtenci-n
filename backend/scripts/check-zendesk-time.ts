import "dotenv/config";
import { prisma } from "../src/repositories/prisma";

interface Fila {
  tickets_id: number;
  tickets_created_at: Date;
  fecha_reporte: Date;
}

interface ZendeskTicketApi {
  ticket?: {
    id: number;
    created_at: string;
    updated_at: string;
    subject?: string;
  };
  error?: string;
}

async function main() {
  const subdomain = process.env.ZENDESK_SUBDOMAIN;
  const email = process.env.ZENDESK_EMAIL;
  const token = process.env.ZENDESK_API_TOKEN;
  console.log("Zendesk configurado:", Boolean(subdomain && email && token));
  if (!subdomain || !email || !token) {
    throw new Error("Faltan ZENDESK_SUBDOMAIN / ZENDESK_EMAIL / ZENDESK_API_TOKEN");
  }

  const filas = (await prisma.$queryRaw`
    SELECT tickets_id, tickets_created_at, fecha_reporte
    FROM public."Categorización_zendesk"
    ORDER BY tickets_created_at DESC
    LIMIT 5
  `) as Fila[];

  const auth = Buffer.from(`${email}/token:${token}`).toString("base64");
  for (const fila of filas) {
    const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${fila.tickets_id}.json`;
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });
    const body = (await res.json().catch(() => ({}))) as ZendeskTicketApi;
    console.log("\nTicket", fila.tickets_id, "HTTP", res.status);
    console.log("  DB tickets_created_at:", fila.tickets_created_at.toISOString());
    console.log("  DB fecha_reporte:      ", fila.fecha_reporte.toISOString());
    console.log("  API created_at:       ", body.ticket?.created_at ?? body.error ?? "sin dato");
  }

  await prisma.$disconnect();
}

void main();
