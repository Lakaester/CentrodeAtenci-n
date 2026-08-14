import { api } from "@/lib/api";
import type { QdCaso, QdDetalle, QdCatalogoItem, QdTipo } from "../types";

export interface ExportFiltros {
  tipo?: QdTipo | "todas";
  desde?: string;
  hasta?: string;
  pais?: string;
  estado?: string;
  resultado?: string;
  asesor?: string;
  area?: string;
  producto?: string;
  tipoQueja?: string;
}

export interface CrearCasoInput {
  tipo: QdTipo;
  ticketId?: string | null;
  dominio?: string | null;
  pais?: string | null;
  estado?: string | null;
  resultado?: string | null;
  montoPagado?: number | null;
  tipoMonto?: string | null;
  area?: string | null;
  motivo?: string | null;
  porcentaje?: number | null;
  montoDevuelto?: number | null;
  clasificacion?: string | null;
  producto?: string | null;
  observacion?: string | null;
}

export interface ActualizarCasoInput {
  ticketId?: string | null;
  dominio?: string | null;
  pais?: string | null;
  estado?: string | null;
  resultado?: string | null;
  montoPagado?: number | null;
  tipoMonto?: string | null;
  area?: string | null;
  motivo?: string | null;
  porcentaje?: number | null;
  montoDevuelto?: number | null;
  clasificacion?: string | null;
  producto?: string | null;
  observacion?: string | null;
}

export const qdService = {
  async listar(tipo: QdTipo): Promise<QdCaso[]> {
    const res = await api.get(`/quejas-devoluciones/${tipo === "devolucion" ? "devoluciones" : "quejas"}`);
    return res.data.data ?? [];
  },

  async detalle(id: string): Promise<QdDetalle> {
    const res = await api.get(`/quejas-devoluciones/casos/${id}`);
    return res.data.data;
  },

  async porTicket(ticketId: string): Promise<QdCaso[]> {
    const res = await api.get(`/quejas-devoluciones/casos/ticket/${ticketId}`);
    return res.data.data ?? [];
  },

  async crear(input: CrearCasoInput): Promise<QdCaso> {
    const res = await api.post("/quejas-devoluciones/casos", input);
    return res.data.data;
  },

  async actualizar(id: string, input: ActualizarCasoInput): Promise<QdCaso> {
    const res = await api.patch(`/quejas-devoluciones/casos/${id}`, input);
    return res.data.data;
  },

  /** Eliminación controlada (solo casos manuales). */
  async eliminar(id: string): Promise<QdCaso> {
    const res = await api.delete(`/quejas-devoluciones/casos/${id}`);
    return res.data.data;
  },

  async asociarInteraccion(casoId: string, ticketId: string): Promise<unknown> {
    const res = await api.post(`/quejas-devoluciones/casos/${casoId}/interacciones`, { ticketId });
    return res.data.data;
  },

  async estados(): Promise<QdCatalogoItem[]> {
    const res = await api.get("/quejas-devoluciones/catalogo/estados");
    return res.data.data ?? [];
  },
  async resultados(): Promise<QdCatalogoItem[]> {
    const res = await api.get("/quejas-devoluciones/catalogo/resultados");
    return res.data.data ?? [];
  },
  async areas(): Promise<QdCatalogoItem[]> {
    const res = await api.get("/quejas-devoluciones/catalogo/areas");
    return res.data.data ?? [];
  },
  async productos(): Promise<QdCatalogoItem[]> {
    const res = await api.get("/quejas-devoluciones/catalogo/productos");
    return res.data.data ?? [];
  },
  async tiposQueja(): Promise<QdCatalogoItem[]> {
    const res = await api.get("/quejas-devoluciones/catalogo/tipos-queja");
    return res.data.data ?? [];
  },

  /**
   * Exportación Excel operativa. El backend genera el .xlsx aplicando los
   * filtros activos; aquí solo se descarga el blob.
   */
  async exportar(f: ExportFiltros): Promise<{ blob: Blob; nombre: string; total: number }> {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v != null && v !== "") params.set(k, String(v));
    });
    const res = await api.get(`/quejas-devoluciones/exportar?${params.toString()}`, { responseType: "blob" });
    const disposicion = String(res.headers?.["content-disposition"] ?? "");
    const m = disposicion.match(/filename="?([^";]+)"?/i);
    const nombre = m?.[1] ?? "Quejas_Devoluciones.xlsx";
    const total = Number(res.headers?.["x-export-total"] ?? 0);
    return { blob: res.data as Blob, nombre, total };
  },
};
