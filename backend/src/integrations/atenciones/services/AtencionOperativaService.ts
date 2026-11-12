/**
 * AtencionOperativaService — capa de aplicación del registro operativo de atenciones.
 *
 * Orquesta el snapshot por atención y la auditoría:
 *   1. Al cargar una atención desde Zendesk → crear/encontrar el registro COPE,
 *      sincronizar datos originales SIN sobrescribir datos manuales de COPE.
 *   2. Al identificar/vincular dominio → snapshot + auditoría.
 *   3. Al categorizar → snapshot + auditoría (conserva histórico).
 *   4. Al calificar → snapshot + auditoría (dato exclusivo COPE).
 *   5. Al cambiar estado/responder/resolver → snapshot + auditoría.
 *
 * Regla de precedencia: los datos registrados manualmente en COPE (origen='cope')
 * NO se sobrescriben al sincronizar Zendesk (origen='zendesk').
 */
import {
  atencionOperativaRepository,
  type AtencionSnapshot,
  type AtencionAuditoriaRow,
  type DatosZendeskSnapshot,
  type AtencionOrigen,
  type TipoIdentificacion,
} from "../../../repositories/atencionOperativa.repository";
import { contactoDominioRepository } from "../../../repositories/contactoDominio.repository";
import { resolverIdentidad } from "../../../domain/contacto/ContactoResolucionService";

export interface AtencionOperativaView {
  atencion: AtencionSnapshot;
  auditoria: AtencionAuditoriaRow[];
}

export class AtencionOperativaService {
  /**
   * Sincroniza una atención desde Zendesk. NO rompe el flujo actual: solo
   * complementa el snapshot operativo de COPE. Devuelve la vista operativa.
   *
   * Auto-identificación por historial: si la atención NO tiene dominio manual
   * de COPE, se resuelve el dominio histórico del contacto (contacto_dominio)
   * usando el motor de resolución. Si hay UN único dominio → se persiste como
   * identificación automática (origen=zendesk). Si hay VARIOS → NO se elige
   * (deja REQUIERE_SELECCION para el asesor). Sin dominios → SIN_IDENTIFICAR.
   */
  async sincronizarDesdeZendesk(
    zendeskTicketId: string,
    datosZendesk: DatosZendeskSnapshot,
    contexto?: { usuario?: string | null },
  ): Promise<AtencionOperativaView> {
    const atencion = await atencionOperativaRepository.obtenerOCrearPorTicket(zendeskTicketId, datosZendesk);

    // Sincronizar estado + asesor (snapshot), sin pisar manual.
    await atencionOperativaRepository.actualizarEstado(atencion.id, {
      estado: datosZendesk.estado ?? null,
      asesor: datosZendesk.assigneeId != null ? String(datosZendesk.assigneeId) : null,
      origen: "zendesk",
    });

    // ── Auto-identificación por historial (solo si no hay dominio manual COPE) ──
    const yaManual = atencion.dominio_identificado && atencion.dominio_origen === "cope";
    if (!yaManual && !atencion.dominio_identificado) {
      await this.aplicarIdentificacionAutomatica(atencion, datosZendesk);
    }

    const auditoria = await atencionOperativaRepository.listarAuditoria(atencion.id);
    return { atencion, auditoria };
  }

  /**
   * Resuelve el dominio histórico del contacto (email/teléfono) y lo persiste
   * en el snapshot de la atención SI hay un único dominio activo y homologable.
   * Respeta la precedencia: no pisa una identificación manual de COPE.
   */
  private async aplicarIdentificacionAutomatica(
    atencion: AtencionSnapshot,
    datosZendesk: DatosZendeskSnapshot,
  ): Promise<void> {
    const contactoValor = datosZendesk.clienteEmail ?? datosZendesk.telefono ?? null;
    const contactoTipo: "email" | "whatsapp" | null = datosZendesk.clienteEmail
      ? "email"
      : datosZendesk.telefono
      ? "whatsapp"
      : null;
    if (!contactoValor || !contactoTipo) return;

    try {
      const dominios = await contactoDominioRepository.obtenerDominios(contactoTipo, contactoValor);
      if (dominios.length === 0) return;

      // Usar el motor de resolución: único dominio → IDENTIFICADO_AUTO.
      const resultado = resolverIdentidad({
        tipo: contactoTipo,
        valor: contactoValor,
        dominios: dominios.map((d) => ({ dominio: d.dominio, origen: d.origen })),
      });

      if (resultado.estado !== "IDENTIFICADO_AUTO" || !resultado.dominioSeleccionado) return;

      await atencionOperativaRepository.actualizarIdentificacion(atencion.id, {
        contactoTipo,
        contactoValor,
        dominio: resultado.dominioSeleccionado,
        tipoIdentificacion: "HISTORIAL",
        usuario: null,
        origen: "zendesk",
      });

      await atencionOperativaRepository.registrarAuditoria({
        atencionId: atencion.id,
        accion: "identificacion",
        usuario: null,
        detalle: `Dominio identificado automáticamente por historial: ${resultado.dominioSeleccionado}`,
        campo: "dominio_identificado",
        valorAnterior: null,
        valorNuevo: resultado.dominioSeleccionado,
        origen: "zendesk",
      });
    } catch (err) {
      console.error(`[Operativa] No se pudo auto-identificar por historial #${atencion.zendesk_ticket_id}:`, err);
    }
  }

