import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apoyoService } from "../services/apoyoService";
import type { CrearApoyoInput, ActualizarApoyoInput } from "../types";

const KEY = ["gestion", "apoyos"];

export function useApoyoLista(filtros: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: [...KEY, "lista", filtros],
    queryFn: () => apoyoService.listar(filtros),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useApoyoDetalle(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detalle", id],
    queryFn: () => apoyoService.detalle(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 0,
  });
}

export function useApoyoKpis() {
  return useQuery({
    queryKey: [...KEY, "kpis"],
    queryFn: () => apoyoService.kpis(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useApoyoCrear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearApoyoInput) => apoyoService.crear(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApoyoActualizar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActualizarApoyoInput }) => apoyoService.actualizar(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApoyoCerrar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apoyoService.cerrar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApoyoEliminar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apoyoService.eliminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApoyoAreas() {
  return useQuery({
    queryKey: [...KEY, "areas"],
    queryFn: () => apoyoService.areas(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useApoyoAsesores() {
  return useQuery({
    queryKey: [...KEY, "asesores"],
    queryFn: () => apoyoService.asesores(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useApoyoCategoriasFun() {
  return useQuery({
    queryKey: [...KEY, "categoriasFun"],
    queryFn: () => apoyoService.categoriasFun(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useApoyoSubcategoriasDeCategoria(categoria: string | null) {
  return useQuery({
    queryKey: [...KEY, "subcategoriasFun", categoria],
    queryFn: () => apoyoService.subcategoriasDeCategoria(categoria as string),
    enabled: Boolean(categoria),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useApoyoExportar() {
  return useMutation({
    mutationFn: (filtros: Record<string, string | undefined>) => apoyoService.exportar(filtros),
  });
}
