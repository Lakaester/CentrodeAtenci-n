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

      // Estructura real: cada registro tiene integracion (string) y storeId (string).
      // Agrupar por nombre de integración, acumulando storeIds únicos.
      const mapa = new Map<string, Set<string>>();
      for (const reg of coincidencias) {
        const nombre = reg.integracion;
        const storeId = reg.storeId;
        if (!nombre) continue;
        if (!mapa.has(nombre)) mapa.set(nombre, new Set());
        if (storeId) mapa.get(nombre)!.add(storeId);
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
   * Busca pedidos con los filtros proporcionados.
   * Seguridad: solo permite suscripciones/storeIds que correspondan al dominio autorizado.
   */
  async buscarPedidos(filtros: BusquedaPedidosRequest, dominioAutorizado?: string): Promise<IntegracionesResult<BusquedaPedidosResultado>> {
    try {
      // Si hay dominio autorizado, validar que las suscripciones/storeIds solicitados pertenezcan a él.
      if (dominioAutorizado) {
        const dominioNorm = normalizeDomain(dominioAutorizado);
        if (dominioNorm) {
          // Validar suscripciones
          const suscripcionesValidas = filtros.suscripciones.filter((s) => normalizeDomain(s) === dominioNorm);
          if (filtros.suscripciones.length > 0 && suscripcionesValidas.length === 0) {
            return { status: "error", mensaje: "Las suscripciones solicitadas no corresponden al dominio autorizado." };
          }
          // Validar storeIds contra los que existen para ese dominio
          if (filtros.storeIds.length > 0) {
            const envelope = await this.client.obtenerInfoLocales();
            if (String(envelope.tipo) === "1") {
              const storeIdsDelDominio = new Set(
                (envelope.data ?? [])
                  .filter((r) => normalizeDomain(r.suscripcion) === dominioNorm)
                  .map((r) => r.storeId)
                  .filter(Boolean)
              );
              const invalidos = filtros.storeIds.filter((id) => !storeIdsDelDominio.has(id));
              if (invalidos.length > 0) {
                return { status: "error", mensaje: `StoreIds no válidos para este dominio: ${invalidos.join(", ")}` };
              }
            }
          }
          // Reemplazar suscripciones con la versión validada para evitar inyección
          filtros = { ...filtros, suscripciones: suscripcionesValidas };
        }
      }

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
