export type TipoCondicion =
  | "CLIENTE_HIGH_TOUCH"
  | "CLIENTE_LOW_TOUCH"
  | "CLIENTE_TECH_TOUCH"
  | "PAIS"
  | "PRODUCTO"
  | "CANAL"
  | "CATEGORIA"
  | "SUBCATEGORIA"
  | "ESTADO_CASO"
  | "SLA_MIN"
  | "SLA_MAX"
  | "TIEMPO_ESPERA"
  | "TIENE_TICKET_DEV"
  | "TIENE_PLUGIN"
  | "PERMISO";

export interface PlaybookConditionData {
  tipo: TipoCondicion;
  operador?: "igual" | "diferente" | "mayor_que" | "menor_que" | "contiene" | "existe";
  valor?: unknown;
  etiqueta?: string;
}

export class PlaybookCondition {
  readonly tipo: TipoCondicion;
  readonly operador?: "igual" | "diferente" | "mayor_que" | "menor_que" | "contiene" | "existe";
  readonly valor?: unknown;
  readonly etiqueta?: string;

  constructor(data: PlaybookConditionData) {
    this.tipo = data.tipo;
    this.operador = data.operador;
    this.valor = data.valor;
    this.etiqueta = data.etiqueta;
  }

  toJSON(): PlaybookConditionData {
    return {
      tipo: this.tipo,
      operador: this.operador,
      valor: this.valor,
      etiqueta: this.etiqueta,
    };
  }
}
