export type TipoTareaIA =
  | "diagnosticar_caso"
  | "clasificar_categoria"
  | "clasificar_subcategoria"
  | "resumir_conversacion"
  | "generar_respuesta"
  | "auditar_respuesta"
  | "detectar_riesgo"
  | "buscar_conocimiento"
  | "generar_resumen_ejecutivo"
  | "sugerir_siguiente_accion"
  | "generar_checklist"
  | "detectar_reincidencia"
  | "analizar_sentimiento"
  | "predecir_resolucion"
  | "extraer_datos_cliente";

export interface AITaskData {
  tipo: TipoTareaIA;
  nombre: string;
  descripcion: string;
  prioridad: number;
  timeout: number;
  requiereContexto: boolean;
}

export class AITask {
  readonly tipo: TipoTareaIA;
  readonly nombre: string;
  readonly descripcion: string;
  readonly prioridad: number;
  readonly timeout: number;
  readonly requiereContexto: boolean;

  constructor(data: AITaskData) {
    this.tipo = data.tipo;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.prioridad = data.prioridad;
    this.timeout = data.timeout;
    this.requiereContexto = data.requiereContexto;
  }

  toJSON(): AITaskData {
    return {
      tipo: this.tipo,
      nombre: this.nombre,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      timeout: this.timeout,
      requiereContexto: this.requiereContexto,
    };
  }
}
