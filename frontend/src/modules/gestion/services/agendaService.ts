import type { Agenda, AgendaKpis, CrearAgendaInput, ActualizarAgendaInput } from "../types";
import { api as http } from "@/lib/api";

const BASE = "/api/gestion/agendas";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET") as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  const data = init?.body ? JSON.parse(String(init.body)) : undefined;
  try {
    const res = await http.request({ url: `${BASE}${path}`, method, data });
    return res.data as T;
  } catch (err: any) {
    const msg = err?.response?.data?.error || (err?.response ? `HTTP ${err.response.status}` : err?.message || "Error de red");
    throw new Error(msg);
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  return entries.length > 0 ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : "";
}

export const agendaService = {
  async listar(filtros: Record<string, string | number | undefined>): Promise<{ data: Agenda[]; total: number }> {
    return api(qs(filtros));
  },

  async detalle(id: string): Promise<{ data: Agenda }> {
    return api(`/${id}`);
  },

  async kpis(): Promise<{ data: AgendaKpis }> {
    return api("/kpis");
  },

  async crear(input: CrearAgendaInput): Promise<{ data: Agenda }> {
    return api("", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async actualizar(id: string, input: ActualizarAgendaInput): Promise<{ data: Agenda }> {
    return api(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async actualizarEstado(id: string, estado: string): Promise<{ data: Agenda }> {
    return api(`/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  },

  async eliminar(id: string): Promise<{ ok: boolean }> {
    return api(`/${id}`, { method: "DELETE" });
  },

  async porRangoFecha(desde: string, hasta: string): Promise<{ data: Agenda[] }> {
    return api(`/rango?desde=${desde}&hasta=${hasta}`);
  },

  async registrarInicioReal(id: string, hora: string): Promise<{ data: Agenda }> {
    return api(`/${id}/inicio-real`, {
      method: "PATCH",
      body: JSON.stringify({ hora }),
    });
  },

  async registrarFinReal(id: string, hora: string): Promise<{ data: Agenda }> {
    return api(`/${id}/fin-real`, {
      method: "PATCH",
      body: JSON.stringify({ hora }),
    });
  },

  async setResultado(id: string, resultado: string | null): Promise<{ data: Agenda }> {
    return api(`/${id}/resultado`, {
      method: "PATCH",
      body: JSON.stringify({ resultado }),
    });
  },

  async guardarActa(id: string, contenido: any, estado: string): Promise<{ data: Agenda }> {
    return api(`/${id}/acta`, {
      method: "PATCH",
      body: JSON.stringify({ contenido, estado }),
    });
  },

  async sincronizarCalendar(id: string): Promise<{ data: { action: string; eventId: string; htmlLink: string; meetLink?: string } }> {
    return api(`/${id}/sync-calendar`, {
      method: "POST",
    });
  },

  async reintentarSyncCalendar(id: string): Promise<{ data: { action: string; eventId: string; htmlLink: string; meetLink?: string } }> {
    return api(`/${id}/retry-sync-calendar`, {
      method: "POST",
    });
  },

  // ── Google Calendar OAuth ──

  async googleCalendarStatus(): Promise<{ data: { configured: boolean; connected: boolean } }> {
    const res = await fetch("/api/gestion/google-calendar/status", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async googleCalendarConnect(): Promise<{ data: { authUrl: string } }> {
    const res = await fetch("/api/gestion/google-calendar/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async googleCalendarDisconnect(): Promise<{ ok: boolean }> {
    const res = await fetch("/api/gestion/google-calendar/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async googleCalendarInfo(): Promise<{ data: { calendarId: string; timezone: string; summary?: string; description?: string; accessRole?: string } }> {
    const res = await fetch("/api/gestion/google-calendar/info", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async verificarDisponibilidad(desde: string, hasta: string): Promise<{ data: { busy: { start: string; end: string }[] } }> {
    const res = await fetch(`/api/gestion/google-calendar/disponibilidad?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async reconciliarAgenda(id: string): Promise<{ data: { action: string } }> {
    const res = await fetch(`/api/gestion/agendas/${id}/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async exportar(filtros: Record<string, string | undefined>): Promise<{ blob: Blob; nombre: string; total: number }> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetch(`/api/gestion/agendas/exportar?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const nombre = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "Agendas.xlsx";
    const total = Number(res.headers.get("X-Export-Total") ?? "0");
    const blob = await res.blob();
    return { blob, nombre, total };
  },
};
