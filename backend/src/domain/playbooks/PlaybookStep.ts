import { PlaybookAction, type PlaybookActionData } from "./PlaybookAction";
import { PlaybookCondition, type PlaybookConditionData } from "./PlaybookCondition";

export interface PlaybookStepData {
  id: string;
  orden: number;
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  completado: boolean;
  herramientaId?: string;
  pluginId?: string;
  tiempoEstimado?: string;
  acciones: PlaybookActionData[];
  condiciones: PlaybookConditionData[];
}

export class PlaybookStep {
  readonly id: string;
  readonly orden: number;
  readonly nombre: string;
  readonly descripcion: string;
  readonly obligatorio: boolean;
  readonly completado: boolean;
  readonly herramientaId?: string;
  readonly pluginId?: string;
  readonly tiempoEstimado?: string;
  readonly acciones: PlaybookAction[];
  readonly condiciones: PlaybookCondition[];

  constructor(data: PlaybookStepData) {
    this.id = data.id;
    this.orden = data.orden;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.obligatorio = data.obligatorio;
    this.completado = data.completado;
    this.herramientaId = data.herramientaId;
    this.pluginId = data.pluginId;
    this.tiempoEstimado = data.tiempoEstimado;
    this.acciones = data.acciones.map((a) => new PlaybookAction(a));
    this.condiciones = data.condiciones.map((c) => new PlaybookCondition(c));
  }

  toJSON(): PlaybookStepData {
    return {
      id: this.id,
      orden: this.orden,
      nombre: this.nombre,
      descripcion: this.descripcion,
      obligatorio: this.obligatorio,
      completado: this.completado,
      herramientaId: this.herramientaId,
      pluginId: this.pluginId,
      tiempoEstimado: this.tiempoEstimado,
      acciones: this.acciones.map((a) => a.toJSON()),
      condiciones: this.condiciones.map((c) => c.toJSON()),
    };
  }
}
