import type { Ticket } from "../domain/tickets/Ticket";

export interface GuiaResolucion {
  objetivo: string;
  procesoRecomendado: string[];
  buenasPracticas: string[];
  informacionNecesaria: string[];
  criteriosResolucion: string[];
}

export interface ResultadoAtencionData {
  resumen: string;
  causaIdentificada: string;
  accionRealizada: string;
  resultado: string;
  observaciones: string;
}

export interface WorkspaceEspecializadoData {
  tipo: string;
  cliente: {
    dominio: string;
    contacto: string;
    producto: string | null;
    pais: string;
    tipoCliente: string | null;
  };
  guia: GuiaResolucion;
  posiblesCausas: string[];
  herramientas: string[];
  estadoOperativo: { label: string; valor: string | null }[];
  resultado: ResultadoAtencionData | null;
}

export interface IWorkspaceBuilder {
  tipo: string;
  construir(ticket: Ticket): Promise<WorkspaceEspecializadoData>;
}
