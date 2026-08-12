export type TipoCliente = "high_touch" | "low_touch" | "tech_touch";
export type EstadoCliente = "activo" | "suspendido" | "baja";

export interface Cliente {
  id: string;
  nombre: string;
  iniciales: string;
  dominio: string;
  email: string;
  telefono: string;
  pais: string;
  ruc: string;
  tipoCliente: TipoCliente;
  estado: EstadoCliente;
  fechaAlta: string;
  tiempoCliente: string;
  ltv: string;
  productoPrincipal: string;
  version: string;
  cantidadLocales: number;
  facturacionElectronica: boolean;
  notasInternas: string;
}
