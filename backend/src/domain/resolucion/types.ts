export type ResultadoResolucion =
  | "resuelto"
  | "parcial"
  | "escalado"
  | "pendiente"
  | "sin_respuesta"
  | "duplicado";

export interface Resolucion {
  id: string;
  /** @deprecated Usar atencionId */
  casoId: string;
  atencionId: string;
  resultado: ResultadoResolucion;
  resumen: string;
  herramientasUtilizadas: string[];
  lecciones: string[];
  tiempoTotal: string;
  creadoEn: string;
}
