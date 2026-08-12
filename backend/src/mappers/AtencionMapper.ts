import type { AtencionData } from "../domain/atencion/Atencion";
import type { CreateAtencionDTO, UpdateAtencionDTO } from "../dto/AtencionDTOs";

export type AtencionResponse = ReturnType<typeof AtencionMapper.toResponse>;

export class AtencionMapper {
  static toDomain(dto: CreateAtencionDTO, id: string): AtencionData {
    const ahora = new Date().toISOString();
    return {
      id,
      ticketId: dto.ticketId,
      origen: {
        canal: dto.canal,
        ticketOriginalId: dto.ticketOriginalId,
        ticketOriginalStatus: dto.ticketOriginalStatus,
      },
      cliente: {
        id: dto.clienteId,
        nombre: dto.clienteNombre,
        iniciales: dto.clienteNombre.charAt(0).toUpperCase(),
        dominio: dto.clienteDominio,
        email: dto.clienteEmail,
        telefono: dto.clienteTelefono,
        pais: dto.pais ?? "",
        tipoCliente: dto.tipoCliente ?? "low_touch",
      },
      contexto: {
        canal: dto.canal,
        categoria: dto.categoria,
        subcategoria: dto.subcategoria,
        prioridad: 50,
        slaPorcentaje: 0,
        slaVencido: false,
        asunto: dto.asunto,
        tags: [],
      },
      actividades: [],
      comunicacion: {
        canal: dto.canal,
        ultimoMensaje: dto.mensajeInicial,
        noLeido: 0,
        mensajes: dto.mensajeInicial
          ? [{ id: `msg_${Date.now()}`, tipo: "sistema", emisor: "Sistema", contenido: dto.mensajeInicial, timestamp: ahora }]
          : [],
      },
      createdAt: ahora,
      updatedAt: ahora,
    };
  }

  static applyUpdate(data: AtencionData, dto: UpdateAtencionDTO): AtencionData {
    return {
      ...data,
      contexto: {
        ...data.contexto,
        ...(dto.asunto && { asunto: dto.asunto }),
        ...(dto.categoria && { categoria: dto.categoria }),
        ...(dto.subcategoria && { subcategoria: dto.subcategoria }),
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static toResponse(data: AtencionData) {
    const activas = data.actividades ?? [];
    const ordenadas = [...activas].sort((a, b) => a.fecha.localeCompare(b.fecha));

    return {
      id: data.id,
      ticketId: data.ticketId,
      origen: data.origen,
      cliente: data.cliente,
      contexto: data.contexto,
      diagnostico: data.diagnostico ?? null,
      actividades: activas,
      comunicacion: data.comunicacion,
      resultado: data.resultado ?? null,
      timeline: ordenadas,
      asesorId: data.asesorId,
      asesorNombre: data.asesorNombre,
      relaciones: data.relaciones ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
