export type TipoResultadoAtencion =
  | "resuelto"
  | "parcial"
  | "escalado"
  | "pendiente"
  | "sin_respuesta"
  | "duplicado";

export interface ResultadoAtencionData {
  tipo: TipoResultadoAtencion;
  resumen: string;
  fecha: string;
  herramientasUtilizadas: string[];
  lecciones: string[];
  accionRealizada?: string;
  observaciones?: string;
}

export class ResultadoAtencion {
  readonly tipo: TipoResultadoAtencion;
  readonly resumen: string;
  readonly fecha: string;
  readonly herramientasUtilizadas: string[];
  readonly lecciones: string[];
  readonly accionRealizada?: string;
  readonly observaciones?: string;

  constructor(data: ResultadoAtencionData) {
    this.tipo = data.tipo;
    this.resumen = data.resumen;
    this.fecha = data.fecha;
    this.herramientasUtilizadas = data.herramientasUtilizadas;
    this.lecciones = data.lecciones;
    this.accionRealizada = data.accionRealizada;
    this.observaciones = data.observaciones;
  }

  toJSON(): ResultadoAtencionData {
    return {
      tipo: this.tipo,
      resumen: this.resumen,
      fecha: this.fecha,
      herramientasUtilizadas: this.herramientasUtilizadas,
      lecciones: this.lecciones,
      accionRealizada: this.accionRealizada,
      observaciones: this.observaciones,
    };
  }
}
