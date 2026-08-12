/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
export type TipoCondicionAutomation =
  | "CLIENTE_HIGH_TOUCH"
  | "CLIENTE_TECH_TOUCH"
  | "CANAL"
  | "PAIS"
  | "PRODUCTO"
  | "CATEGORIA"
  | "SUBCATEGORIA"
  | "ESTADO"
  | "PRIORIDAD"
  | "SLA"
  | "HORARIO"
  | "ASESOR"
  | "SUPERVISOR"
  | "TIENE_TICKET_DEV"
  | "ES_REINCIDENTE";

export type OperadorCondicion = "igual" | "diferente" | "mayor_que" | "menor_que" | "contiene" | "existe" | "no_existe";

export interface AutomationConditionData {
  tipo: TipoCondicionAutomation;
  operador: OperadorCondicion;
  valor?: unknown;
  etiqueta?: string;
}

export class AutomationCondition {
  readonly tipo: TipoCondicionAutomation;
  readonly operador: OperadorCondicion;
  readonly valor?: unknown;
  readonly etiqueta?: string;

  constructor(data: AutomationConditionData) {
    this.tipo = data.tipo;
    this.operador = data.operador;
    this.valor = data.valor;
    this.etiqueta = data.etiqueta;
  }

  toJSON(): AutomationConditionData {
    return { tipo: this.tipo, operador: this.operador, valor: this.valor, etiqueta: this.etiqueta };
  }
}

