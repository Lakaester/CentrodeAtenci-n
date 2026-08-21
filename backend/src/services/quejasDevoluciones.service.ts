import { qdRepository, type CrearCasoInput, type QdCasoRow, type QdInteraccionRow } from "../repositories/quejasDevoluciones.repository";
import { reconstruirCasosBackfill, normalizarDominio, type ReconstruccionResultado } from "./quejasCasos.service";
import { DomainError } from "../core/errors/types";

function calcularMontoDevuelto(montoPagado: number | null | undefined, porcentaje: number | null | undefined): number | null {
  if (montoPagado == null || porcentaje == null) return null;
  return Math.round(montoPagado * (porcentaje / 100) * 100) / 100;
}

/**
 * Calcula el porcentaje conciliado a partir del monto solicitado y el monto
 * real a devolver, redondeado a 2 decimales y acotado a 0–100. Devuelve null
 * si no se puede derivar (faltan datos o el solicitado es 0).
 */
function calcularPorcentajeDesdeMontos(montoPagado: number | null | undefined, montoDevuelto: number | null | undefined): number | null {
  if (montoPagado == null || montoDevuelto == null || montoPagado === 0) return null;
  const pct = (montoDevuelto / montoPagado) * 100;
  return Math.max(0, Math.min(100, Math.round(pct * 100) / 100));
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

  /**
   * Carga retroactiva (BACKFILL) de Quejas y Devoluciones.
   *
   * Reconstruye los casos reales a partir del histórico de public.v_unificado_norm
   * aplicando la regla de evidencia del modelo CASO → N TICKETS:
   *   1. Relación explícita follow_up de Zendesk (prioridad 1).
   *   2. Identidad real + dominio normalizado + tipo (prioridad 2).
   *   3. Sin relación → caso independiente.
   *
   * Es IDEMPOTENTE: borra los casos BACKFILL previos y reconstruye con la misma
   * evidencia, generando el mismo resultado cada vez.
   *
   * @param desde fecha de inicio (YYYY-MM-DD)
   * @param hasta fecha de fin (YYYY-MM-DD)
   */
  async backfillQuejasDevoluciones(desde: string, hasta: string): Promise<ReconstruccionResultado & { omitidos: number; encontrados: number }> {
    const inicio = new Date(desde + "T00:00:00");
    const fin = new Date(hasta + "T00:00:00");
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new DomainError("Fechas inválidas. Formato esperado: YYYY-MM-DD", "FECHAS_INVALIDAS");
    }
    if (inicio > fin) {
      throw new DomainError("La fecha de inicio no puede ser posterior a la de fin", "FECHAS_INVALIDAS");
    }

    const r = await reconstruirCasosBackfill(desde, hasta);
    return { ...r, encontrados: r.ticketsHistoricos, omitidos: 0 };
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

    // 2.5) Caso ABIERTO relacionado: si el ticket tiene dominio y existe un caso
    //      abierto del mismo dominio + tipo, vincular el ticket a ese caso.
    //      NO se usa ventana temporal rígida: el caso permanece abierto hasta
    //      que el asesor lo cierre manualmente.
    if (input.dominio && !input.ticketPadreId) {
      const casoAbierto = await qdRepository.buscarCasoAbiertoParaTicket({ tipo, dominio: input.dominio });
      if (casoAbierto) {
        const interaccion = await qdRepository.asociarInteraccion(casoAbierto.id, ticketId, usuario ?? input.asesor, "relacionada", null, new Date());
        await qdRepository.registrarAuditoria(
          casoAbierto.id, usuario ?? input.asesor, "interaccion_asociada", "ticket",
          null, `Ticket #${ticketId} vinculado al caso abierto ${casoAbierto.numero} (mismo dominio ${input.dominio})`,
        );
        return { caso: casoAbierto, reutilizado: true, interaccionAsociada: !!interaccion };
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

  /** Asigna (o actualiza) el dominio de un caso manualmente. Auditable. NO fusiona casos. */
  async asignarDominio(casoId: string, dominio: string | null, usuario: string | null): Promise<QdCasoRow> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    const d = typeof dominio === "string" ? dominio.trim() : "";
    const actualizado = await qdRepository.asignarDominio(casoId, d || null, usuario);
    if (!actualizado) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    if (String(caso.dominio ?? "") !== d) {
      await qdRepository.registrarAuditoria(
        casoId, usuario, "asignacion_dominio", "dominio",
        caso.dominio, d || null,
      );
    }
    return actualizado;
  },

  /** Cierra un caso manualmente. Un nuevo asunto posterior creará un caso nuevo. */
  async cerrarCaso(casoId: string, usuario: string | null): Promise<QdCasoRow> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    if (caso.caso_cerrado) throw new DomainError("El caso ya está cerrado", "CASO_CERRADO");
    const cerrado = await qdRepository.cerrarCaso(casoId, usuario);
    if (!cerrado) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    await qdRepository.registrarAuditoria(
      casoId, usuario, "cierre_caso", "caso",
      "ABIERTO", "CERRADO",
    );
    return cerrado;
  },

  /**
   * Reabre un caso cerrado. Conserva tickets, interacciones y datos; solo
   * revierte el estado de cierre para que pueda volver a recibir tickets
   * relacionados.
   */
  async reabrirCaso(casoId: string, usuario: string | null): Promise<QdCasoRow> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    if (!caso.caso_cerrado) throw new DomainError("El caso ya está abierto", "CASO_ABIERTO");
    const reabierto = await qdRepository.reabrirCaso(casoId, usuario);
    if (!reabierto) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    await qdRepository.registrarAuditoria(
      casoId, usuario, "reapertura_caso", "caso",
      "CERRADO", "ABIERTO",
    );
    return reabierto;
  },

  /**
   * CONSOLIDA varios casos secundarios en un caso principal.
   * Reglas: mismo tipo; el caso principal no debe ser secundario ni cerrado.
   * Todos los tickets pasan al caso principal; los secundarios quedan marcados
   * como consolidados (consolidado_en) conservando trazabilidad.
   */
  async consolidarCasos(principalId: string, idsSecundarios: string[], usuario: string | null, motivo?: string | null): Promise<{ principal: QdCasoRow; consolidados: number }> {
    const principal = await qdRepository.porId(principalId);
    if (!principal) throw new DomainError("Caso principal no encontrado", "NO_ENCONTRADO");
    if (principal.consolidado_en) throw new DomainError("El caso principal no puede ser un caso ya consolidado", "CONSOLIDACION_INVALIDA");
    if (principal.caso_cerrado) throw new DomainError("No se puede consolidar sobre un caso cerrado", "CONSOLIDACION_INVALIDA");

    const secs = new Set(idsSecundarios);
    secs.delete(principalId);
    const ids = [...secs];
    if (ids.length === 0) throw new DomainError("Selecciona al menos un caso secundario", "CONSOLIDACION_INVALIDA");

    // Validar que todos los secundarios sean del mismo tipo y no estén consolidados.
    for (const id of ids) {
      const c = await qdRepository.porId(id);
      if (!c) throw new DomainError("Un caso secundario no existe", "CONSOLIDACION_INVALIDA");
      if (c.tipo !== principal.tipo) throw new DomainError("No se pueden consolidar casos de distinto tipo (Queja ≠ Devolución)", "CONSOLIDACION_TIPO_DISTINTO");
      if (c.consolidado_en) throw new DomainError(`El caso ${c.numero} ya fue consolidado`, "CONSOLIDACION_INVALIDA");
      if (c.caso_cerrado) throw new DomainError(`El caso ${c.numero} está cerrado`, "CONSOLIDACION_INVALIDA");
    }

    const consolidados = await qdRepository.consolidarCasos(principalId, ids, usuario);
    await qdRepository.registrarAuditoria(
      principalId, usuario, "consolidacion_casos", "caso",
      null, `Consolidados ${ids.length} caso(s) en ${principal.numero}${motivo ? ` — Motivo: ${motivo}` : ""}`,
    );
    for (const id of ids) {
      const c = await qdRepository.porId(id);
      if (c) {
        await qdRepository.registrarAuditoria(
          id, usuario, "consolidado_en", "caso",
          null, `Caso consolidado en ${principal.numero}`,
        );
      }
    }
    return { principal, consolidados };
  },

  /** Vincula un ticket existente a un caso como contacto/interacción. */
  async vincularTicket(casoId: string, ticketId: string, usuario: string | null, canal?: string | null): Promise<QdInteraccionRow | null> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    const interaccion = await qdRepository.asociarInteraccion(casoId, ticketId, usuario, "relacionada", canal ?? null, new Date());
    if (interaccion) {
      await qdRepository.registrarAuditoria(
        casoId, usuario, "interaccion_asociada", "ticket",
        null, `Ticket #${ticketId} vinculado al caso ${caso.numero}`,
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

    // Normalizar valores NUMERIC leídos de la BD: PostgreSQL/Prisma los entrega
    // como string (ej. "100"). Se convierten a número para que las comparaciones
    // y validaciones sean correctas sin importar la procedencia (BD o frontend).
    const n = (v: unknown): number | null => (v == null || v === "" ? null : Number(v));

    // ── Coherencia Monto solicitado / % conciliado / Monto real a devolver ──
    // Se conservan los tres conceptos por separado (no se sobrescribe el
    // solicitado). Reglas:
    //  - Si cambia el % → se recalcula el monto real a devolver.
    //  - Si se edita directamente el monto real a devolver → se recalcula el %.
    //  - Si faltan datos o se borra un campo, permanece NULL (no se inventa 0).
    let montoPagado = patch.montoPagado !== undefined ? n(patch.montoPagado) : n(caso.monto_pagado);
    let porcentaje = patch.porcentaje !== undefined ? n(patch.porcentaje) : n(caso.porcentaje);
    let montoDevuelto = patch.montoDevuelto !== undefined ? n(patch.montoDevuelto) : n(caso.monto_devuelto);

    const cambioPorcentaje = patch.porcentaje !== undefined;
    const cambioMontoDevuelto = patch.montoDevuelto !== undefined;
    const cambioMontoPagado = patch.montoPagado !== undefined;

    if (cambioPorcentaje) {
      // Fuente: % → recalcular monto real (Opción A).
      montoDevuelto = calcularMontoDevuelto(montoPagado, porcentaje);
    } else if (cambioMontoDevuelto) {
      // Fuente: monto real → recalcular % (Opción B). Solo si no se editaron
      // ambos a la vez (en ese caso el % manda).
      if (!cambioPorcentaje) {
        porcentaje = calcularPorcentajeDesdeMontos(montoPagado, montoDevuelto);
      }
    } else if (cambioMontoPagado) {
      // Cambió el solicitado sin % explícito: re-derivar el monto real si había %.
      if (porcentaje != null) montoDevuelto = calcularMontoDevuelto(montoPagado, porcentaje);
    }

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

    const final = { ...patch, montoDevuelto, montoPagado, porcentaje };
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

  /**
   * Catálogo de dominios homologados (solo lectura).
   * Fuente: v_unificado_norm + qd_casos.dominio, normalizados con
   * `normalizarDominio`, deduplicados y ordenados. No crea tabla configurable.
   */
  async listarDominios(): Promise<string[]> {
    const raw = await qdRepository.listarDominiosRaw();
    const set = new Set<string>();
    for (const d of raw) {
      const n = normalizarDominio(d);
      if (n) set.add(n);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  },
};
