import { prisma } from "../repositories/prisma";

export interface MicroserviceData {
  cliente: {
    dominio: string;
    dueno: string;
    pais: string;
    tipoCliente: string | null;
    ltv: string | null;
    cantidadLocales: number | null;
    estadoSalud: string | null;
    productos: string[];
  };
  soporte: {
    historial: { fecha: string; tipo: string; descripcion: string }[];
    ultimasIncidencias: { fecha: string; categoria: string; estado: string }[];
    reincidencias: number;
  };
  clientes: {
    csm: string | null;
    reuniones: number;
    churn: string | null;
    estadoComercial: string | null;
  };
  desarrollo: {
    tickets: { id: string; proyecto: string; estado: string; prioridad: string; responsable: string }[];
  };
}

export class MicroserviceProvider {
  async consultarPorDominio(dominio: string): Promise<MicroserviceData | null> {
    if (!dominio) return null;

    const row = await this.obtenerDatosVista(dominio);
    if (!row) return null;

    return {
      cliente: {
        dominio,
        dueno: row.dueno ?? row.cliente ?? dominio,
        pais: row.pais ?? "—",
        tipoCliente: null,
        ltv: null,
        cantidadLocales: null,
        estadoSalud: null,
        productos: row.productos ?? [],
      },
      soporte: {
        historial: [],
        ultimasIncidencias: [],
        reincidencias: 0,
      },
      clientes: {
        csm: null,
        reuniones: 0,
        churn: null,
        estadoComercial: null,
      },
      desarrollo: {
        tickets: [],
      },
    };
  }

  async consultarPorCorreo(correo: string): Promise<MicroserviceData | null> {
    if (!correo) return null;
    return this.consultarPorDominio(correo);
  }

  async consultarPorTelefono(telefono: string): Promise<MicroserviceData | null> {
    if (!telefono) return null;
    return null;
  }

  async consultarPorRUC(ruc: string): Promise<MicroserviceData | null> {
    if (!ruc) return null;
    return null;
  }

  private async obtenerDatosVista(dominio: string): Promise<{
    cliente: string | null;
    dueno: string | null;
    pais: string | null;
    productos: string[];
  } | null> {
    if (!dominio) return null;
    try {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT
          COALESCE(NULLIF(TRIM(cliente), ''), NULL) AS cliente,
          NULL AS dueno,
          COALESCE(NULLIF(TRIM(pais), ''), NULL) AS pais,
          ARRAY_AGG(DISTINCT COALESCE(NULLIF(TRIM(categoria), ''), 'General')) FILTER (WHERE categoria IS NOT NULL) AS productos
        FROM public.v_unificado_norm
        WHERE dominio ILIKE ${dominio}
        GROUP BY cliente, pais
        LIMIT 1
      `;
      if (!rows.length) return null;
      return {
        cliente: rows[0].cliente,
        dueno: rows[0].dueno,
        pais: rows[0].pais,
        productos: rows[0].productos?.filter(Boolean) ?? [],
      };
    } catch {
      return null;
    }
  }
}
