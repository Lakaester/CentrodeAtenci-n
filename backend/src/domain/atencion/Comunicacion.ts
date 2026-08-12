export interface MensajeResumen {
  id: string;
  tipo: "cliente" | "agente" | "sistema";
  emisor: string;
  contenido: string;
  timestamp: string;
}

export interface ComunicacionData {
  canal: string;
  ultimoMensaje?: string;
  ultimoMensajeEn?: string;
  noLeido: number;
  mensajes: MensajeResumen[];
}

export class Comunicacion {
  readonly canal: string;
  readonly ultimoMensaje?: string;
  readonly ultimoMensajeEn?: string;
  readonly noLeido: number;
  private _mensajes: MensajeResumen[];

  constructor(data: ComunicacionData) {
    this.canal = data.canal;
    this.ultimoMensaje = data.ultimoMensaje;
    this.ultimoMensajeEn = data.ultimoMensajeEn;
    this.noLeido = data.noLeido;
    this._mensajes = data.mensajes;
  }

  get mensajes(): MensajeResumen[] {
    return [...this._mensajes];
  }

  toJSON(): ComunicacionData {
    return {
      canal: this.canal,
      ultimoMensaje: this.ultimoMensaje,
      ultimoMensajeEn: this.ultimoMensajeEn,
      noLeido: this.noLeido,
      mensajes: this._mensajes,
    };
  }
}
