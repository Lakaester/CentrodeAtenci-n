import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { facturacionService, type CrearIntervencionInput, type FinalizarInput, type FiltrosCasos } from "../services/facturacionService";
import type { IntervencionDetalle } from "../types";

const KEY_ACTIVA = ["facturacion", "activa"];
const KEY_LISTA = ["facturacion", "intervenciones"];
const KEY_CONFIG = ["facturacion", "config"];
const KEY_CASOS = ["facturacion", "casos"];

export function useEstadosConfig() {
  return useQuery({
    queryKey: [...KEY_CONFIG, "estados"],
    queryFn: () => facturacionService.listarEstados(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useFacturacionSource() {
  return useQuery({
    queryKey: ["facturacion", "source", "status"],
    queryFn: () => facturacionService.sourceStatus(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSubcategoriasConfig() {
  return useQuery({
    queryKey: [...KEY_CONFIG, "subcategorias"],
    queryFn: () => facturacionService.listarSubcategorias(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCrearEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => facturacionService.crearEstado(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_CONFIG }),
  });
}

export function useCrearSubcategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => facturacionService.crearSubcategoria(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_CONFIG }),
  });
}

export function useActualizarEstadoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { nombre?: string; activo?: boolean; orden?: number } }) =>
      facturacionService.actualizarEstado(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_CONFIG }),
  });
}

export function useActualizarSubcategoriaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { nombre?: string; activo?: boolean; orden?: number } }) =>
      facturacionService.actualizarSubcategoria(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_CONFIG }),
  });
}

export function useIntervencionActiva() {
  return useQuery({
    queryKey: KEY_ACTIVA,
    queryFn: () => facturacionService.activa(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useHistorial(limite = 50) {
  return useQuery({
    queryKey: [...KEY_LISTA, limite],
    queryFn: () => facturacionService.listar(limite),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useHistorialCliente(unidadNegocioId: string | null, dominios: string[]) {
  return useQuery({
    queryKey: ["facturacion", "cliente", unidadNegocioId, dominios],
    queryFn: () => facturacionService.listarPorCliente(unidadNegocioId, dominios),
    enabled: Boolean(unidadNegocioId || dominios.length > 0),
    staleTime: 60_000,
    retry: 1,
  });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY_ACTIVA });
  qc.invalidateQueries({ queryKey: KEY_LISTA });
}

export function useCrearIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearIntervencionInput) => facturacionService.crear(input),
    onSuccess: () => invalidar(qc),
  });
}

export function usePausarIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string | null }) => facturacionService.pausar(id, motivo),
    onSuccess: () => invalidar(qc),
  });
}

export function useReanudarIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturacionService.reanudar(id),
    onSuccess: () => invalidar(qc),
  });
}

export function useFinalizarIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FinalizarInput }) => facturacionService.finalizar(id, input),
    onSuccess: () => invalidar(qc),
  });
}

export function useActualizarIntervencion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => facturacionService.actualizar(id, patch),
    onSuccess: () => invalidar(qc),
  });
}

export function useRegistrarActividad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tipo, detalle }: { id: string; tipo: string; detalle?: string | null }) =>
      facturacionService.registrarActividad(id, tipo, detalle),
    onSuccess: () => invalidar(qc),
  });
}

export function useCronometro(activa: IntervencionDetalle | null | undefined) {
  return activa;
}

// ── Casos operativos ──

export function useCasos(filtros: FiltrosCasos = {}) {
  return useQuery({
    queryKey: [...KEY_CASOS, "lista", filtros],
    queryFn: () => facturacionService.listarCasos(filtros),
    staleTime: 20_000,
    retry: 1,
  });
}

export function useCasoDetalle(id: string | null) {
  return useQuery({
    queryKey: [...KEY_CASOS, "detalle", id],
    queryFn: () => facturacionService.detalleCaso(id as string),
    enabled: Boolean(id),
    staleTime: 20_000,
    retry: 0,
  });
}

export function useSnapshotsCaso(id: string | null) {
  return useQuery({
    queryKey: [...KEY_CASOS, "snapshots", id],
    queryFn: () => facturacionService.snapshotsCaso(id as string),
    enabled: Boolean(id),
    staleTime: 20_000,
    retry: 0,
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: ["facturacion", "categorias"],
    queryFn: () => facturacionService.categorias(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSubcategoriasDeCategoria(categoriaId: string | null) {
  return useQuery({
    queryKey: ["facturacion", "subcategorias", categoriaId],
    queryFn: () => facturacionService.subcategoriasDeCategoria(categoriaId ?? ""),
    enabled: Boolean(categoriaId),
    staleTime: 60_000,
    retry: 1,
  });
}

function invalidarCasos(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY_CASOS });
  qc.invalidateQueries({ queryKey: KEY_ACTIVA });
  qc.invalidateQueries({ queryKey: KEY_LISTA });
}

export function useAsignarCaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, asesor }: { id: string; asesor: string }) => facturacionService.asignarCaso(id, asesor),
    onSuccess: () => invalidarCasos(qc),
  });
}

export function useCambiarEstadoCaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => facturacionService.cambiarEstadoCaso(id, estado),
    onSuccess: () => invalidarCasos(qc),
  });
}

export function useCategorizarCaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, categoriaId, subcategoriaId }: { id: string; categoriaId: string | null; subcategoriaId: string | null }) =>
      facturacionService.categorizarCaso(id, categoriaId, subcategoriaId),
    onSuccess: () => invalidarCasos(qc),
  });
}

export function useRegistrarSnapshotCaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { facturas?: number | null; boletas?: number | null; total?: number | null; origen?: string } }) =>
      facturacionService.registrarSnapshotCaso(id, input),
    onSuccess: () => invalidarCasos(qc),
  });
}

export function useExportarCasos() {
  return useMutation({
    mutationFn: (filtros: FiltrosCasos = {}) => facturacionService.exportarCasos(filtros),
  });
}
