export type NivelConfianza = "alta" | "media" | "baja";

export interface HipotesisData {
  id: string;
  titulo: string;
  descripcion: string;
  nivelConfianza: NivelConfianza;
  confianza: number;
  autor: string;
  autorId?: string;
  fecha: string;
  causas?: string[];
  recomendaciones?: string[];
}

export class Hipotesis {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly nivelConfianza: NivelConfianza;
  readonly confianza: number;
  readonly autor: string;
  readonly autorId?: string;
  readonly fecha: string;
  readonly causas: string[];
  readonly recomendaciones: string[];

  constructor(data: HipotesisData) {
    this.id = data.id;
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.nivelConfianza = data.nivelConfianza;
    this.confianza = data.confianza;
    this.autor = data.autor;
    this.autorId = data.autorId;
    this.fecha = data.fecha;
    this.causas = data.causas ?? [];
    this.recomendaciones = data.recomendaciones ?? [];
  }

  toJSON(): HipotesisData {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      nivelConfianza: this.nivelConfianza,
      confianza: this.confianza,
      autor: this.autor,
      autorId: this.autorId,
      fecha: this.fecha,
      causas: this.causas,
      recomendaciones: this.recomendaciones,
    };
  }
}
