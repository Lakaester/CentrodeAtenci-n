/**
 * FacturacionSource — contrato para la futura fuente de Facturación Electrónica
 * (facturacionbi / Restafact).
 *
 * El FRONTEND consume este contrato (vía endpoint de COPE), nunca la fuente real.
 * Cuando exista acceso autorizado a facturacionbi, se implementará el adapter
 * de esta interfaz sin tocar el frontend.
 *
 * Todos los campos cuyo valor aún no esté confirmado por la fuente real se
 * modelan como opcionales/null para no inventar datos.
 */

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

export interface FacturacionSourceStatus {
  estado: "NO_CONECTADA" | "DISPONIBLE" | "ERROR";
  mensaje: string;
}

export interface FacturacionSource {
  /** Estado de la fuente (conexión/configuración). */
  status(): Promise<FacturacionSourceStatus>;
  /** Proveedores con métricas agregadas. */
  getProveedores(): Promise<FacturacionProveedor[]>;
  /** Documentos pendientes (filtrable por proveedor). */
  getPendientes(proveedor?: string | null): Promise<FacturacionDominioPendiente[]>;
  /** Detalle de un caso por dominio. */
  getDetalleCaso(dominio: string): Promise<FacturacionDetalleCaso | null>;
  /** Alertas por acumulación de pendientes. */
  getAlertas(umbral: number): Promise<FacturacionAlerta[]>;
  /** Búsqueda por dominio/RUC. */
  buscar(criterio: string): Promise<FacturacionDominioPendiente[]>;
}
