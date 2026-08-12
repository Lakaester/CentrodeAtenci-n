import type { MicroserviceResponseDTO, MicroserviceClienteDTO, MicroserviceSoporteDTO, MicroserviceDesarrolloDTO, MicroserviceComercialDTO } from "../dto/MicroserviceDTOs";

export interface MicroserviceClienteDomain {
  dominio: string;
  razonSocial: string | null;
  ruc: string | null;
  pais: string | null;
  tipoCliente: string | null;
  estado: string | null;
  productos: string[];
  ltv: string | null;
  cantidadLocales: number | null;
  estadoSalud: string | null;
}

export interface MicroserviceSoporteDomain {
  historial: { fecha: string; tipo: string; descripcion: string }[];
  ultimasIncidencias: { fecha: string; categoria: string; estado: string }[];
  reincidencias: number;
}

export interface MicroserviceDesarrolloDomain {
  tickets: { id: string; proyecto: string; estado: string; prioridad: string; responsable: string }[];
}

export interface MicroserviceComercialDomain {
  csm: string | null;
  reuniones: number;
  churn: string | null;
  estadoComercial: string | null;
}

export interface MicroserviceDomainData {
  cliente: MicroserviceClienteDomain;
  soporte: MicroserviceSoporteDomain;
  desarrollo: MicroserviceDesarrolloDomain;
  comercial: MicroserviceComercialDomain;
}

export class MicroserviceMapper {
  static toDomain(dto: MicroserviceResponseDTO): MicroserviceDomainData {
    return {
      cliente: {
        dominio: dto.cliente.dominio,
        razonSocial: dto.cliente.razonSocial ?? null,
        ruc: dto.cliente.ruc ?? null,
        pais: dto.cliente.pais ?? null,
        tipoCliente: dto.cliente.tipoCliente ?? null,
        estado: dto.cliente.estado ?? null,
        productos: dto.cliente.productos,
        ltv: dto.cliente.ltv ?? null,
        cantidadLocales: dto.cliente.cantidadLocales ?? null,
        estadoSalud: dto.cliente.estadoSalud ?? null,
      },
      soporte: {
        historial: dto.soporte.historial,
        ultimasIncidencias: dto.soporte.ultimasIncidencias,
        reincidencias: dto.soporte.reincidencias,
      },
      desarrollo: {
        tickets: dto.desarrollo.tickets,
      },
      comercial: {
        csm: dto.comercial.csm ?? null,
        reuniones: dto.comercial.reuniones,
        churn: dto.comercial.churn ?? null,
        estadoComercial: dto.comercial.estadoComercial ?? null,
      },
    };
  }

  static toResponseDTO(domain: MicroserviceDomainData): MicroserviceResponseDTO {
    return {
      cliente: {
        dominio: domain.cliente.dominio,
        razonSocial: domain.cliente.razonSocial ?? undefined,
        ruc: domain.cliente.ruc ?? undefined,
        pais: domain.cliente.pais ?? undefined,
        tipoCliente: domain.cliente.tipoCliente ?? undefined,
        estado: domain.cliente.estado ?? undefined,
        productos: domain.cliente.productos,
        ltv: domain.cliente.ltv ?? undefined,
        cantidadLocales: domain.cliente.cantidadLocales ?? undefined,
        estadoSalud: domain.cliente.estadoSalud ?? undefined,
      },
      soporte: {
        historial: domain.soporte.historial,
        ultimasIncidencias: domain.soporte.ultimasIncidencias,
        reincidencias: domain.soporte.reincidencias,
      },
      desarrollo: {
        tickets: domain.desarrollo.tickets,
      },
      comercial: {
        csm: domain.comercial.csm ?? undefined,
        reuniones: domain.comercial.reuniones,
        churn: domain.comercial.churn ?? undefined,
        estadoComercial: domain.comercial.estadoComercial ?? undefined,
      },
    };
  }
}
