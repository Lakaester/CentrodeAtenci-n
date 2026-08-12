export type MensajeAutor = "cliente" | "asesor" | "sistema";
export type MensajeTipo = "texto" | "evento" | "adjunto" | "sistema";
export type MensajeCanal = "zendesk" | "wameta" | "whaticket" | "correo" | "chat";
export type MensajeEstado = "enviado" | "entregado" | "leido" | "error";

export interface MensajeGenerico {
  id: string;
  autor: string;
  autorTipo: MensajeAutor;
  tipo: MensajeTipo;
  canal: MensajeCanal;
  contenido: string;
  timestamp: string;
  adjuntos?: { id: string; nombre: string; url: string }[];
  estado?: MensajeEstado;
  esInterno?: boolean;
}

export interface ConversationProvider {
  readonly canal: MensajeCanal;
  renderizar(mensaje: MensajeGenerico, esUltimo: boolean): React.ReactNode;
}
