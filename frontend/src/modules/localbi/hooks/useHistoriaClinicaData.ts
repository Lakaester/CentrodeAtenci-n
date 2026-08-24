/**
 * useHistoriaClinicaData — hook compartido que centraliza la carga y derivación
 * de los datos de la ficha del cliente/unidad (LocalBI + actividad + soporte).
 *
 * Lo consumen los componentes de sección del Panel Operativo y la vista
 * completa (HistoriaClinicaView), de modo que la computación vive en UN solo
 * lugar y React Query evita duplicar peticiones de red (query keys estables).
 */
import { useState } from "react";
import {
  useHistoriaClinica,
  useActividadCliente,
  useSoporteOnline,
  useActividadLocal,
} from "./useHistoriaClinica";
import type { LocalbiHistoriaClinica, ActividadDominio } from "../types/localbi";
import { nombreLocal, fmtFecha } from "../components/HistoriaClinicaUI";

export interface FichaEvento {
  fecha: string;
  area: string;
  titulo: string;
  detalle: string | null;
  estado: string | null;
}

export type FichaStatus =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "not_configured"; mensaje: string }
  | { kind: "unavailable"; mensaje: string }
  | { kind: "error"; mensaje: string }
  | { kind: "ready" };

export function useHistoriaClinicaData(unidadNegocio: string) {
  const { data, isLoading, isFetching, refetch } = useHistoriaClinica(unidadNegocio);
  const [periodoInc, setPeriodoInc] = useState<string>("90");
  const [localSeleccionado, setLocalSeleccionado] = useState<string | null>(null);
  const [localesOpen, setLocalesOpen] = useState(false);

  const fichaData = data?.status === "success" || data?.status === "warning"
    ? (data.data as LocalbiHistoriaClinica)
    : null;

  const dominiosDeLaFicha = fichaData?.dominios?.map((d) => d.dominio) ?? [];
  const localbiIdsDeLaFicha = fichaData?.dominios?.flatMap((d) => (d.locales ?? []).map((l) => l.localbi_id)) ?? [];

  const { data: actividadData, isLoading: actividadLoading } = useActividadCliente(dominiosDeLaFicha);
  const { data: soporteData, isLoading: soporteLoading } = useSoporteOnline(dominiosDeLaFicha, periodoInc);
  const { data: actividadLocalData, isLoading: actividadLocalLoading } = useActividadLocal(localbiIdsDeLaFicha);

  // Estado de la ficha normalizado.
  let status: FichaStatus;
  if (isLoading) {
    status = { kind: "loading" };
  } else if (!data) {
    status = { kind: "empty" };
  } else if (data.status === "not_configured") {
    status = { kind: "not_configured", mensaje: "Historia del cliente no disponible: falta configurar la credencial de LocalBI." };
  } else if (data.status === "unavailable") {
    status = { kind: "unavailable", mensaje: data.mensaje ?? "Historia del cliente no disponible" };
  } else if (data.status === "error") {
    status = { kind: "error", mensaje: data.mensajes?.join(" · ") ?? "Error al cargar la Historia del cliente" };
  } else {
    status = { kind: "ready" };
  }

  const ficha = fichaData as LocalbiHistoriaClinica | null;
  const locales = ficha
    ? ficha.dominios.flatMap((d) => d.locales.map((l) => ({ ...l, dominio: d.dominio })))
    : [];
  const tickets = locales.flatMap((l) => l.tickets);
  const tareasSueltas = locales.flatMap((l) => l.tareas_sueltas ?? []);
  const npsResumen = ficha?.resumen?.nps;

  // Mapa dominio → actividad de COPE (v_unificado_norm).
  const actividadPorDominio = new Map<string, ActividadDominio>((actividadData ?? []).map((a) => [a.dominio, a]));
  const actividadTotal = (actividadData ?? []).reduce((acc, a) => acc + a.resumen.total, 0);
  const actividadCanales = new Map<string, number>();
  for (const a of actividadData ?? []) {
    for (const c of a.resumen.canales) actividadCanales.set(c.nombre, (actividadCanales.get(c.nombre) ?? 0) + c.cantidad);
  }
  const actividadOrdenada = [...actividadCanales.entries()].sort((x, y) => y[1] - x[1]);

  // Soporte en Línea (incidencias).
  const soporteTotal = soporteData?.totalIncidencias ?? 0;
  const soporteAbiertas = (soporteData?.porDominio ?? []).reduce((acc, d) => acc + d.resumen.abiertas, 0);
  const soporteCategorias = new Map<string, number>();
  for (const d of soporteData?.porDominio ?? []) {
    for (const c of d.resumen.categorias) soporteCategorias.set(c.nombre, (soporteCategorias.get(c.nombre) ?? 0) + c.cantidad);
  }
  const soporteCategoriasOrdenadas = [...soporteCategorias.entries()].sort((x, y) => y[1] - x[1]);
  const soportePromEspera = (() => {
    const con = (soporteData?.porDominio ?? []).filter((d) => d.resumen.prom_espera_min != null);
    return con.length ? Math.round(con.reduce((a, d) => a + (d.resumen.prom_espera_min ?? 0), 0) / con.length) : null;
  })();
  const soportePromSolucion = (() => {
    const con = (soporteData?.porDominio ?? []).filter((d) => d.resumen.prom_solucion_min != null);
    return con.length ? Math.round(con.reduce((a, d) => a + (d.resumen.prom_solucion_min ?? 0), 0) / con.length) : null;
  })();

  // Historial Transversal: incidencias + actividad COPE + tickets, ordenado por fecha.
  const eventosTransversales: FichaEvento[] = (() => {
    const eventos: FichaEvento[] = [];

    for (const d of soporteData?.porDominio ?? []) {
      for (const inc of d.ultimasIncidencias) {
        eventos.push({
          fecha: inc.ticket_timestamp,
          area: "Soporte en Línea",
          titulo: inc.tipoproblema || "Incidencia",
          detalle: inc.descripcion || null,
          estado: inc.estado,
        });
      }
    }

    for (const a of actividadData ?? []) {
      for (const at of a.ultimasAtenciones) {
        eventos.push({
          fecha: at.fecha,
          area: "Soporte Especializado",
          titulo: at.categoria || at.subcategoria || "Atención",
          detalle: at.subcategoria || at.contacto || null,
          estado: at.estado,
        });
      }
    }

    for (const t of tickets) {
      eventos.push({
        fecha: t.fecha_creacion,
        area: "Desarrollo",
        titulo: t.titulo || `Ticket #${t.ticket_id}`,
        detalle: t.subcategoria || null,
        estado: t.estado,
      });
    }

    return eventos
      .filter((e) => e.fecha)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 40);
  })();

  const ultimaSoporte = (() => {
    const todas = (soporteData?.porDominio ?? []).flatMap((d) => d.ultimasIncidencias.map((i) => i.ticket_timestamp)).filter(Boolean);
    if (!todas.length) return "—";
    return fmtFecha(todas.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]);
  })();

  const primeraSoporte = (() => {
    const todas = (soporteData?.porDominio ?? []).flatMap((d) => d.ultimasIncidencias.map((i) => i.ticket_timestamp)).filter(Boolean);
    if (!todas.length) return "—";
    return fmtFecha(todas.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]);
  })();

  return {
    status,
    isLoading,
    isFetching,
    refetch,
    warnings: (data?.status === "success" || data?.status === "warning") ? data.warnings ?? [] : [],
    ficha,
    locales,
    tickets,
    tareasSueltas,
    npsResumen,
    actividadData,
    actividadLoading,
    actividadPorDominio,
    actividadTotal,
    actividadOrdenada,
    soporteData,
    soporteLoading,
    soporteTotal,
    soporteAbiertas,
    soporteCategoriasOrdenadas,
    soportePromEspera,
    soportePromSolucion,
    soporteUltima: ultimaSoporte,
    soportePrimera: primeraSoporte,
    eventosTransversales,
    actividadLocalData,
    actividadLocalLoading,
    periodoInc,
    setPeriodoInc,
    localSeleccionado,
    setLocalSeleccionado,
    localesOpen,
    setLocalesOpen,
    nombreLocal,
  };
}

export type HistoriaClinicaData = ReturnType<typeof useHistoriaClinicaData>;