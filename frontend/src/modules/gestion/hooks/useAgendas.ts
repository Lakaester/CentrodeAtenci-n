import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agendaService } from "../services/agendaService";
import type { CrearAgendaInput, ActualizarAgendaInput } from "../types";

const KEY = ["gestion", "agendas"];

export function useAgendaLista(filtros: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: [...KEY, "lista", filtros],
    queryFn: () => agendaService.listar(filtros),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAgendaDetalle(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detalle", id],
    queryFn: () => agendaService.detalle(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 0,
  });
}

export function useAgendaKpis() {
  return useQuery({
    queryKey: [...KEY, "kpis"],
    queryFn: () => agendaService.kpis(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAgendaCrear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearAgendaInput) => agendaService.crear(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaActualizar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActualizarAgendaInput }) => agendaService.actualizar(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaActualizarEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => agendaService.actualizarEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaEliminar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaService.eliminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaPorRangoFecha(desde: string, hasta: string) {
  return useQuery({
    queryKey: [...KEY, "rango", desde, hasta],
    queryFn: () => agendaService.porRangoFecha(desde, hasta),
    enabled: Boolean(desde && hasta),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAgendaExportar() {
  return useMutation({
    mutationFn: (filtros: Record<string, string | undefined>) => agendaService.exportar(filtros),
  });
}

export function useAgendaRegistrarInicioReal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hora }: { id: string; hora: string }) => agendaService.registrarInicioReal(id, hora),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaRegistrarFinReal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hora }: { id: string; hora: string }) => agendaService.registrarFinReal(id, hora),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaSetResultado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resultado }: { id: string; resultado: string | null }) => agendaService.setResultado(id, resultado),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaGuardarActa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contenido, estado }: { id: string; contenido: any; estado: string }) => agendaService.guardarActa(id, contenido, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaSincronizarCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaService.sincronizarCalendar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAgendaReintentarSyncCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaService.reintentarSyncCalendar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// ── Google Calendar OAuth ──

export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: [...KEY, "google-calendar-status"],
    queryFn: () => agendaService.googleCalendarStatus(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useGoogleCalendarConnect() {
  return useMutation({
    mutationFn: () => agendaService.googleCalendarConnect(),
  });
}

export function useGoogleCalendarDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => agendaService.googleCalendarDisconnect(),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "google-calendar-status"] }),
  });
}

export function useGoogleCalendarInfo() {
  return useQuery({
    queryKey: [...KEY, "google-calendar-info"],
    queryFn: () => agendaService.googleCalendarInfo(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useVerificarDisponibilidad(desde: string, hasta: string) {
  return useQuery({
    queryKey: [...KEY, "disponibilidad", desde, hasta],
    queryFn: () => agendaService.verificarDisponibilidad(desde, hasta),
    enabled: Boolean(desde && hasta),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useReconciliarAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaService.reconciliarAgenda(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
