export interface ContextoData {
  canal: string;
  categoria?: string;
  subcategoria?: string;
  prioridad: number;
  slaPorcentaje: number;
  slaVencido: boolean;
  asunto: string;
  tags: string[];
}

export class Contexto {
  readonly canal: string;
  readonly categoria?: string;
  readonly subcategoria?: string;
  readonly prioridad: number;
  readonly slaPorcentaje: number;
  readonly slaVencido: boolean;
  readonly asunto: string;
  readonly tags: string[];

  constructor(data: ContextoData) {
    this.canal = data.canal;
    this.categoria = data.categoria;
    this.subcategoria = data.subcategoria;
    this.prioridad = data.prioridad;
    this.slaPorcentaje = data.slaPorcentaje;
    this.slaVencido = data.slaVencido;
    this.asunto = data.asunto;
    this.tags = data.tags;
  }

  toJSON(): ContextoData {
    return {
      canal: this.canal,
      categoria: this.categoria,
      subcategoria: this.subcategoria,
      prioridad: this.prioridad,
      slaPorcentaje: this.slaPorcentaje,
      slaVencido: this.slaVencido,
      asunto: this.asunto,
      tags: this.tags,
    };
  }
}
