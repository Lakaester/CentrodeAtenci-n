import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qdService } from "../services/qdService";
import type { CrearCasoInput, ActualizarCasoInput } from "../services/qdService";
import type { QdTipo } from "../types";

const KEY = ["quejas-devoluciones"];

export function useQdLista(tipo: QdTipo) {
  return useQuery({ queryKey: [...KEY, "lista", tipo], queryFn: () => qdService.listar(tipo), staleTime: 30_000, retry: 1 });
}

export function useQdDetalle(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detalle", id],
    queryFn: () => qdService.detalle(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 0,
  });
}

export function useQdPorTicket(ticketId: string | null) {
  return useQuery({
    queryKey: [...KEY, "ticket", ticketId],
    queryFn: () => qdService.porTicket(ticketId as string),
    enabled: Boolean(ticketId),
    staleTime: 30_000,
    retry: 0,
  });
}

export function useQdCrear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearCasoInput) => qdService.crear(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useQdActualizar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActualizarCasoInput }) => qdService.actualizar(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useQdAsociarInteraccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ casoId, ticketId }: { casoId: string; ticketId: string }) => qdService.asociarInteraccion(casoId, ticketId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useQdEliminar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qdService.eliminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useQdEstados() {
  return useQuery({ queryKey: [...KEY, "catalogo", "estados"], queryFn: () => qdService.estados(), staleTime: 60_000, retry: 1 });
}
export function useQdResultados() {
  return useQuery({ queryKey: [...KEY, "catalogo", "resultados"], queryFn: () => qdService.resultados(), staleTime: 60_000, retry: 1 });
}
export function useQdAreas() {
  return useQuery({ queryKey: [...KEY, "catalogo", "areas"], queryFn: () => qdService.areas(), staleTime: 60_000, retry: 1 });
}
export function useQdProductos() {
  return useQuery({ queryKey: [...KEY, "catalogo", "productos"], queryFn: () => qdService.productos(), staleTime: 60_000, retry: 1 });
}
export function useQdTiposQueja() {
  return useQuery({ queryKey: [...KEY, "catalogo", "tipos-queja"], queryFn: () => qdService.tiposQueja(), staleTime: 60_000, retry: 1 });
}
