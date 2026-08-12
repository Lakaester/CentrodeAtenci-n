export interface AIResponseData {
  resultado: string;
  confianza: number;
  referencias?: string[];
  recomendaciones?: string[];
  acciones?: string[];
  tiempoEjecucion: number;
  proveedorUsado: string;
  modeloUsado?: string;
  tokensUsados?: number;
}

export class AIResponse {
  readonly resultado: string;
  readonly confianza: number;
  readonly referencias?: string[];
  readonly recomendaciones?: string[];
  readonly acciones?: string[];
  readonly tiempoEjecucion: number;
  readonly proveedorUsado: string;
  readonly modeloUsado?: string;
  readonly tokensUsados?: number;

  constructor(data: AIResponseData) {
    this.resultado = data.resultado;
    this.confianza = data.confianza;
    this.referencias = data.referencias;
    this.recomendaciones = data.recomendaciones;
    this.acciones = data.acciones;
    this.tiempoEjecucion = data.tiempoEjecucion;
    this.proveedorUsado = data.proveedorUsado;
    this.modeloUsado = data.modeloUsado;
    this.tokensUsados = data.tokensUsados;
  }

  toJSON(): AIResponseData {
    return {
      resultado: this.resultado,
      confianza: this.confianza,
      referencias: this.referencias,
      recomendaciones: this.recomendaciones,
      acciones: this.acciones,
      tiempoEjecucion: this.tiempoEjecucion,
      proveedorUsado: this.proveedorUsado,
      modeloUsado: this.modeloUsado,
      tokensUsados: this.tokensUsados,
    };
  }
}
