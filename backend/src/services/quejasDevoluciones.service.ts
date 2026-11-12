import { qdRepository, type CrearCasoInput, type QdCasoRow, type QdInteraccionRow, type DbExecutor } from "../repositories/quejasDevoluciones.repository";
import { prisma } from "../repositories/prisma";
import {
  reconstruirCasosBackfill,
  reconciliarCasosQD,
  normalizarDominio,
  normalizarCanal,
  resolverDominioQyd,
  DOMINIO_SIN_DOMINIO,
  ESTADO_CERRADO,
  esDominioSinDominio,
  type ReconstruccionResultado,
} from "./quejasCasos.service";
import { resolverCadenaTicket, validarCadenaEnTx, bloquearRaizTipo, esViolacionUnica } from "./qdCaseResolution.service";
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

/**
 * Primitiva transaccional de creación de caso Q/D (O4-D, F03).
 * Recibe `tx`; NO abre su propia transacción. Caso + auditoría atómicos.
 */
async function createQydCasoConTx(tx: DbExecutor, input: CrearCasoInput, usuario: string | null, parcial: boolean): Promise<QdCasoRow> {
  const dominio = typeof input.dominio === "string" ? input.dominio.trim() : "";
  if (!dominio) {
    throw new DomainError("El dominio es obligatorio para registrar el caso.", "DOMINIO_REQUERIDO");
  }
  if (!parcial) validarCaso(input);
  const montoDevuelto = input.montoDevuelto ?? calcularMontoDevuelto(input.montoPagado, input.porcentaje);
  if (input.ticketId) {
    const existente = await qdRepository.porTicket(input.ticketId, input.tipo, tx);
    if (existente) {
      throw new DomainError(`Este ticket ya tiene un caso de ${input.tipo} asociado.`, "CASO_DUPLICADO");
    }
  }
  const caso = await qdRepository.crear({ ...input, asesor: input.asesor ?? usuario ?? null, montoDevuelto }, tx);
  await qdRepository.registrarAuditoria(caso.id, usuario, "creacion", "caso", null, `Caso ${caso.numero} creado`, tx);
  return caso;
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
   * REGLA DE NEGOCIO (H-04/H-05): un caso representa el proceso completo de
   * gestión de un problema, no un correo individual. La agrupación se basa
   * EXCLUSIVAMENTE en relaciones Zendesk verificadas (follow_up):
   *
   * 1. Resuelve la cadena completa hasta la raíz ANTES de la transacción.
   * 2. Dentro de una transacción breve toma un advisory lock determinista
   *    (raíz + tipo) y revalida que la cadena no cambió.
   * 3. Busca un caso existente para la raíz o cualquier ticket de la cadena.
   * 4. Si no existe, crea el caso con ticket_id = raíz e inserta la cadena de
   *    interacciones (raíz principal, resto relacionadas).
   * 5. Caso, interacciones y auditoría se confirman o revierten juntos.
   *
   * No se usa dominio + tipo para fusionar tickets sin relación. Tampoco se
   * modifica qd_casos de casos existentes ni se completa el principal faltante
   * de casos históricos.
   */
  async crearDesdeCategorizacion(input: {
    ticketId: string;
    ticketPadreId?: string | null;
    /** Tickets hijos ya observados en la consulta fresca a Zendesk. */
    followupIds?: string[];
    /** true solo si la lectura del ticket fue completa y confiable. */
    relacionVerificada?: boolean;
    tipo: "devolucion" | "queja";
    asesor: string | null;
    dominio?: string | null;
    /** Valor crudo del dominio, conservado para auditoría si queda SIN DOMINIO. */
    dominioOriginal?: string | null;
    pais?: string | null;
    estado?: string | null;
    clasificacion?: string | null;
    resultado?: string | null;
    canal?: string | null;
    /** Estado real del ticket Zendesk; se conserva para trazabilidad, NO bloquea la creación. */
    estadoTicket?: string | null;
    /** Fecha de origen exacta del ticket (YYYY-MM-DD o ISO YYYY-MM-DDTHH:MM:SSZ). */
    fechaSolicitud?: string | null;
    /** false = resolución de relaciones solo desde PostgreSQL, sin API Zendesk. */
    permitirZendesk?: boolean;
    /**
     * Permite crear la raíz cuando no hay relación verificada y el ticket no
     * tiene dominio. Solo aplica a tickets QyD sin dominio, que por regla deben
     * crear/reutilizar expediente y quedar CERRADOS. Por defecto true cuando el
     * dominio resuelto es SIN DOMINIO.
     */
    permitirSinRelacionVerificada?: boolean;
    /**
     * false = usa las relaciones existentes sin escribir/refrescar
     * `qd_relaciones_ticket`. La carga histórica no debe modificar relaciones
     * ya registradas.
     */
    persistirRelacion?: boolean;
  }, usuario: string | null): Promise<{
    caso: QdCasoRow | null;
    reutilizado: boolean;
    interaccionAsociada: boolean;
    creado: boolean;
    motivoNoCreacion?: string;
  }> {
    const tipo = input.tipo;
    const ticketId = input.ticketId;
    const usuarioCaso = usuario ?? input.asesor ?? null;

    // ── VALIDACIONES OBLIGATORIAS ANTES DE CREAR ──
    // 1. Canal real debe ser CORREO, CHAT o WHATSAPP. Nunca se asume CORREO.
    const canal = normalizarCanal(input.canal);
    if (!canal) {
      return { caso: null, reutilizado: false, interaccionAsociada: false, creado: false, motivoNoCreacion: "PENDIENTE_CANAL" };
    }
    // 2. El estado del ticket NO bloquea la creación: el expediente representa
    //    el proceso de gestión y es independiente del estado de la conversación.
    // 3. Dominio: si no es válido (vacío, correo o placeholder), se persiste
    //    SIN DOMINIO y el expediente queda CERRADO. No bloquea la creación.
    const dominioEntrada = input.dominioOriginal !== undefined
      ? input.dominioOriginal
      : input.dominio;
    const dominioResuelto = resolverDominioQyd(dominioEntrada);
    const sinDominio = dominioResuelto.sinDominio;
    const dominioCaso = dominioResuelto.dominio;
    // Conserva el valor crudo recibido (incluido null/vacío). No reemplaza el
    // original por el marcador SIN DOMINIO.
    const dominioOriginal = input.dominioOriginal !== undefined
      ? input.dominioOriginal
      : dominioResuelto.original;

    /**
     * Reutiliza un expediente existente SIN modificarlo.
     *
     * Regla de esta carga: los expedientes existentes conservan exactamente
     * su estado, dominio, fecha y datos operativos. La regla SIN DOMINIO /
     * CERRADO solo se aplica a expedientes nuevos.
     */
    const reutilizarExistente = async (existente: QdCasoRow): Promise<{
      caso: QdCasoRow;
      reutilizado: true;
      interaccionAsociada: false;
      creado: false;
    }> => {
      return { caso: existente, reutilizado: true, interaccionAsociada: false, creado: false };
    };

    // Si el ticket ya está representado por un expediente del mismo tipo
    // (principal, padre o interacción), se reutiliza sin exigir una cadena
    // adicional. No se inventa ninguna relación: el vínculo ya existe en BD.
    const existenteDirecto = await qdRepository.porTicketGeneral(ticketId, tipo);
    if (existenteDirecto) return reutilizarExistente(existenteDirecto);

    // H-04: resolver la raíz/cadena fuera de la transacción, para no mantener
    // el advisory lock durante llamadas de red a Zendesk.
    const resolucion = await resolverCadenaTicket(ticketId, {
      ...(input.relacionVerificada && input.ticketPadreId !== undefined
        ? { padreConocido: input.ticketPadreId }
        : {}),
      ...(input.relacionVerificada && input.followupIds !== undefined
        ? { followupIds: input.followupIds }
        : {}),
      ...(input.permitirZendesk === false ? { permitirZendesk: false } : {}),
      ...(input.persistirRelacion === false ? { noPersistir: true } : {}),
    });

    // Raíz independiente cuando no hay ninguna relación conocida (ni padre ni
    // follow-ups). Se habilita para SIN DOMINIO por regla de negocio y para la
    // carga multicanal explícita, donde la ausencia de relación no es un error.
    // Si hay un padre conocido, la cadena sigue siendo obligatoria.
    const permitirRaizSinRelacion = (sinDominio || input.permitirSinRelacionVerificada === true)
      && !input.ticketPadreId
      && (!input.followupIds || input.followupIds.length === 0);
    const resolucionOk = resolucion.ok
      ? resolucion
      : permitirRaizSinRelacion
        ? { ok: true as const, rootTicketId: ticketId, cadena: [ticketId], eslabones: [] }
        : null;
    if (!resolucionOk) {
      return {
        caso: null,
        reutilizado: false,
        interaccionAsociada: false,
        creado: false,
        motivoNoCreacion: "PENDIENTE_RELACION",
      };
    }
    const validarCadena = resolucion.ok;

    // Orden de búsqueda: raíz primero (clave canónica), luego el resto de la
    // cadena desde el ticket actual hacia arriba.
    const ticketsBusqueda = [
      resolucionOk.rootTicketId,
      ...resolucionOk.cadena.filter((t) => t !== resolucionOk.rootTicketId),
    ];

    try {
      const resultado = await prisma.$transaction(async (tx) => {
        await bloquearRaizTipo(tx, resolucionOk.rootTicketId, tipo);

        // La relación usada para resolver la raíz debe seguir siendo la misma.
        // En la excepción SIN DOMINIO sin relación conocida no hay eslabones que
        // validar: el ticket es su propia raíz y no se inventó un vínculo.
        if (validarCadena && resolucionOk.eslabones.length > 0) {
          const validacion = await validarCadenaEnTx(tx, resolucionOk);
          if (!validacion.ok) {
            return { ok: false as const, detalle: validacion.detalle };
          }
        }

        let existente: QdCasoRow | null = null;
        for (const t of ticketsBusqueda) {
          existente = await qdRepository.porTicketGeneral(t, tipo, tx);
          if (existente) break;
        }

        if (existente) {
          // El expediente existente NO se modifica: ni estado, ni dominio, ni
          // fecha, ni datos operativos. Solo se agrega la interacción del
          // ticket actual si aún no está representado por el caso.
          let interaccionAsociada = false;
          if (existente.ticket_id !== ticketId && existente.ticket_padre_id !== ticketId) {
            const interaccion = await qdRepository.asociarInteraccion(
              existente.id, ticketId, usuarioCaso, "relacionada", null, null, tx,
            );
            interaccionAsociada = !!interaccion;
            if (interaccion) {
              await qdRepository.registrarAuditoria(
                existente.id, usuarioCaso, "interaccion_asociada", "ticket",
                null, `Ticket #${ticketId} asociado al caso ${existente.numero} (raíz #${resolucionOk.rootTicketId})`, tx,
              );
            }
          }
          return { ok: true as const, caso: existente, reutilizado: true, interaccionAsociada, creado: false };
        }

        const caso = await createQydCasoConTx(tx, {
          tipo,
          ticketId: resolucionOk.rootTicketId,
          ticketPadreId: null,
          asesor: input.asesor,
          dominio: dominioCaso,
          pais: input.pais ?? null,
          estado: sinDominio ? ESTADO_CERRADO : input.estado ?? "Pendiente de conciliación",
          resultado: input.resultado ?? null,
          clasificacion: input.clasificacion ?? null,
          fechaSolicitud: input.fechaSolicitud ?? null,
          origen: "CATEGORIZACION",
          casoCerrado: sinDominio,
          cerradoPor: sinDominio ? usuarioCaso : null,
        }, usuarioCaso, true);

        if (sinDominio) {
          await qdRepository.registrarAuditoria(
            caso.id, usuarioCaso, "dominio_sin_dominio", "dominio",
            dominioOriginal, DOMINIO_SIN_DOMINIO, tx,
          );
          await qdRepository.registrarAuditoria(
            caso.id, usuarioCaso, "estado_sin_dominio", "estado",
            null, ESTADO_CERRADO, tx,
          );
        }

        let interaccionAsociada = false;
        for (const t of resolucionOk.cadena) {
          const tipoRelacion = t === resolucionOk.rootTicketId ? "principal" : "relacionada";
          const interaccion = await qdRepository.asociarInteraccion(
            caso.id,
            t,
            usuarioCaso,
            tipoRelacion,
            t === ticketId ? canal : null,
            t === ticketId ? new Date() : null,
            tx,
          );
          if (interaccion) {
            interaccionAsociada = true;
            const detalle = t === resolucionOk.rootTicketId
              ? `Ticket #${t} registrado como principal del caso ${caso.numero}`
              : `Ticket #${t} asociado al caso ${caso.numero} (cadena de #${ticketId})`;
            await qdRepository.registrarAuditoria(
              caso.id, usuarioCaso, "interaccion_asociada", "ticket", null, detalle, tx,
            );
          }
        }

        return { ok: true as const, caso, reutilizado: false, interaccionAsociada, creado: true };
      });

      if (!resultado.ok) {
        return {
          caso: null,
          reutilizado: false,
          interaccionAsociada: false,
          creado: false,
          motivoNoCreacion: "PENDIENTE_RELACION",
        };
      }
      return resultado;
    } catch (err) {
      // Protección adicional ante una carrera que haya violado
      // UNIQUE(ticket_id, tipo): reconsultar y devolver el caso existente.
      if (esViolacionUnica(err)) {
        for (const t of ticketsBusqueda) {
          const existente = await qdRepository.porTicketGeneral(t, tipo);
          if (existente) {
            return reutilizarExistente(existente);
          }
        }
        // El conflicto era del expediente, pero el ganador ya no es visible.
        // No devolver un éxito falso: propagar un error de concurrencia trazable.
        console.warn(
          `[QD] Conflicto UNIQUE sin expediente visible ticket=${ticketId} tipo=${tipo} root=${resolucionOk.rootTicketId}`,
        );
        throw new DomainError(
          "Conflicto de concurrencia al crear el expediente. Reintente la operación.",
          "CONFLICTO_CONCURRENCIA",
        );
      }
      throw err;
    }
  },

  /**
   * Asocia un ticket existente a un caso como interacción relacionada.
   * Idempotente (UNIQUE caso_id + ticket_id). Útil para vincular
   * tickets del mismo hilo detectados después de la creación.
   */
  async asociarInteraccion(casoId: string, ticketId: string, usuario: string | null): Promise<QdInteraccionRow | null> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    return prisma.$transaction(async (tx) => {
      const interaccion = await qdRepository.asociarInteraccion(casoId, ticketId, usuario, "relacionada", null, null, tx);
      if (interaccion) {
        await qdRepository.registrarAuditoria(
          casoId, usuario, "interaccion_asociada", "ticket",
          null, `Ticket #${ticketId} asociado al caso ${caso.numero}`, tx,
        );
      }
      return interaccion;
    });
  },

  /** Asigna (o actualiza) el dominio de un caso manualmente. Auditable. NO fusiona casos. */
  async asignarDominio(casoId: string, dominio: string | null, usuario: string | null): Promise<QdCasoRow> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    const d = dominio ? normalizarDominio(dominio) : "";
    return prisma.$transaction(async (tx) => {
      const actualizado = await qdRepository.asignarDominio(casoId, d || null, usuario, tx);
      if (!actualizado) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
      if (normalizarDominio(String(caso.dominio ?? "")) !== d) {
        await qdRepository.registrarAuditoria(
          casoId, usuario, "asignacion_dominio", "dominio",
          caso.dominio, d || null, tx,
        );
      }
      return actualizado;
    });
  },

  /** Cierra un caso manualmente. Transacción + CAS: solo gana si estaba abierto. */
  async cerrarCaso(casoId: string, usuario: string | null): Promise<QdCasoRow> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    if (caso.caso_cerrado) throw new DomainError("El caso ya está cerrado", "CASO_CERRADO");
    return prisma.$transaction(async (tx) => {
      const cerrado = await qdRepository.cerrarCaso(casoId, usuario, tx);
      if (!cerrado) throw new DomainError("El caso ya está cerrado", "CASO_CERRADO"); // CAS pierde → rollback, sin auditoría
      await qdRepository.registrarAuditoria(
        casoId, usuario, "cierre_caso", "caso",
        "ABIERTO", "CERRADO", tx,
      );
      return cerrado;
    });
  },

  /**
   * Reabre un caso cerrado. Transacción + CAS: solo gana si estaba cerrado.
   */
  async reabrirCaso(casoId: string, usuario: string | null): Promise<QdCasoRow> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    if (!caso.caso_cerrado) throw new DomainError("El caso ya está abierto", "CASO_ABIERTO");
    return prisma.$transaction(async (tx) => {
      const reabierto = await qdRepository.reabrirCaso(casoId, usuario, tx);
      if (!reabierto) throw new DomainError("El caso ya está abierto", "CASO_ABIERTO"); // CAS pierde → rollback, sin auditoría
      await qdRepository.registrarAuditoria(
        casoId, usuario, "reapertura_caso", "caso",
        "CERRADO", "ABIERTO", tx,
      );
      return reabierto;
    });
  },

  /**
   * CONSOLIDA varios casos secundarios en un caso principal.
   *
   * La operación NO cambia el estado del principal ni de los secundarios.
   * El estado `CERRADO` es válido y no impide consolidar: los casos cerrados
   * conservan exactamente su estado y solo se marca `consolidado_en` en los
   * secundarios. El estado se valida contra `qd_estados` en PostgreSQL.
   *
   * Transacción atómica: si no se consolidan todos los secundarios, se lanza
   * error y se revierte todo (interacciones, marcas y auditoría).
   */
  async consolidarCasos(principalId: string, idsSecundarios: string[], usuario: string | null, motivo?: string | null): Promise<{ principal: QdCasoRow; consolidados: number }> {
    const principal = await qdRepository.porId(principalId);
    if (!principal) throw new DomainError("Caso principal no encontrado", "NO_ENCONTRADO");
    if (principal.consolidado_en) throw new DomainError("El caso principal no puede ser un caso ya consolidado", "CONSOLIDACION_INVALIDA");

    const secs = new Set(idsSecundarios);
    secs.delete(principalId);
    const ids = [...secs];
    if (ids.length === 0) throw new DomainError("Selecciona al menos un caso secundario", "CONSOLIDACION_INVALIDA");

    // Validar que todos los secundarios sean del mismo tipo y no estén consolidados.
    // No se rechazan casos cerrados: se conserva su estado sin modificarlo.
    for (const id of ids) {
      const c = await qdRepository.porId(id);
      if (!c) throw new DomainError("Un caso secundario no existe", "CONSOLIDACION_INVALIDA");
      if (c.tipo !== principal.tipo) throw new DomainError("No se pueden consolidar casos de distinto tipo (Queja ≠ Devolución)", "CONSOLIDACION_TIPO_DISTINTO");
      if (c.consolidado_en) throw new DomainError(`El caso ${c.numero} ya fue consolidado`, "CONSOLIDACION_INVALIDA");
    }

    return prisma.$transaction(async (tx) => {
      const consolidados = await qdRepository.consolidarCasos(principalId, ids, usuario, tx);
      // Debe consolidarse la totalidad; si otro proceso tomó alguno, rollback.
      if (consolidados !== ids.length) {
        throw new DomainError("No se pudo consolidar todos los casos (conflicto de estado)", "CONSOLIDACION_INVALIDA");
      }
      await qdRepository.registrarAuditoria(
        principalId, usuario, "consolidacion_casos", "caso",
        null, `Consolidados ${consolidados} caso(s) en ${principal.numero}${motivo ? ` — Motivo: ${motivo}` : ""}`, tx,
      );
      for (const id of ids) {
        const c = await qdRepository.porId(id);
        if (c) {
          await qdRepository.registrarAuditoria(
            id, usuario, "consolidado_en", "caso",
            null, `Caso consolidado en ${principal.numero}`, tx,
          );
        }
      }
      return { principal, consolidados };
    });
  },

  /** Vincula un ticket existente a un caso como contacto/interacción. Atómico (F03). */
  async vincularTicket(casoId: string, ticketId: string, usuario: string | null, canal?: string | null): Promise<QdInteraccionRow | null> {
    const caso = await qdRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    return prisma.$transaction(async (tx) => {
      const interaccion = await qdRepository.asociarInteraccion(casoId, ticketId, usuario, "relacionada", canal ?? null, new Date(), tx);
      if (interaccion) {
        await qdRepository.registrarAuditoria(
          casoId, usuario, "interaccion_asociada", "ticket",
          null, `Ticket #${ticketId} vinculado al caso ${caso.numero}`, tx,
        );
      }
      return interaccion;
    });
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
        "Los casos creados desde una categorizaci��n de atenci��n no pueden eliminarse desde este m��dulo.",
        "ORIGEN_NO_ELIMINABLE",
      );
    }

    // Soft delete + auditoría atómicos (F03).
    return prisma.$transaction(async (tx) => {
      const eliminado = await qdRepository.eliminarLogico(id, usuario, tx);
      if (!eliminado) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
      await qdRepository.registrarAuditoria(
        id, usuario, "ELIMINACION", "caso",
        JSON.stringify({
          tipo: caso.tipo,
          origen: caso.origen,
          dominio: caso.dominio,
          ticket_id: caso.ticket_id,
        }),
        JSON.stringify({
          eliminado: true,
          eliminado_at: new Date().toISOString(),
          eliminado_por: usuario,
        }),
        tx,
      );
      return eliminado;
    });
  },

  /** Crear caso. Si viene con ticket, evita duplicados (ticket_id + tipo únicos). */
async crear(input: CrearCasoInput, usuario: string | null, parcial = false) {
    return prisma.$transaction((tx) => createQydCasoConTx(tx, input, usuario, parcial));
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
    // Actualización + auditoría atómicas (F03).
    return prisma.$transaction(async (tx) => {
      const actualizado = await qdRepository.actualizar(id, final, tx);
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
            tx,
          );
        }
      }

      return actualizado;
    });
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
      // `SIN DOMINIO` es un valor de expediente, no una opción del catálogo.
      if (n && !esDominioSinDominio(n)) set.add(n);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  },
};
