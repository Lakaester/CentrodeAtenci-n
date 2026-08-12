import type { Mensaje } from "../mensajes/types";

export interface Conversacion {
  id: string;
  /** @deprecated Usar atencionId */
  casoId: string;
  atencionId: string;
  canalId: string;
  mensajes: Mensaje[];
  ultimoMensaje: string;
  ultimoMensajeEn: string;
  noLeido: number;
  activa: boolean;
  abiertaEn: string;
}
