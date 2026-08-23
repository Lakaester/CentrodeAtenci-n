/**
 * IntegracionesService — Lógica de negocio para el Monitor de Integraciones.
 *
 * Orquesta IntegracionesClient y normaliza la respuesta:
 *  1. Dominio → listaInfoLocal → integraciones + storeIds
 *  2. Filtros → busquedaPedidos → pedidos paginados
 */
import { IntegracionesClient, IntegracionesHttpError, IntegracionesInvalidResponse, IntegracionesTimeout } from "../client/IntegracionesClient";
import { normalizeDomain } from "../../../domain/contacto/normalizacion";
import type { DominioIntegracionesResult, IntegracionDominio, BusquedaPedidosRequest, BusquedaPedidosData, Pedido } from "../types";

export type IntegracionesResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; mensaje: string }
  | { status: "unavailable"; mensaje: string };

export interface BusquedaPedidosResultado {
  totalRegistros: number;
  pedidos: Pedido[];
}

export class IntegracionesService {
  private client = new IntegracionesClient();

  private mensajeDeError(err: unknown): string {
    if (err instanceof IntegracionesHttpError) return err.message;
    if (err instanceof IntegracionesTimeout) return err.message;
    if (err instanceof IntegracionesInvalidResponse) return err.message;
    const msg = err instanceof Error ? err.message : String(err);
    return `API de integraciones no disponible: ${msg}`;
  }

  /**
   * Resuelve un dominio → integraciones + storeIds.
   *
   * Flujo:
   *   1. Normalizar dominio
   *   2. Consultar listaInfoLocal
   *   3. Filtrar registros cuya suscripcion coincida con el dominio normalizado
   *   4. Extraer integraciones únicas y sus storeIds
   */
  async obtenerIntegracionesPorDominio(dominio: string): Promise<IntegracionesResult<DominioIntegracionesResult>> {
    const dominioNormalizado = normalizeDomain(dominio);
    if (!dominioNormalizado) {
      return { status: "error", mensaje: "Dominio inválido o vacío." };
    }

    try {
      const envelope = await this.client.obtenerInfoLocales();
      if (String(envelope.tipo) !== "1") {
        return { status: "error", mensaje: envelope.mensajes?.join(" · ") || "Error al consultar integraciones." };
      }

      const registros = envelope.data ?? [];
      const coincidencias = registros.filter((r) => normalizeDomain(r.suscripcion) === dominioNormalizado);

      if (coincidencias.length === 0) {
        return {
          status: "success",
          data: { dominio: dominioNormalizado, integraciones: [] },
        };
      }

      // Agrupar por integración, acumulando storeIds únicos
      const mapa = new Map<string, Set<string>>();
      for (const reg of coincidencias) {
        // Cada registro puede tener campos variables; extraemos integraciones y storeIds
        // del registro. La estructura real puede variar — usamos campos conocidos.
        const integraciones = this.extraerIntegraciones(reg);
        for (const int of integraciones) {
          if (!mapa.has(int.nombre)) mapa.set(int.nombre, new Set());
          if (int.storeId) mapa.get(int.nombre)!.add(int.storeId);
        }
      }

      const integraciones: IntegracionDominio[] = [...mapa.entries()].map(([nombre, stores]) => ({
        nombre,
        storeIds: [...stores],
      }));

      return {
        status: "success",
        data: { dominio: dominioNormalizado, integraciones },
      };
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }

  /**
   * Extrae pares (integración, storeId) de un registro de listaInfoLocal.
   *
   * La API real puede devolver diferentes estructuras. Este método intenta
   * extraer la información de forma segura sin asumir un schema fijo.
   */
  private extraerIntegraciones(reg: Record<string, unknown>): Array<{ nombre: string; storeId: string }> {
    const resultado: Array<{ nombre: string; storeId: string }> = [];

    // Patrón 1: reg.integraciones es un array de strings
    if (Array.isArray(reg.integraciones)) {
      for (const int of reg.integraciones) {
        if (typeof int === "string") {
          resultado.push({ nombre: int, storeId: "" });
        }
      }
    }

    // Patrón 2: reg.storeIds o reg.stores es un array de objetos
    const storeKey = reg.storeIds ?? reg.stores;
    if (Array.isArray(storeKey)) {
      for (const s of storeKey) {
        if (s && typeof s === "object") {
          const obj = s as Record<string, unknown>;
          const nombre = String(obj.integracion ?? obj.nombre ?? obj.integration ?? "");
          const storeId = String(obj.storeId ?? obj.store_id ?? obj.id ?? "");
          if (nombre) resultado.push({ nombre, storeId });
        }
      }
    }

    // Patrón 3: campos sueltos (integracion, storeId a nivel del registro)
    if (resultado.length === 0 && typeof reg.integracion === "string" && reg.integracion) {
      resultado.push({ nombre: reg.integracion, storeId: String(reg.storeId ?? reg.store_id ?? "") });
    }

    return resultado;
  }

  /**
   * Busca pedidos con los filtros proporcionados.
   */
  async buscarPedidos(filtros: BusquedaPedidosRequest): Promise<IntegracionesResult<BusquedaPedidosResultado>> {
    try {
      const envelope = await this.client.buscarPedidos(filtros);
      if (String(envelope.tipo) !== "1") {
        return { status: "error", mensaje: envelope.mensajes?.join(" · ") || "Error al buscar pedidos." };
      }

      return {
        status: "success",
        data: {
          totalRegistros: envelope.data?.totalRegistros ?? 0,
          pedidos: envelope.data?.pedidos ?? [],
        },
      };
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }
}
