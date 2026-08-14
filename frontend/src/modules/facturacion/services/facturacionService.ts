import { api } from "@/lib/api";
import type { IntervencionDetalle } from "../types";

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
};
