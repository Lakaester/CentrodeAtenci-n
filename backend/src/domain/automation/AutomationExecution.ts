/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
export type EstadoEjecucion = "pendiente" | "ejecutando" | "completado" | "fallido" | "cancelado";

export interface AutomationExecutionData {
  id: string;
  reglaId: string;
  trigger: string;
  resultado: string;
  fecha: string;
  duracionMs: number;
  estado: EstadoEjecucion;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class AutomationExecution {
  readonly id: string;
  readonly reglaId: string;
  readonly trigger: string;
  readonly resultado: string;
  readonly fecha: string;
  readonly duracionMs: number;
  readonly estado: EstadoEjecucion;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;

  constructor(data: AutomationExecutionData) {
    this.id = data.id;
    this.reglaId = data.reglaId;
    this.trigger = data.trigger;
    this.resultado = data.resultado;
    this.fecha = data.fecha;
    this.duracionMs = data.duracionMs;
    this.estado = data.estado;
    this.error = data.error;
    this.metadata = data.metadata;
  }

  toJSON(): AutomationExecutionData {
    return {
      id: this.id,
      reglaId: this.reglaId,
      trigger: this.trigger,
      resultado: this.resultado,
      fecha: this.fecha,
      duracionMs: this.duracionMs,
      estado: this.estado,
      error: this.error,
      metadata: this.metadata,
    };
  }
}

