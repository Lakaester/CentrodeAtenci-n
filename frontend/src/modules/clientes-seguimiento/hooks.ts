import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { seguimientoApi } from "./api";
import type { SeguimientoFiltrosLista, SeguimientoGestionInput } from "./types";

export function useResumen(semana: string, periodo: string) {
  return useQuery({
    queryKey: ["sp-resumen", semana, periodo],
    queryFn: () => seguimientoApi.resumen({ semana, periodo }),
    refetchOnWindowFocus: false,
  });
}

export function useCasos(params: SeguimientoFiltrosLista) {
  return useQuery({
    queryKey: ["sp-casos", params],
    queryFn: () => seguimientoApi.casos(params),
    refetchOnWindowFocus: false,
  });
}

export function useCandidatos(enabled: boolean) {
  return useQuery({
    queryKey: ["sp-candidatos"],
    queryFn: () => seguimientoApi.candidatos(),
    enabled,
    refetchOnWindowFocus: false,
  });
}

export function useDetalle(id: string | null) {
  return useQuery({
    queryKey: ["sp-detalle", id],
    queryFn: () => seguimientoApi.detalle(id as string),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });
}

export function useAtenciones(id: string | null, page: number, enabled: boolean) {
  return useQuery({
    queryKey: ["sp-atenciones", id, page],
    queryFn: () => seguimientoApi.atenciones(id as string, { page, pageSize: 25 }),
    enabled: Boolean(id) && enabled,
    refetchOnWindowFocus: false,
  });
}

export function useCrearLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { semana?: string; desde?: string; hasta?: string; claves?: string[] }) =>
      seguimientoApi.crearLote(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sp-resumen"] });
      qc.invalidateQueries({ queryKey: ["sp-casos"] });
      qc.invalidateQueries({ queryKey: ["sp-candidatos"] });
    },
  });
}

export function useGestionar(id: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SeguimientoGestionInput) =>
      seguimientoApi.gestionar(id as string, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sp-detalle", id] });
      qc.invalidateQueries({ queryKey: ["sp-casos"] });
      qc.invalidateQueries({ queryKey: ["sp-resumen"] });
      qc.invalidateQueries({ queryKey: ["sp-atenciones", id] });
    },
  });
}

export function useActualizarCaso(id: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { asesorId?: string | null; proximoContactoAt?: string | null }) =>
      seguimientoApi.actualizar(id as string, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sp-detalle", id] });
      qc.invalidateQueries({ queryKey: ["sp-casos"] });
      qc.invalidateQueries({ queryKey: ["sp-resumen"] });
    },
  });
}
