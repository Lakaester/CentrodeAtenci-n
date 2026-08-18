import { facturacionRepository } from "../repositories/facturacion.repository";
import { facturacionCasosRepository } from "../repositories/facturacion.casos.repository";
import { calcularDuraciones, type IntervencionRow, type PausaRow, type ActividadRow } from "../repositories/facturacion.types";
import { ApplicationError, DomainError } from "../core/errors/types";

export interface IntervencionDetalle {
  intervencion: IntervencionRow;
  pausas: PausaRow[];
  actividades: ActividadRow[];
  duraciones: { duracionBrutaMs: number; duracionPausadaMs: number; duracionEfectivaMs: number };
}

export interface FinalizarInput {
  causa: string | null;
  resultado: string | null;
  observacion: string | null;
  subcategoriaId?: string | null;
  estadoId?: string | null;
  mensajeError?: string | null;
  facturasPendientes?: number | null;
  boletasPendientes?: number | null;
}

export interface CrearIntervencionInput {
  asesor: string;
  unidadNegocioId?: string | null;
  clienteNombre?: string | null;
  ruc?: string | null;
  dominio: string;
  proveedor?: string | null;
  facturasPendientes?: number | null;
  boletasPendientes?: number | null;
  subcategoriaId?: string | null;
  estadoId?: string | null;
  casoId?: string | null;
}

const STATUS_FINALES = ["RESUELTA", "NO_RESUELTA", "DERIVADA", "CANCELADA"];

async function aDetalle(intervencion: IntervencionRow): Promise<IntervencionDetalle> {
  const [pausas, actividades] = await Promise.all([
    facturacionRepository.pausas(intervencion.id),
    facturacionRepository.actividades(intervencion.id),
  ]);
  return {
    intervencion,
    pausas,
    actividades,
    duraciones: calcularDuraciones(intervencion.started_at, intervencion.finished_at, pausas),
  };
}

