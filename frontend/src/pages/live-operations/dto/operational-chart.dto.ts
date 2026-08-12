export interface DonutSliceDTO {
  name: string;
  value: number;
  colorKey?: string;
}

export interface BarSeriesDTO {
  name: string;
  values: number[];
}

export interface AreaSeriesDTO {
  name: string;
  values: number[];
}

export interface OperationalChartsDTO {
  volumenCanal: DonutSliceDTO[];
  ticketsPrioridad: { categorias: string[]; series: BarSeriesDTO[] };
  evolucionReciente: { categorias: string[]; series: AreaSeriesDTO[] };
  estadoAsesores: { categorias: string[]; series: BarSeriesDTO[] };
}
