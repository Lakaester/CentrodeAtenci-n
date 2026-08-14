import { qdRepository, type CrearCasoInput, type QdCasoRow, type QdInteraccionRow } from "../repositories/quejasDevoluciones.repository";
import { DomainError, ApplicationError } from "../core/errors/types";

function calcularMontoDevuelto(montoPagado: number | null | undefined, porcentaje: number | null | undefined): number | null {
  if (montoPagado == null || porcentaje == null) return null;
  return Math.round(montoPagado * (porcentaje / 100) * 100) / 100;
}

function validarCaso(input: CrearCasoInput) {
  if (input.tipo !== "devolucion" && input.tipo !== "queja") {
    throw new DomainError("Tipo de caso inválido", "TIPO_INVALIDO");
  }
  // Dominio obligatorio: no puede ser null, vacío ni solo espacios.
  const dominio = typeof input.dominio === "string" ? input.dominio.trim() : "";
  if (!dominio) {
    throw new DomainError("El dominio es obligatorio para registrar el caso.", "DOMINIO_REQUERIDO");
  }
  // Porcentaje y monto
  if (input.porcentaje != null) {
    if (input.porcentaje < 0 || input.porcentaje > 100) {
      throw new DomainError("El porcentaje debe estar entre 0 y 100", "PORCENTAJE_INVALIDO");
    }
  }
  if (input.montoPagado != null && input.montoPagado < 0) {
    throw new DomainError("El monto pagado no puede ser negativo", "MONTO_INVALIDO");
  }
  if (input.montoDevuelto != null && input.montoDevuelto < 0) {
    throw new DomainError("El monto devuelto no puede ser negativo", "MONTO_INVALIDO");
  }
  // Coherencia: si el resultado es "Procede 100%", el porcentaje debe ser 100.
  if (input.resultado === "Procede 100%" && input.porcentaje != null && input.porcentaje !== 100) {
    throw new DomainError("Para 'Procede 100%' el porcentaje debe ser 100", "PORCENTAJE_INVALIDO");
  }
  // Queja: clasificación obligatoria y dependencias.
  if (input.tipo === "queja") {
    if (!input.clasificacion) throw new DomainError("La clasificación de la queja es obligatoria", "CLASIFICACION_REQUERIDA");
    if (input.clasificacion === "Servicio" && !input.area) throw new DomainError("Una queja de Servicio requiere área", "AREA_REQUERIDA");
    if (input.clasificacion === "Producto" && !input.producto) throw new DomainError("Una queja de Producto requiere producto", "PRODUCTO_REQUERIDO");
    if (input.clasificacion === "Otro" && !input.motivo) throw new DomainError("Una queja 'Otro' requiere motivo", "MOTIVO_REQUERIDO");
  }
  // Devolución: resultado coherente con porcentaje.
  if (input.tipo === "devolucion" && input.resultado === "No procede") {
    if (input.porcentaje != null && input.porcentaje !== 0) {
      throw new DomainError("Para 'No procede' el porcentaje debe ser 0", "PORCENTAJE_INVALIDO");
    }
  }
}

