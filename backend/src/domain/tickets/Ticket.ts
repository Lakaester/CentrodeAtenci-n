import type { TicketStatus } from "./TicketStatus";
import type { TicketPriority } from "./TicketPriority";
import type { ExternalChannel } from "./TicketChannel";

export interface TicketData {
  id: string;
  externalId?: string;
  channel: ExternalChannel;
  status: TicketStatus;
  priority: TicketPriority;
  priorityScore: number;
  /** @deprecated Usar Atencion.cliente */
  clienteId: string;
  /** @deprecated Usar Atencion.cliente */
  clienteNombre: string;
  /** @deprecated Usar Atencion.cliente */
  clienteDominio: string;
  /** @deprecated Usar Atencion.cliente */
  clienteEmail?: string;
  /** @deprecated Usar Atencion.cliente */
  clienteTelefono?: string;
  /** @deprecated Usar Atencion.cliente */
  pais?: string;
  /** @deprecated Usar Atencion.cliente */
  tipoCliente?: string;
  /** @deprecated Usar Atencion.asesorId */
  asesorId?: string;
  /** @deprecated Usar Atencion.asesorNombre */
  asesorNombre?: string;
  /** @deprecated Usar Atencion.contexto */
  asunto: string;
  /** @deprecated Usar Atencion.contexto */
  categoriaSugerida?: string;
  /** @deprecated Usar Atencion.contexto */
  categoriaFinal?: string;
  subcategoriaSugerida?: string;
  subcategoriaFinal?: string;
  slaPorcentaje: number;
  slaVencido: boolean;
  tags: string[];
  noLeido: number;
  ultimoMensaje?: string;
  ultimoMensajeEn?: string;
  atencionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export class Ticket {
  readonly id: string;
  readonly externalId?: string;
  readonly channel: ExternalChannel;
  status: TicketStatus;
  readonly priority: TicketPriority;
  readonly priorityScore: number;
  readonly clienteId: string;
  readonly clienteNombre: string;
  readonly clienteDominio: string;
  readonly clienteEmail?: string;
  readonly clienteTelefono?: string;
  readonly pais?: string;
  readonly tipoCliente?: string;
  asesorId?: string;
  asesorNombre?: string;
  readonly asunto: string;
  categoriaSugerida?: string;
  categoriaFinal?: string;
  subcategoriaSugerida?: string;
  subcategoriaFinal?: string;
  slaPorcentaje: number;
  slaVencido: boolean;
  readonly tags: string[];
  noLeido: number;
  readonly ultimoMensaje?: string;
  readonly ultimoMensajeEn?: string;
  readonly atencionId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  updatedAt: string;
  readonly acceptedAt?: string;
  readonly resolvedAt?: string;
  readonly closedAt?: string;

  constructor(data: TicketData) {
    this.id = data.id;
    this.externalId = data.externalId;
    this.channel = data.channel;
    this.status = data.status;
    this.priority = data.priority;
    this.priorityScore = data.priorityScore;
    this.clienteId = data.clienteId;
    this.clienteNombre = data.clienteNombre;
    this.clienteDominio = data.clienteDominio;
    this.clienteEmail = data.clienteEmail;
    this.clienteTelefono = data.clienteTelefono;
    this.pais = data.pais;
    this.tipoCliente = data.tipoCliente;
    this.asesorId = data.asesorId;
    this.asesorNombre = data.asesorNombre;
    this.asunto = data.asunto;
    this.categoriaSugerida = data.categoriaSugerida;
    this.categoriaFinal = data.categoriaFinal;
    this.subcategoriaSugerida = data.subcategoriaSugerida;
    this.subcategoriaFinal = data.subcategoriaFinal;
    this.slaPorcentaje = data.slaPorcentaje;
    this.slaVencido = data.slaVencido;
    this.tags = data.tags;
    this.noLeido = data.noLeido;
    this.ultimoMensaje = data.ultimoMensaje;
    this.ultimoMensajeEn = data.ultimoMensajeEn;
    this.atencionId = data.atencionId;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.acceptedAt = data.acceptedAt;
    this.resolvedAt = data.resolvedAt;
    this.closedAt = data.closedAt;
  }

  toJSON(): TicketData {
    return {
      id: this.id,
      externalId: this.externalId,
      channel: this.channel,
      status: this.status,
      priority: this.priority,
      priorityScore: this.priorityScore,
      clienteId: this.clienteId,
      clienteNombre: this.clienteNombre,
      clienteDominio: this.clienteDominio,
      clienteEmail: this.clienteEmail,
      clienteTelefono: this.clienteTelefono,
      pais: this.pais,
      tipoCliente: this.tipoCliente,
      asesorId: this.asesorId,
      asesorNombre: this.asesorNombre,
      asunto: this.asunto,
      categoriaSugerida: this.categoriaSugerida,
      categoriaFinal: this.categoriaFinal,
      subcategoriaSugerida: this.subcategoriaSugerida,
      subcategoriaFinal: this.subcategoriaFinal,
      slaPorcentaje: this.slaPorcentaje,
      slaVencido: this.slaVencido,
      tags: this.tags,
      noLeido: this.noLeido,
      ultimoMensaje: this.ultimoMensaje,
      ultimoMensajeEn: this.ultimoMensajeEn,
      atencionId: this.atencionId,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      acceptedAt: this.acceptedAt,
      resolvedAt: this.resolvedAt,
      closedAt: this.closedAt,
    };
  }
}
