export type TipoMensaje = "cliente" | "agente" | "sistema" | "evento";
export type EstadoMensaje = "enviado" | "entregado" | "leido" | "error";

export interface Mensaje {
  id: string;
  conversacionId: string;
  /** @deprecated Usar atencionId */
  casoId: string;
  atencionId: string;
  emisor: string;
  emisorId?: string;
  contenido: string;
  tipo: TipoMensaje;
  timestamp: string;
  estado: EstadoMensaje;
  metadata?: Record<string, string>;
}