export const qdService = {
  async listar(tipo: "devolucion" | "queja") {
    return qdRepository.listar(tipo);
  },

  async porId(id: string): Promise<{ caso: QdCasoRow; interacciones: QdInteraccionRow[]; auditoria: unknown[] } | null> {
    const caso = await qdRepository.porId(id);
    if (!caso) return null;
    const auditoria = await qdRepository.auditoria(id);
    const interacciones = await qdRepository.interacciones(id);
    return { caso, interacciones, auditoria };
  },

  async porTicket(ticketId: string, tipo: "devolucion" | "queja"): Promise<QdCasoRow | null> {
    return qdRepository.porTicket(ticketId, tipo);
  },

  async porTicketGeneral(ticketId: string, tipo: "devolucion" | "queja"): Promise<QdCasoRow | null> {
    return qdRepository.porTicketGeneral(ticketId, tipo);
  },

  /**
   * Crea (o reutiliza) un caso desde la categorización del asesor.
   *
   * REGLA DE NEGOCIO: un caso representa el proceso completo de gestión de un
   * problema, no un correo individual. Esta operación:
   *
   * 1. Identifica el ticket y su ticket padre de hilo (via.source.from.ticket_id
   *    con rel === "follow_up"), que es el identificador relacional real de Zendesk.
   * 2. Busca un caso existente relacionado con el ticket (por ticket principal,
   *    ticket padre o interacción relacionada) → lo REUTILIZA.
   * 3. Si existe un caso del ticket padre de hilo → REUTILIZA y asocia esta
   *    interacción como relacionada.
   * 4. Si no existe → crea un caso nuevo con ticket principal + ticket_padre_id.
   *
   * NUNCA crea primero y pregunta después. Es idempotente y resistente a
   * concurrencia gracias a UNIQUE(caso_id, ticket_id) y UNIQUE(ticket_id, tipo).
   */
  async crearDesdeCategorizacion(input: {
    ticketId: string;
    ticketPadreId?: string | null;
    tipo: "devolucion" | "queja";
    asesor: string | null;
    dominio?: string | null;
    pais?: string | null;
    estado?: string | null;
    clasificacion?: string | null;
    resultado?: string | null;
  }, usuario: string | null): Promise<{ caso: QdCasoRow; reutilizado: boolean; interaccionAsociada: boolean }> {
    const tipo = input.tipo;
    const ticketId = input.ticketId;

    // 1) Idempotencia / duplicado directo: este ticket ya es el principal de un caso.
    let existente = await qdRepository.porTicketGeneral(ticketId, tipo);
    if (existente) {
      return { caso: existente, reutilizado: true, interaccionAsociada: false };
    }

    // 2) Hilo: si este ticket es follow_up de un ticket padre que ya tiene caso,
    //    reutilizarlo y registrar esta interacción como relacionada.
    if (input.ticketPadreId) {
      const casoPadre = await qdRepository.porTicketGeneral(input.ticketPadreId, tipo);
      if (casoPadre) {
        const interaccion = await qdRepository.asociarInteraccion(casoPadre.id, ticketId, usuario ?? input.asesor);
        await qdRepository.registrarAuditoria(
          casoPadre.id, usuario ?? input.asesor, "interaccion_asociada", "ticket",
          null, `Ticket #${ticketId} asociado al caso ${casoPadre.numero} (hilo follow_up de #${input.ticketPadreId})`,
        );
        return { caso: casoPadre, reutilizado: true, interaccionAsociada: !!interaccion };
      }
    }

    // 3) Crear caso nuevo. La creación automática desde categorización no exige
    //    datos completos (el asesor los completa después). origen = CATEGORIZACION.
    const caso = await this.crear({
      tipo,
      ticketId,
      ticketPadreId: input.ticketPadreId ?? null,
      asesor: input.asesor,
      dominio: input.dominio ?? null,
      pais: input.pais ?? null,
      estado: input.estado ?? "Pendiente de conciliación",
      resultado: input.resultado ?? null,
      clasificacion: input.clasificacion ?? null,
      origen: "CATEGORIZACION",
    }, usuario ?? input.asesor, true);
    return { caso, reutilizado: false, interaccionAsociada: false };
  },

  /**
   * Asocia un ticket existente a un caso como interacción relacionada.
   * Idempotente (UNIQUE caso_id + ticket_id). Útil para vincular
   * tickets del mismo hilo detectados después de la creación.
   */
  async asociarInteraccion(casoId: string, ticketId: string, usuario: string | null): Promise<QdInteraccionRow | null> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    const interaccion = await qdRepository.asociarInteraccion(casoId, ticketId, usuario);
    if (interaccion) {
      await qdRepository.registrarAuditoria(
        casoId, usuario, "interaccion_asociada", "ticket",
        null, `Ticket #${ticketId} asociado al caso ${caso.numero}`,
      );
    }
    return interaccion;
  },

  /**
   * Eliminación controlada (soft delete) de un caso Q/D.
   * Solo se permite para casos de origen MANUAL.
   * Los casos creados desde categorización (CATEGORIZACION) no pueden eliminarse.
   */
  async eliminar(id: string, usuario: string | null): Promise<QdCasoRow> {
    const caso = await qdRepository.porId(id);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");

    if (caso.origen !== "MANUAL") {
      throw new DomainError(
        "Los casos creados desde una categorización de atención no pueden eliminarse desde este módulo.",
        "ORIGEN_NO_ELIMINABLE",
      );
    }

    const eliminado = await qdRepository.eliminarLogico(id, usuario);
    if (!eliminado) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");

    // Auditoría de eliminación con trazabilidad completa.
    await qdRepository.registrarAuditoria(
      id, usuario, "ELIMINACION", "caso",
      JSON.stringify({
        tipo: caso.tipo,
        origen: caso.origen,
        dominio: caso.dominio,
        ticket_id: caso.ticket_id,
      }),
      `Caso ${caso.numero} eliminado lógicamente (${caso.tipo}, origen ${caso.origen})`,
    );

    return eliminado;
  },

  /** Crear caso. Si viene con ticket, evita duplicados (ticket_id + tipo únicos). */
  async crear(input: CrearCasoInput, usuario: string | null, parcial = false) {
    // Dominio obligatorio SIEMPRE (manual y automático): no puede ser null, "" ni solo espacios.
    const dominio = typeof input.dominio === "string" ? input.dominio.trim() : "";
    if (!dominio) {
      throw new DomainError("El dominio es obligatorio para registrar el caso.", "DOMINIO_REQUERIDO");
    }
    // La creación automática desde categorización permite datos incompletos
    // (el asesor completará clasificación/área/producto/motivo después).
    if (!parcial) validarCaso(input);

    // Monto devuelto: calcular desde monto_pagado × porcentaje / 100.
    const montoDevuelto = input.montoDevuelto ?? calcularMontoDevuelto(input.montoPagado, input.porcentaje);

    if (input.ticketId) {
      const existente = await qdRepository.porTicket(input.ticketId, input.tipo);
      if (existente) {
        throw new DomainError(
          `Este ticket ya tiene un caso de ${input.tipo} asociado.`,
          "CASO_DUPLICADO",
        );
      }
    }

    const caso = await qdRepository.crear({ ...input, asesor: input.asesor ?? usuario ?? null, montoDevuelto });
    await qdRepository.registrarAuditoria(caso.id, usuario, "creacion", "caso", null, `Caso ${caso.numero} creado`);
    return caso;
  },

  async actualizar(id: string, patch: Partial<Omit<CrearCasoInput, "tipo" | "ticketId">> & { ticketId?: string | null }, usuario: string | null) {
    const caso = await qdRepository.porId(id);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");

    // Recalcular monto devuelto si cambió monto_pagado o porcentaje y no se envió explícito.
    const montoPagado = patch.montoPagado !== undefined ? patch.montoPagado : caso.monto_pagado;
    const porcentaje = patch.porcentaje !== undefined ? patch.porcentaje : caso.porcentaje;
    const montoDevuelto = patch.montoDevuelto ?? calcularMontoDevuelto(montoPagado, porcentaje);

    // Validar coherencia en el estado resultante.
    validarCaso({
      tipo: caso.tipo as "devolucion" | "queja",
      ticketId: patch.ticketId ?? caso.ticket_id,
      dominio: patch.dominio !== undefined ? patch.dominio : caso.dominio,
      montoPagado,
      porcentaje,
      montoDevuelto,
      resultado: patch.resultado !== undefined ? patch.resultado : caso.resultado,
      clasificacion: patch.clasificacion !== undefined ? patch.clasificacion : caso.clasificacion,
      area: patch.area !== undefined ? patch.area : caso.area,
      producto: patch.producto !== undefined ? patch.producto : caso.producto,
      motivo: patch.motivo !== undefined ? patch.motivo : caso.motivo,
    });

    const final = { ...patch, montoDevuelto };
    const actualizado = await qdRepository.actualizar(id, final);
    if (!actualizado) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");

    // Auditoría: registrar campos modificados.
    for (const [campo, valorNuevo] of Object.entries(final)) {
      const key = campo as keyof CrearCasoInput;
      const columna = campo === "ticketId" ? "ticket_id" : campo;
      const anterior = (caso as any)[columna];
      const nuevo = valorNuevo;
      if (String(anterior ?? "") !== String(nuevo ?? "")) {
        await qdRepository.registrarAuditoria(
          id, usuario, "edicion", campo,
          anterior == null ? null : String(anterior),
          nuevo == null ? null : String(nuevo),
        );
      }
    }

    return actualizado;
  },

  // ── Catálogos ──
  async listarEstados() { return qdRepository.listarCatalogo("qd_estados"); },
  async listarResultados() { return qdRepository.listarCatalogo("qd_resultados"); },
  async listarAreas() { return qdRepository.listarCatalogo("qd_areas"); },
  async listarProductos() { return qdRepository.listarCatalogo("qd_productos"); },
  async listarTiposQueja() { return qdRepository.listarCatalogo("qd_tipos_queja"); },
};
