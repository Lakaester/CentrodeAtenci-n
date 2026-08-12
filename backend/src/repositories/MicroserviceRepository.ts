import { prisma } from "./prisma";
import type { IMicroserviceRepository } from "../contracts/microservice/IMicroserviceRepository";
import type { MicroserviceResponseDTO } from "../dto/MicroserviceDTOs";
import { MicroserviceMapper } from "../mappers/MicroserviceMapper";

export class MicroserviceRepository implements IMicroserviceRepository {
  async consultarPorDominio(dominio: string): Promise<MicroserviceResponseDTO | null> {
    if (!dominio) return null;

    const row = await this.obtenerDesdeVista(dominio);
    if (!row) return null;

    const domain = {
      cliente: {
        dominio,
        razonSocial: row.razonSocial ?? null,
        ruc: row.ruc ?? null,
        pais: row.pais ?? null,
        tipoCliente: null,
        estado: null,
        productos: row.productos ?? [],
        ltv: null,
        cantidadLocales: null,
        estadoSalud: null,
      },
      soporte: {
        historial: [],
        ultimasIncidencias: [],
        reincidencias: 0,
      },
      desarrollo: {
        tickets: [],
      },
      comercial: {
        csm: null,
        reuniones: 0,
        churn: null,
        estadoComercial: null,
      },
    };

    return MicroserviceMapper.toResponseDTO(domain);
  }

  async consultarPorCorreo(correo: string): Promise<MicroserviceResponseDTO | null> {
    if (!correo) return null;
    return this.consultarPorDominio(correo);
  }

  async consultarPorRuc(ruc: string): Promise<MicroserviceResponseDTO | null> {
    if (!ruc) return null;
    return null;
  }

  private async obtenerDesdeVista(dominio: string): Promise<{
    razonSocial: string | null;
    ruc: string | null;
    pais: string | null;
    productos: string[];
  } | null> {
    if (!dominio) return null;
    try {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT
          COALESCE(NULLIF(TRIM(cliente), ''), NULL) AS razonSocial,
          NULL AS ruc,
          COALESCE(NULLIF(TRIM(pais), ''), NULL) AS pais,
          ARRAY_AGG(DISTINCT COALESCE(NULLIF(TRIM(categoria), ''), 'General')) FILTER (WHERE categoria IS NOT NULL) AS productos
        FROM public.v_unificado_norm
        WHERE dominio ILIKE ${dominio}
        GROUP BY cliente, pais
        LIMIT 1
      `;
      if (!rows.length) return null;
      return {
        razonSocial: rows[0].razonSocial,
        ruc: rows[0].ruc,
        pais: rows[0].pais,
        productos: rows[0].productos?.filter(Boolean) ?? [],
      };
    } catch {
      return null;
    }
  }
}
