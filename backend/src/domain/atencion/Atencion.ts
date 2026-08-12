import { Cliente, type ClienteData } from "./Cliente";
import { Contexto, type ContextoData } from "./Contexto";
import { Diagnostico, type DiagnosticoData } from "./Diagnostico";
import { Hipotesis } from "./Hipotesis";
import { Actividad, type ActividadData } from "./Actividad";
import { Comunicacion, type ComunicacionData } from "./Comunicacion";
import { ResultadoAtencion, type ResultadoAtencionData } from "./Resultado";

export type CanalOrigen = "zendesk" | "wameta" | "whaticket";

export interface OrigenCanalData {
  canal: CanalOrigen;
  ticketOriginalId: string;
  ticketOriginalStatus: string;
}

export interface AtencionData {
  id: string;
  ticketId: string;
  origen: OrigenCanalData;
  cliente: ClienteData;
  contexto: ContextoData;
  diagnostico?: DiagnosticoData;
  actividades: ActividadData[];
  comunicacion: ComunicacionData;
  resultado?: ResultadoAtencionData;
  asesorId?: string;
  asesorNombre?: string;
  relaciones?: string[];
  createdAt: string;
  updatedAt: string;
}

export class Atencion {
  readonly id: string;
  readonly ticketId: string;
  readonly origen: OrigenCanalData;
  readonly cliente: Cliente;
  readonly contexto: Contexto;
  private _diagnostico?: Diagnostico;
  private _actividades: Actividad[];
  readonly comunicacion: Comunicacion;
  private _resultado?: ResultadoAtencion;
  asesorId?: string;
  asesorNombre?: string;
  readonly relaciones: string[];
  readonly createdAt: string;
  updatedAt: string;

  constructor(data: AtencionData) {
    this.id = data.id;
    this.ticketId = data.ticketId;
    this.origen = data.origen;
    this.cliente = new Cliente(data.cliente);
    this.contexto = new Contexto(data.contexto);
    this._diagnostico = data.diagnostico ? new Diagnostico(data.diagnostico) : undefined;
    this._actividades = data.actividades.map((a) => new Actividad(a));
    this.comunicacion = new Comunicacion(data.comunicacion);
    this._resultado = data.resultado ? new ResultadoAtencion(data.resultado) : undefined;
    this.asesorId = data.asesorId;
    this.asesorNombre = data.asesorNombre;
    this.relaciones = data.relaciones ?? [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get diagnostico(): Diagnostico | undefined {
    return this._diagnostico;
  }

  get actividades(): Actividad[] {
    return [...this._actividades];
  }

  get resultado(): ResultadoAtencion | undefined {
    return this._resultado;
  }

  get timeline(): ActividadData[] {
    return [...this._actividades]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((a) => a.toJSON());
  }

  setDiagnostico(diagnostico: Diagnostico): void {
    this._diagnostico = diagnostico;
    this.updatedAt = new Date().toISOString();
  }

  agregarActividad(actividad: Actividad): void {
    this._actividades.push(actividad);
    this.updatedAt = new Date().toISOString();
  }

  agregarHipotesis(hipotesis: Hipotesis): void {
    if (!this._diagnostico) {
      this._diagnostico = new Diagnostico({
        id: `diag_${Date.now()}`,
        hipotesis: [],
        informacionRecopilada: [],
        informacionPendiente: [],
        herramientasRecomendadas: [],
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      });
    }
    this._diagnostico.agregarHipotesis(hipotesis);
    this._actividades.push(
      new Actividad({
        id: `act_${Date.now()}`,
        tipo: "diagnostico",
        subtipo: "hipotesis_agregada",
        fecha: new Date().toISOString(),
        autor: hipotesis.autor,
        autorId: hipotesis.autorId,
        descripcion: hipotesis.titulo,
        origen: "agente",
        resultado: "ok",
      }),
    );
    this.updatedAt = new Date().toISOString();
  }

  setResultado(resultado: ResultadoAtencion): void {
    this._resultado = resultado;
    this.updatedAt = new Date().toISOString();
  }

  toJSON(): AtencionData {
    return {
      id: this.id,
      ticketId: this.ticketId,
      origen: this.origen,
      cliente: this.cliente.toJSON(),
      contexto: this.contexto.toJSON(),
      diagnostico: this._diagnostico?.toJSON(),
      actividades: this._actividades.map((a) => a.toJSON()),
      comunicacion: this.comunicacion.toJSON(),
      resultado: this._resultado?.toJSON(),
      asesorId: this.asesorId,
      asesorNombre: this.asesorNombre,
      relaciones: this.relaciones,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
