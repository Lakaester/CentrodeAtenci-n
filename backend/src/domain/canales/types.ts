export type TipoCanal = "whatsapp" | "meta" | "zendesk" | "correo";
export type EstadoCanal = "activo" | "inactivo" | "error";

export interface PoliticaCanal {
  slaMinutos: number;
  horario: string;
  tiempoMaximoRespuesta: number;
}

export interface Canal {
  id: string;
  tipo: TipoCanal;
  nombre: string;
  configuracion: Record<string, string>;
  estado: EstadoCanal;
  politica: PoliticaCanal;
}