export const facturacionService = {
  async obtenerActiva(asesor: string): Promise<IntervencionDetalle | null> {
    const activa = await facturacionRepository.activaPorAsesor(asesor);
    if (!activa) return null;
    return aDetalle(activa);
  },

  async crear(input: CrearIntervencionInput): Promise<IntervencionDetalle> {
    const activa = await facturacionRepository.activaPorAsesor(input.asesor);
    if (activa) {
      throw new DomainError(`Tienes una intervención activa (${activa.id}). Páusala o finalízala antes de iniciar otra.`, "INTERVENCION_ACTIVA");
    }

    // Crear/reutilizar el caso persistente del dominio y vincular la intervención.
    const caso = await facturacionCasosRepository.crearOConsultarPorDominio(input.dominio, {
      ruc: input.ruc ?? null,
      proveedor: input.proveedor ?? null,
      unidadNegocioId: input.unidadNegocioId ?? null,
      clienteNombre: input.clienteNombre ?? null,
    });
    const casoId = caso.id;

    const intervencion = await facturacionRepository.crear({ ...input, casoId });
    await facturacionCasosRepository.vincularIntervencion(casoId, intervencion.id);
    await facturacionCasosRepository.registrarAuditoria({
      entidad: "caso", entidadId: casoId, accion: "INTERVENCION_VINCULADA",
      asesor: input.asesor, detalle: `Intervención ${intervencion.id} vinculada al caso ${caso.dominio}`,
    });

    // Snapshot de origen INTERVENCION si hay datos de pendientes disponibles.
    if (input.facturasPendientes != null || input.boletasPendientes != null) {
      const facturas = input.facturasPendientes ?? 0;
      const boletas = input.boletasPendientes ?? 0;
      await facturacionCasosRepository.registrarSnapshot({
        casoId, facturas, boletas, total: facturas + boletas, origen: "INTERVENCION", usuario: input.asesor,
      });
    }

    await facturacionRepository.registrarActividad(intervencion.id, "inicio", "Intervención iniciada");
    return aDetalle(intervencion);
  },

  async pausar(intervencionId: string, asesor: string, motivo: string | null): Promise<IntervencionDetalle> {
    const intervencion = await facturacionRepository.porId(intervencionId);
    if (!intervencion) throw new DomainError("Intervención no encontrada", "NO_ENCONTRADA");
    if (intervencion.asesor !== asesor) throw new DomainError("No autorizado", "NO_AUTORIZADO");
    if (intervencion.status === "PAUSADA") throw new DomainError("La intervención ya está pausada", "YA_PAUSADA");
    if (STATUS_FINALES.includes(intervencion.status)) throw new DomainError("La intervención ya finalizó", "FINALIZADA");

    await facturacionRepository.pausar(intervencionId, motivo);
    await facturacionRepository.registrarActividad(intervencionId, "pausa", motivo ?? "Intervención pausada");
    return aDetalle((await facturacionRepository.porId(intervencionId))!);
  },

  async reanudar(intervencionId: string, asesor: string): Promise<IntervencionDetalle> {
    const intervencion = await facturacionRepository.porId(intervencionId);
    if (!intervencion) throw new DomainError("Intervención no encontrada", "NO_ENCONTRADA");
    if (intervencion.asesor !== asesor) throw new DomainError("No autorizado", "NO_AUTORIZADO");
    if (intervencion.status !== "PAUSADA") throw new DomainError("La intervención no está pausada", "NO_PAUSADA");

    await facturacionRepository.reanudar(intervencionId);
    await facturacionRepository.registrarActividad(intervencionId, "reanudar", "Intervención reanudada");
    return aDetalle((await facturacionRepository.porId(intervencionId))!);
  },

  async finalizar(intervencionId: string, asesor: string, status: string, input: FinalizarInput): Promise<IntervencionDetalle> {
    const intervencion = await facturacionRepository.porId(intervencionId);
    if (!intervencion) throw new DomainError("Intervención no encontrada", "NO_ENCONTRADA");
    if (intervencion.asesor !== asesor) throw new DomainError("No autorizado", "NO_AUTORIZADO");
    if (STATUS_FINALES.includes(intervencion.status)) throw new DomainError("La intervención ya finalizó", "FINALIZADA");
    if (!STATUS_FINALES.includes(status)) throw new ApplicationError("Resultado inválido", "RESULTADO_INVALIDO");

    // cerrar pausas abiertas antes de finalizar
    await facturacionRepository.reanudar(intervencionId);

    const finalizada = await facturacionRepository.finalizar(intervencionId, status, input);
    await facturacionRepository.registrarActividad(intervencionId, "finalizar", `Resultado: ${status}`);
    await facturacionCasosRepository.registrarAuditoria({
      entidad: "intervencion", entidadId: intervencionId, accion: "INTERVENCION_FINALIZADA",
      asesor, detalle: `Intervención ${intervencionId} finalizada con resultado ${status}`,
    });

    // REGLA CRÍTICA: finalizar una intervención NO marca el caso como RESUELTO.
    // La resolución solo se confirma mediante snapshot con total = 0.
    // Si hay datos de pendientes disponibles, registrar snapshot y evaluar resolución.
    if (intervencion.caso_id && (input.facturasPendientes != null || input.boletasPendientes != null)) {
      const facturas = input.facturasPendientes ?? 0;
      const boletas = input.boletasPendientes ?? 0;
      const total = facturas + boletas;
      await facturacionCasosRepository.registrarSnapshot({
        casoId: intervencion.caso_id, facturas, boletas, total, origen: "INTERVENCION", usuario: asesor,
      });
      // Si el total es 0, el caso puede pasar a RESUELTO (confirmado por snapshot).
      if (total === 0) {
        const caso = await facturacionCasosRepository.porId(intervencion.caso_id);
        if (caso && caso.estado_operativo !== "RESUELTO") {
          await facturacionCasosRepository.registrarAuditoria({
            entidad: "caso", entidadId: intervencion.caso_id, accion: "ESTADO_CAMBIADO",
            asesor, anterior: caso.estado_operativo, nuevo: "RESUELTO",
            detalle: "Resolución confirmada por snapshot (total = 0) al finalizar intervención",
          });
          await facturacionCasosRepository.actualizarCaso(intervencion.caso_id, { estado_operativo: "RESUELTO" });
        }
      }
    }

    return aDetalle(finalizada!);
  },

  async actualizar(intervencionId: string, asesor: string, patch: Record<string, unknown>): Promise<IntervencionDetalle> {
    const intervencion = await facturacionRepository.porId(intervencionId);
    if (!intervencion) throw new DomainError("Intervención no encontrada", "NO_ENCONTRADA");
    if (intervencion.asesor !== asesor) throw new DomainError("No autorizado", "NO_AUTORIZADO");
    if (STATUS_FINALES.includes(intervencion.status)) throw new DomainError("La intervención ya finalizó", "FINALIZADA");

    const actualizada = await facturacionRepository.actualizar(intervencionId, patch);
    return aDetalle(actualizada!);
  },

  async registrarActividad(intervencionId: string, asesor: string, tipo: string, detalle: string | null): Promise<void> {
    const intervencion = await facturacionRepository.porId(intervencionId);
    if (!intervencion) throw new DomainError("Intervención no encontrada", "NO_ENCONTRADA");
    if (intervencion.asesor !== asesor) throw new DomainError("No autorizado", "NO_AUTORIZADO");
    await facturacionRepository.registrarActividad(intervencionId, tipo, detalle);
  },

  async listar(asesor: string, limite = 50): Promise<IntervencionDetalle[]> {
    const intervenciones = await facturacionRepository.listar(asesor, limite);
    return Promise.all(intervenciones.map((i) => aDetalle(i)));
  },

  async listarPorCliente(unidadNegocioId: string | null, dominios: string[]): Promise<IntervencionDetalle[]> {
    const intervenciones = await facturacionRepository.listarPorCliente(unidadNegocioId, dominios);
    return Promise.all(intervenciones.map((i) => aDetalle(i)));
  },
};
