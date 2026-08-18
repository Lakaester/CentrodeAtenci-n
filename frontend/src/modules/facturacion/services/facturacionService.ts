import { api } from "@/lib/api";
import type { IntervencionDetalle, FacturacionCaso, CasoDetalle, CasoSnapshot, CategoriaItem, SubcategoriaItem } from "../types";

export interface FiltrosCasos {
  desde?: string;
  hasta?: string;
  asesor?: string;
  proveedor?: string;
  dominio?: string;
  ruc?: string;
  estado?: string;
  categoria?: string;
  subcategoria?: string;
  resultado?: string;
}

export interface ConfigItem {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  es_interno: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacturacionSourceStatus {
  estado: "NO_CONECTADA" | "DISPONIBLE" | "ERROR";
  mensaje: string;
}

export interface FacturacionProveedor {
  proveedor: string;
  dominiosAfectados: number;
  totalDocumentosPendientes: number;
  totalFacturas: number | null;
  totalBoletas: number | null;
}

export interface FacturacionDominioPendiente {
  dominio: string;
  ruc: string | null;
  proveedor: string | null;
  facturasPendientes: number;
  boletasPendientes: number;
  totalPendiente: number;
  facturasLocal: number | null;
  facturasRestafact: number | null;
  boletasLocal: number | null;
  boletasRestafact: number | null;
  estado: string | null;
  subcategoria: string | null;
  ultimoError: string | null;
  ultimoResultado: string | null;
}

export interface FacturacionAlerta {
  proveedor: string | null;
  dominio: string | null;
  ruc: string | null;
  documentosPendientes: number;
}

export interface FacturacionDetalleCaso {
  proveedor: string | null;
  dominio: string;
  ruc: string | null;
  facturasPendientes: number;
  boletasPendientes: number;
  totalPendiente: number;
  estado: string | null;
  subcategoria: string | null;
  ultimoError: string | null;
  ultimoResultado: string | null;
}

export interface CrearIntervencionInput {
  unidadNegocioId?: string | null;
  clienteNombre?: string | null;
  ruc?: string | null;
  dominio: string;
  proveedor?: string | null;
  facturasPendientes?: number | null;
  boletasPendientes?: number | null;
  subcategoriaId?: string | null;
  estadoId?: string | null;
}

export interface FinalizarInput {
  status: "RESUELTA" | "NO_RESUELTA" | "DERIVADA" | "CANCELADA";
  causa?: string | null;
  resultado?: string | null;
  observacion?: string | null;
  subcategoriaId?: string | null;
  estadoId?: string | null;
  mensajeError?: string | null;
}

export const facturacionService = {
  async activa(): Promise<IntervencionDetalle | null> {
    const res = await api.get("/control-facturacion/intervencion/activa");
    return res.data.data ?? null;
  },

  async listar(limite = 50): Promise<IntervencionDetalle[]> {
    const res = await api.get("/control-facturacion/intervenciones", { params: { limite } });
    return res.data.data ?? [];
  },

  async listarPorCliente(unidadNegocioId: string | null, dominios: string[]): Promise<IntervencionDetalle[]> {
    const params: Record<string, string> = {};
    if (unidadNegocioId) params.unidadNegocioId = unidadNegocioId;
    if (dominios.length > 0) params.dominios = dominios.join(",");
    const res = await api.get("/control-facturacion/intervenciones/cliente", { params });
    return res.data.data ?? [];
  },

  async crear(input: CrearIntervencionInput): Promise<IntervencionDetalle> {
    const res = await api.post("/control-facturacion/intervenciones", input);
    return res.data.data;
  },

  async pausar(id: string, motivo?: string | null): Promise<IntervencionDetalle> {
    const res = await api.post(`/control-facturacion/intervenciones/${id}/pausar`, { motivo });
    return res.data.data;
  },

  async reanudar(id: string): Promise<IntervencionDetalle> {
    const res = await api.post(`/control-facturacion/intervenciones/${id}/reanudar`, {});
    return res.data.data;
  },

  async finalizar(id: string, input: FinalizarInput): Promise<IntervencionDetalle> {
    const res = await api.post(`/control-facturacion/intervenciones/${id}/finalizar`, input);
    return res.data.data;
  },

  async actualizar(id: string, patch: Record<string, unknown>): Promise<IntervencionDetalle> {
    const res = await api.patch(`/control-facturacion/intervenciones/${id}`, patch);
    return res.data.data;
  },

  async registrarActividad(id: string, tipo: string, detalle?: string | null): Promise<void> {
    await api.post(`/control-facturacion/intervenciones/${id}/actividades`, { tipo, detalle });
  },

  async listarEstados(): Promise<ConfigItem[]> {
    const res = await api.get("/control-facturacion/config/estados");
    return res.data.data ?? [];
  },

  async listarSubcategorias(): Promise<ConfigItem[]> {
    const res = await api.get("/control-facturacion/config/subcategorias");
    return res.data.data ?? [];
  },

  async crearEstado(nombre: string): Promise<ConfigItem> {
    const res = await api.post("/control-facturacion/config/estados", { nombre });
    return res.data.data;
  },

  async crearSubcategoria(nombre: string): Promise<ConfigItem> {
    const res = await api.post("/control-facturacion/config/subcategorias", { nombre });
    return res.data.data;
  },

  async actualizarEstado(id: string, patch: { nombre?: string; activo?: boolean; orden?: number }): Promise<ConfigItem> {
    const res = await api.patch(`/control-facturacion/config/estados/${id}`, patch);
    return res.data.data;
  },

  async actualizarSubcategoria(id: string, patch: { nombre?: string; activo?: boolean; orden?: number }): Promise<ConfigItem> {
    const res = await api.patch(`/control-facturacion/config/subcategorias/${id}`, patch);
    return res.data.data;
  },

  async sourceStatus(): Promise<FacturacionSourceStatus> {
    const res = await api.get("/control-facturacion/source/status");
    return res.data;
  },

  // ── Casos operativos ──

  async listarCasos(filtros: FiltrosCasos = {}, limite = 200): Promise<FacturacionCaso[]> {
    const res = await api.get("/control-facturacion/casos", { params: { ...filtros, limite } });
    return res.data.data ?? [];
  },

  async detalleCaso(id: string): Promise<CasoDetalle> {
    const res = await api.get(`/control-facturacion/casos/${id}`);
    return res.data.data;
  },

  async casoPorDominio(dominio: string): Promise<CasoDetalle> {
    const res = await api.get("/control-facturacion/casos/por-dominio", { params: { dominio } });
    return res.data.data;
  },

  async snapshotsCaso(id: string): Promise<CasoSnapshot[]> {
    const res = await api.get(`/control-facturacion/casos/${id}/snapshots`);
    return res.data.data ?? [];
  },

  async asignarCaso(id: string, asesor: string): Promise<FacturacionCaso> {
    const res = await api.post(`/control-facturacion/casos/${id}/asignar`, { asesor });
    return res.data.data;
  },

  async cambiarEstadoCaso(id: string, estado: string): Promise<FacturacionCaso> {
    const res = await api.post(`/control-facturacion/casos/${id}/estado`, { estado });
    return res.data.data;
  },

  async categorizarCaso(id: string, categoriaId: string | null, subcategoriaId: string | null): Promise<FacturacionCaso> {
    const res = await api.patch(`/control-facturacion/casos/${id}/categoria`, { categoriaId, subcategoriaId });
    return res.data.data;
  },

  async registrarSnapshotCaso(id: string, input: { facturas?: number | null; boletas?: number | null; total?: number | null; origen?: string }): Promise<{ snapshot: CasoSnapshot; estadoOperativo: string }> {
    const res = await api.post(`/control-facturacion/casos/${id}/snapshots`, input);
    return res.data.data;
  },

  async categorias(): Promise<CategoriaItem[]> {
    const res = await api.get("/control-facturacion/casos/categorias");
    return res.data.data ?? [];
  },

  async subcategoriasDeCategoria(categoriaId: string): Promise<SubcategoriaItem[]> {
    const res = await api.get(`/control-facturacion/casos/categorias/${categoriaId}/subcategorias`);
    return res.data.data ?? [];
  },

  async exportarCasos(filtros: FiltrosCasos = {}): Promise<{ blob: Blob; nombre: string; total: number }> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v != null && v !== "") params.set(k, String(v));
    });
    const res = await api.get(`/control-facturacion/exportar?${params.toString()}`, { responseType: "blob" });
    const disposicion = String(res.headers?.["content-disposition"] ?? "");
    const m = disposicion.match(/filename="?([^";]+)"?/i);
    const nombre = m?.[1] ?? "ControlFacturacion.xlsx";
    const total = Number(res.headers?.["x-export-total"] ?? 0);
    return { blob: res.data as Blob, nombre, total };
  },
};
