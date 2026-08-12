import { Hipotesis, type HipotesisData } from "./Hipotesis";

export interface DiagnosticoData {
  id: string;
  hipotesis: HipotesisData[];
  informacionRecopilada: string[];
  informacionPendiente: string[];
  playbookRecomendado?: string;
  herramientasRecomendadas: string[];
  tiempoEstimado?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export class Diagnostico {
  readonly id: string;
  private _hipotesis: Hipotesis[];
  readonly informacionRecopilada: string[];
  readonly informacionPendiente: string[];
  readonly playbookRecomendado?: string;
  readonly herramientasRecomendadas: string[];
  readonly tiempoEstimado?: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(data: DiagnosticoData) {
    this.id = data.id;
    this._hipotesis = data.hipotesis.map((h) => new Hipotesis(h));
    this.informacionRecopilada = data.informacionRecopilada;
    this.informacionPendiente = data.informacionPendiente;
    this.playbookRecomendado = data.playbookRecomendado;
    this.herramientasRecomendadas = data.herramientasRecomendadas;
    this.tiempoEstimado = data.tiempoEstimado;
    this.creadoEn = data.creadoEn;
    this.actualizadoEn = data.actualizadoEn;
  }

  get hipotesis(): Hipotesis[] {
    return [...this._hipotesis];
  }

  agregarHipotesis(hipotesis: Hipotesis): void {
    this._hipotesis.push(hipotesis);
  }

  toJSON(): DiagnosticoData {
    return {
      id: this.id,
      hipotesis: this._hipotesis.map((h) => h.toJSON()),
      informacionRecopilada: this.informacionRecopilada,
      informacionPendiente: this.informacionPendiente,
      playbookRecomendado: this.playbookRecomendado,
      herramientasRecomendadas: this.herramientasRecomendadas,
      tiempoEstimado: this.tiempoEstimado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
