export type FlujoPaso = "identificacion" | "diagnostico" | "solucion" | "validacion" | "cierre";

export interface EventoTimeline {
  id: string;
  /** @deprecated Usar atencionId */
  casoId: string;
  atencionId: string;
  estado: string;
  flujoPaso: FlujoPaso;
  usuario: string;
  usuarioId?: string;
  fecha: string;
  hora: string;
  comentario: string;
  metadata?: Record<string, string>;
}

export interface ProgresoCaso {
  pasoActual: FlujoPaso;
  pasoActualIdx: number;
  totalPasos: number;
  completado: boolean;
}
