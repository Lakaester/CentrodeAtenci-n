import type { AtencionData, DiagnosticoData } from "../atencion/Atencion";
import type { Cliente } from "../clientes/types";
import type { Conversacion } from "../conversacion/types";
import type { EventoTimeline } from "../timeline/types";
import type { Workspace } from "../workspace/Workspace";
import type { KnowledgeArticle } from "../knowledge/KnowledgeArticle";

export interface AIContextData {
  atencion?: AtencionData;
  cliente?: Cliente;
  conversacion?: Conversacion;
  timeline?: EventoTimeline[];
  diagnostico?: DiagnosticoData;
  workspace?: Workspace;
  historial?: string[];
  articulos?: KnowledgeArticle[];
  herramientas?: string[];
  mensajesRecientes?: string[];
}

export class AIContext {
  readonly atencion?: AtencionData;
  readonly cliente?: Cliente;
  readonly conversacion?: Conversacion;
  readonly timeline?: EventoTimeline[];
  readonly diagnostico?: DiagnosticoData;
  readonly workspace?: Workspace;
  readonly historial?: string[];
  readonly articulos?: KnowledgeArticle[];
  readonly herramientas?: string[];
  readonly mensajesRecientes?: string[];

  constructor(data: AIContextData) {
    this.atencion = data.atencion;
    this.cliente = data.cliente;
    this.conversacion = data.conversacion;
    this.timeline = data.timeline;
    this.diagnostico = data.diagnostico;
    this.workspace = data.workspace;
    this.historial = data.historial;
    this.articulos = data.articulos;
    this.herramientas = data.herramientas;
    this.mensajesRecientes = data.mensajesRecientes;
  }

  toJSON(): AIContextData {
    return {
      atencion: this.atencion,
      cliente: this.cliente,
      conversacion: this.conversacion,
      timeline: this.timeline,
      diagnostico: this.diagnostico,
      workspace: this.workspace,
      historial: this.historial,
      articulos: this.articulos,
      herramientas: this.herramientas,
      mensajesRecientes: this.mensajesRecientes,
    };
  }
}
