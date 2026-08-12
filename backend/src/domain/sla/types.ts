export type SemaforoSLA = "verde" | "amarillo" | "rojo";

export interface SLAPolicy {
  id: string;
  canalId: string;
  tipoCliente?: string;
  tiempoMaximoMinutos: number;
  umbralVerde: number;
  umbralAmarillo: number;
}

export interface CalculoSLA {
  casoId: string;
  tiempoTranscurridoMinutos: number;
  tiempoMaximoMinutos: number;
  porcentaje: number;
  semaforo: SemaforoSLA;
  estaVencido: boolean;
}
