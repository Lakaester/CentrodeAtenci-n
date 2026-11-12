/**
 * useHistoriaClinicaData — hook compartido que centraliza la carga y derivación
 * de los datos de la ficha del cliente/unidad (LocalBI + actividad + soporte).
 *
 * Lo consumen los componentes de sección del Panel Operativo y la vista
 * completa (HistoriaClinicaView), de modo que la computación vive en UN solo
 * lugar y React Query evita duplicar peticiones de red (query keys estables).
 */
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useHistoriaClinica,
  useActividadCliente,
  useSoporteOnline,
  useActividadLocal,
} from "./useHistoriaClinica";
import type { LocalbiHistoriaClinica, ActividadDominio, TareaIndependiente } from "../types/localbi";
import { nombreLocal, fmtFecha } from "../components/HistoriaClinicaUI";
import { fechaEventoTarea, tituloTarea } from "../utils/tareasFechas";

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
  const queryClient = useQueryClient();
  const [periodoInc, setPeriodoInc] = useState<string>("90");
  const [localSeleccionado, setLocalSeleccionado] = useState<string | null>(null);
  const [localesOpen, setLocalesOpen] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [erroresActualizacion, setErroresActualizacion] = useState<string[]>([]);

  const fichaData = data?.status === "success" || data?.status === "warning"
    ? (data.data as LocalbiHistoriaClinica)
    : null;

  const dominiosDeLaFicha = fichaData?.dominios?.map((d) => d.dominio) ?? [];
  const localbiIdsDeLaFicha = fichaData?.dominios?.flatMap((d) => (d.locales ?? []).map((l) => l.localbi_id)) ?? [];

  const { data: actividadData, isLoading: actividadLoading } = useActividadCliente(dominiosDeLaFicha);
  const { data: soporteData, isLoading: soporteLoading, isError: soporteError, refetch: soporteRefetch } = useSoporteOnline(dominiosDeLaFicha, periodoInc);
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
  // Tareas independientes: se conserva el local de origen (localbi_id real).
  // No se usa `tarea_localbi_id` de Tareabi (placeholder).
  const tareasIndependientes: TareaIndependiente[] = locales.flatMap((l) =>
    (l.tareas_sueltas ?? []).map((t) => ({
      ...t,
      localbi_id: l.localbi_id,
      local_nombre: l.nombre,
      dominio: l.dominio,
    })),
  );
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
  const soporteDominios = soporteData?.porDominio ?? [];
  const soporteTotal = soporteData?.totalIncidencias ?? 0;
  const soporteCerradas = soporteDominios.reduce((acc, d) => acc + d.resumen.cerradas, 0);
  const soporteAbiertas = Math.max(0, soporteTotal - soporteCerradas);

  // Distribución real de estados (terminada, en_proceso, pendiente, otros).
  const estadosMap = new Map<string, number>();
  for (const d of soporteDominios) {
    for (const e of d.resumen.estados) {
      estadosMap.set(e.nombre, (estadosMap.get(e.nombre) ?? 0) + e.cantidad);
    }
  }
  const soporteEstados = [...estadosMap.entries()]
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: soporteTotal > 0 ? cantidad / soporteTotal : 0,
    }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, "es"));

  // Categorías: la fuente excluye las incidencias sin tipoproblema. Se completa
  // el faltante como "Sin categoría" para que la suma coincida con el total.
  const categoriasMap = new Map<string, number>();
  for (const d of soporteDominios) {
    for (const c of d.resumen.categorias) {
      categoriasMap.set(c.nombre, (categoriasMap.get(c.nombre) ?? 0) + c.cantidad);
    }
  }
  const categoriasAsignadas = [...categoriasMap.values()].reduce((acc, n) => acc + n, 0);
  const categoriasSinDato = Math.max(0, soporteTotal - categoriasAsignadas);
  if (categoriasSinDato > 0) {
    categoriasMap.set("Sin categoría", (categoriasMap.get("Sin categoría") ?? 0) + categoriasSinDato);
  }
  const soporteCategoriasDetalle = [...categoriasMap.entries()]
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: soporteTotal > 0 ? cantidad / soporteTotal : 0,
      sinDato: nombre === "Sin categoría",
    }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, "es"));
  const soporteCategoriasOrdenadas: [string, number][] = soporteCategoriasDetalle.map((c) => [c.nombre, c.cantidad]);

  // Locales: la fuente agrupa por local_nombre (no existe localbi_id).
  const localesMap = new Map<string, number>();
  for (const d of soporteDominios) {
    for (const l of d.resumen.porLocal) {
      localesMap.set(l.local, (localesMap.get(l.local) ?? 0) + l.cantidad);
    }
  }
  const localesAsignados = [...localesMap.values()].reduce((acc, n) => acc + n, 0);
  const localesSinDato = Math.max(0, soporteTotal - localesAsignados);
  if (localesSinDato > 0) {
    localesMap.set("Sin local asignado", (localesMap.get("Sin local asignado") ?? 0) + localesSinDato);
  }
  const soportePorLocalDetalle = [...localesMap.entries()]
    .map(([local, cantidad]) => ({
      local,
      cantidad,
      porcentaje: soporteTotal > 0 ? cantidad / soporteTotal : 0,
      sinDato: local === "Sin local asignado",
    }))
    .sort((a, b) => b.cantidad - a.cantidad || a.local.localeCompare(b.local, "es"));

  const soporteEsperaN = soporteDominios.reduce((acc, d) => acc + (d.resumen.esperaN ?? 0), 0);
  const soporteSolucionN = soporteDominios.reduce((acc, d) => acc + (d.resumen.solucionN ?? 0), 0);

  const soportePromEspera = (() => {
    const con = soporteDominios.filter(
      (d) => d.resumen.prom_espera_min != null && (d.resumen.esperaN ?? 0) > 0,
    );
    const n = con.reduce((a, d) => a + (d.resumen.esperaN ?? 0), 0);
    return n > 0
      ? Math.round(con.reduce((a, d) => a + (d.resumen.prom_espera_min ?? 0) * (d.resumen.esperaN ?? 0), 0) / n)
      : null;
  })();
  const soportePromSolucion = (() => {
    const con = soporteDominios.filter(
      (d) => d.resumen.prom_solucion_min != null && (d.resumen.solucionN ?? 0) > 0,
    );
    const n = con.reduce((a, d) => a + (d.resumen.solucionN ?? 0), 0);
    return n > 0
      ? Math.round(con.reduce((a, d) => a + (d.resumen.prom_solucion_min ?? 0) * (d.resumen.solucionN ?? 0), 0) / n)
      : null;
  })();

  // Primera/última real: resumen del backend (MIN/MAX), no la muestra de 20.
  const soportePrimeras = soporteDominios
    .map((d) => d.resumen.primera_incidencia)
    .filter((v): v is string => Boolean(v))
    .sort();
  const soporteUltimas = soporteDominios
    .map((d) => d.resumen.ultima_incidencia)
    .filter((v): v is string => Boolean(v))
    .sort();
  const soportePrimeraISO = soportePrimeras[0] ?? null;
  const soporteUltimaISO = soporteUltimas[soporteUltimas.length - 1] ?? null;
  const soportePrimera = soportePrimeraISO ? fmtFecha(soportePrimeraISO) : "—";
  const soporteUltima = soporteUltimaISO ? fmtFecha(soporteUltimaISO) : "—";

  // Historial Transversal: incidencias + actividad COPE + tickets + tareas independientes.
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

    // Tareas independientes (no vinculadas a tickets de desarrollo).
    for (const t of tareasIndependientes) {
      const fecha = fechaEventoTarea(t);
      if (!fecha) continue;
      eventos.push({
        fecha,
        area: "Tarea",
        titulo: `#${t.tarea_id} · ${tituloTarea(t)}`,
        detalle: [t.local_nombre, t.responsable].filter(Boolean).join(" · ") || null,
        estado: t.estado,
      });
    }

    return eventos
      .filter((e) => e.fecha)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 40);
  })();

  const refreshAll = useCallback(async () => {
    if (refrescando) return;
    setRefrescando(true);
    setErroresActualizacion([]);
    const claves: { label: string; key: readonly unknown[] }[] = [
      { label: "Ficha", key: ["localbi", "historia", unidadNegocio] },
      { label: "COSE histórico", key: ["localbi", "actividad"] },
      { label: "COSE", key: ["localbi", "actividad-cose"] },
      { label: "Actividad por local", key: ["localbi", "actividad-local"] },
      { label: "Soporte en Línea", key: ["localbi", "soporte"] },
      { label: "Historia local", key: ["localbi", "historia-local", unidadNegocio] },
      { label: "Tareabi", key: ["tareabi"] },
      { label: "Facturación", key: ["facturacion", "cliente"] },
      { label: "Quejas y Devoluciones", key: ["quejas-devoluciones", "lista"] },
    ];
    try {
      await Promise.all(
        claves.map((c) => queryClient.refetchQueries({ queryKey: c.key, type: "all" })),
      );
      const fallidas = claves
        .filter((c) =>
          queryClient
            .getQueryCache()
            .findAll({ queryKey: c.key })
            .some((q) => q.state.status === "error"),
        )
        .map((c) => c.label);
      setErroresActualizacion(fallidas);
    } finally {
      setRefrescando(false);
    }
  }, [queryClient, unidadNegocio, refrescando]);

  return {
    status,
    isLoading,
    isFetching,
    refetch,
    refrescando,
    erroresActualizacion,
    refreshAll,
    warnings: (data?.status === "success" || data?.status === "warning") ? data.warnings ?? [] : [],
    ficha,
    locales,
    tickets,
    tareasIndependientes,
    npsResumen,
    actividadData,
    actividadLoading,
    actividadPorDominio,
    actividadTotal,
    actividadOrdenada,
    soporteData,
    soporteLoading,
    soporteError,
    soporteRefetch,
    soporteTotal,
    soporteAbiertas,
    soporteCerradas,
    soporteEstados,
    soporteCategoriasOrdenadas,
    soporteCategoriasDetalle,
    soportePorLocalDetalle,
    soportePromEspera,
    soportePromSolucion,
    soporteEsperaN,
    soporteSolucionN,
    soporteUltima,
    soportePrimera,
    soporteUltimaISO,
    soportePrimeraISO,
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