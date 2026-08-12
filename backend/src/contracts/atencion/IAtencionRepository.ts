import type { AtencionData } from "../../domain/atencion/Atencion";

export interface FiltrosAtencion {
  ticketOriginalStatus?: string;
  canal?: string;
  asesorId?: string;
  clienteId?: string;
  categoria?: string;
  search?: string;
  pagina?: number;
  limite?: number;
}

export interface IAtencionRepository {
  findById(id: string): Promise<AtencionData | null>;
  findAll(filtros?: FiltrosAtencion): Promise<{ items: AtencionData[]; total: number }>;
  save(data: AtencionData): Promise<AtencionData>;
}