  /**
   * Obtiene la vista operativa actual de una atención por ticket Zendesk.
   * Lectura pura: no crea una atención vacía si no existe.
   */
  async obtenerPorTicket(zendeskTicketId: string): Promise<AtencionOperativaView | null> {
    const atencion = await atencionOperativaRepository.obtenerPorTicket(zendeskTicketId);
    if (!atencion) return null;
    const auditoria = await atencionOperativaRepository.listarAuditoria(atencion.id);
    return { atencion, auditoria };
  }

  /**
   * Registra la identificación (dominio) de la atención.
   * Origen 'cope' cuando es vinculación manual del asesor; 'zendesk' cuando viene
   * del dominio explícito de Zendesk.
   */
  async registrarIdentificacion(
    zendeskTicketId: string,
    entrada: {
      contactoTipo?: string;
      contactoValor?: string;
      dominio: string;
      tipoIdentificacion: TipoIdentificacion;
      usuario?: string | null;
    },
  ): Promise<void> {
    const atencion = await atencionOperativaRepository.obtenerOCrearPorTicket(zendeskTicketId);
    const origen: AtencionOrigen = entrada.tipoIdentificacion === "MANUAL" ? "cope" : "zendesk";

    await atencionOperativaRepository.actualizarIdentificacion(atencion.id, {
      contactoTipo: entrada.contactoTipo,
      contactoValor: entrada.contactoValor,
      dominio: entrada.dominio,
      tipoIdentificacion: entrada.tipoIdentificacion,
      usuario: entrada.usuario,
      origen,
    });

    await atencionOperativaRepository.registrarAuditoria({
      atencionId: atencion.id,
      accion: "identificacion",
      usuario: entrada.usuario,
      detalle: `Dominio identificado: ${entrada.dominio} (${entrada.tipoIdentificacion})`,
      campo: "dominio_identificado",
      valorAnterior: atencion.dominio_identificado,
      valorNuevo: entrada.dominio,
      origen,
    });
  }

  /**
   * Registra la categorización de la atención.
   * La categoría/subcategoría representan la clasificación de ESTA atención.
   * Si ya existía una clasificación distinta, se registra en auditoría (trazabilidad).
   */
  async registrarClasificacion(
    zendeskTicketId: string,
    entrada: {
      categoria: string;
      subcategoria?: string | null;
      usuario?: string | null;
      origen: AtencionOrigen;
    },
  ): Promise<void> {
    const atencion = await atencionOperativaRepository.obtenerOCrearPorTicket(zendeskTicketId);

    const teniaClasificacion = Boolean(atencion.categoria || atencion.subcategoria);
    const cambioClasificacion = teniaClasificacion && (
      atencion.categoria !== entrada.categoria || atencion.subcategoria !== entrada.subcategoria
    );

    await atencionOperativaRepository.actualizarClasificacion(atencion.id, {
      categoria: entrada.categoria,
      subcategoria: entrada.subcategoria ?? null,
      usuario: entrada.usuario,
      origen: entrada.origen,
    });

    const accion = cambioClasificacion ? "modificacion_categoria" : "categorizacion";
    await atencionOperativaRepository.registrarAuditoria({
      atencionId: atencion.id,
      accion,
      usuario: entrada.usuario,
      detalle: `Categoría: ${entrada.categoria}${entrada.subcategoria ? ` / ${entrada.subcategoria}` : ""}`,
      campo: "categoria",
      valorAnterior: cambioClasificacion ? `${atencion.categoria} / ${atencion.subcategoria}` : null,
      valorNuevo: `${entrada.categoria}${entrada.subcategoria ? ` / ${entrada.subcategoria}` : ""}`,
      origen: entrada.origen,
    });
  }

  /** Registra la calificación de la atención (dato exclusivo COPE). */
  async registrarCalificacion(
    zendeskTicketId: string,
    entrada: {
      calificacion: string;
      usuario?: string | null;
    },
  ): Promise<void> {
    const atencion = await atencionOperativaRepository.obtenerOCrearPorTicket(zendeskTicketId);

    await atencionOperativaRepository.actualizarCalificacion(atencion.id, {
      calificacion: entrada.calificacion,
      usuario: entrada.usuario,
    });

    await atencionOperativaRepository.registrarAuditoria({
      atencionId: atencion.id,
      accion: "calificacion",
      usuario: entrada.usuario,
      detalle: `Calificación: ${entrada.calificacion}`,
      campo: "calificacion",
      valorAnterior: atencion.calificacion,
      valorNuevo: entrada.calificacion,
      origen: "cope",
    });
  }

  /** Registra una acción operativa genérica (respuesta, nota, resolución, cierre). */
  async registrarAccion(
    zendeskTicketId: string,
    entrada: {
      accion: string;
      detalle?: string | null;
      campo?: string | null;
      valorAnterior?: string | null;
      valorNuevo?: string | null;
      usuario?: string | null;
      origen: AtencionOrigen;
    },
  ): Promise<void> {
    const atencion = await atencionOperativaRepository.obtenerOCrearPorTicket(zendeskTicketId);
    await atencionOperativaRepository.registrarAuditoria({
      atencionId: atencion.id,
      accion: entrada.accion,
      usuario: entrada.usuario,
      detalle: entrada.detalle,
      campo: entrada.campo,
      valorAnterior: entrada.valorAnterior,
      valorNuevo: entrada.valorNuevo,
      origen: entrada.origen,
    });
  }
}

export const atencionOperativaService = new AtencionOperativaService();