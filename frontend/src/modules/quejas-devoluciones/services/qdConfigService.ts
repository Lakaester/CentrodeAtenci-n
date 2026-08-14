import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface QdCatalogoConfig {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

async function listar(tabla: string): Promise<QdCatalogoConfig[]> {
  const res = await api.get(`/quejas-devoluciones/catalogo/${tabla}`);
  return res.data.data ?? [];
}

async function crear(tabla: string, nombre: string): Promise<QdCatalogoConfig> {
  const res = await api.post(`/quejas-devoluciones/catalogo/${tabla}`, { nombre });
  return res.data.data;
}

async function actualizar(tabla: string, id: string, patch: { nombre?: string; activo?: boolean; orden?: number }): Promise<void> {
  await api.patch(`/quejas-devoluciones/catalogo/${tabla}/${id}`, patch);
}

const TABLAS = {
  estados: "estados",
  resultados: "resultados",
  areas: "areas",
  productos: "productos",
  tiposQueja: "tipos-queja",
};

export function useQdCatLista(tabla: string) {
  return useQuery({ queryKey: ["qd-config", tabla], queryFn: () => listar(TABLAS[tabla as keyof typeof TABLAS]), staleTime: 30_000, retry: 1 });
}

export function useQdCatCrear(tabla: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => crear(TABLAS[tabla as keyof typeof TABLAS], nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qd-config", tabla] }),
  });
}

export function useQdCatActualizar(tabla: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { nombre?: string; activo?: boolean; orden?: number } }) =>
      actualizar(TABLAS[tabla as keyof typeof TABLAS], id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qd-config", tabla] }),
  });
}
