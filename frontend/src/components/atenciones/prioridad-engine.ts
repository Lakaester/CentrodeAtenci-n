import type { Ticket } from "./types";

export interface PriorityScore {
  ticketId: string;
  puntos: number;
  maxPuntos: number;
  nivel: "critico" | "alto" | "medio" | "bajo";
  razones: { texto: string; puntos: number }[];
}

function parseMinutos(t: string): number {
  if (t === "—" || !t) return 0;
  const n = parseInt(t, 10);
  return isNaN(n) ? 0 : n;
}

export function calcularScore(ticket: Ticket): PriorityScore {
  let puntos = 0;
  const razones: { texto: string; puntos: number }[] = [];

  /* SLA vencido */
  if (ticket.sla === "rojo") {
    puntos += 50;
    razones.push({ texto: "SLA vencido", puntos: 50 });
  } else if (ticket.sla === "amarillo") {
    puntos += 20;
    razones.push({ texto: "SLA próximo a vencer", puntos: 20 });
  }

  /* Tipo cliente */
  if (ticket.tipoCliente === "high_touch") {
    puntos += 30;
    razones.push({ texto: "Cliente High Touch", puntos: 30 });
  } else if (ticket.tipoCliente === "tech_touch") {
    puntos += 10;
    razones.push({ texto: "Cliente Tech Touch", puntos: 10 });
  }

  /* Tiempo de espera */
  const esperaMin = parseMinutos(ticket.tiempoEsperando);
  if (esperaMin > 30) {
    puntos += 30;
    razones.push({ texto: `Espera superior al promedio (${ticket.tiempoEsperando})`, puntos: 30 });
  } else if (esperaMin > 10) {
    puntos += 20;
    razones.push({ texto: `Ticket esperando hace ${ticket.tiempoEsperando}`, puntos: 20 });
  } else if (esperaMin > 5) {
    puntos += 10;
    razones.push({ texto: `Ticket esperando hace ${ticket.tiempoEsperando}`, puntos: 10 });
  }

  /* Reincidencia */
  if (ticket.estado === "pendiente_cliente" || ticket.estado === "esperando_gestion") {
    puntos += 15;
    razones.push({ texto: "Cliente reincidente", puntos: 15 });
  }

  /* Ticket DEV relacionado */
  if (ticket.estado === "esperando_desarrollo") {
    puntos += 10;
    razones.push({ texto: "Esperando resolución DEV", puntos: 10 });
  }

  /* No leídos */
  if (ticket.noLeido > 2) {
    puntos += 10;
    razones.push({ texto: `${ticket.noLeido} mensajes sin leer`, puntos: 10 });
  }

  /* Canal */
  if (ticket.canal === "correo") {
    puntos += 5;
    razones.push({ texto: "Correo con menos de 2 horas para vencer", puntos: 5 });
  }

  const maxPuntos = 100;
  const nivel = puntos >= 80 ? "critico" : puntos >= 50 ? "alto" : puntos >= 20 ? "medio" : "bajo";

  return { ticketId: ticket.id, puntos: Math.min(puntos, maxPuntos), maxPuntos, nivel, razones };
}

export function mejorTicket(tickets: Ticket[]): { ticket: Ticket; score: PriorityScore } | null {
  const activos = tickets.filter((t) => t.estado !== "resuelto");
  if (activos.length === 0) return null;

  let mejor = activos[0];
  let mejorScore = calcularScore(mejor);

  for (let i = 1; i < activos.length; i++) {
    const s = calcularScore(activos[i]);
    if (s.puntos > mejorScore.puntos) {
      mejor = activos[i];
      mejorScore = s;
    }
  }

  return { ticket: mejor, score: mejorScore };
}

export const NIVEL_CONFIG = {
  critico: { icono: "🔥", label: "Atención crítica", color: "text-danger bg-danger-5 border-rose-200" },
  alto: { icono: "⚠", label: "Próximo a vencer", color: "text-warning bg-warning-5 border-amber-200" },
  medio: { icono: "⭐", label: "Cliente prioritario", color: "text-aqua bg-aqua-5 border-sky-200" },
  bajo: { icono: "", label: "Prioridad normal", color: "text-black-65 bg-black-5 border-slate-200" },
} as const;
