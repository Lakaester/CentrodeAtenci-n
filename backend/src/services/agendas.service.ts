import {
  agendasRepository,
  type CrearAgendaInput,
  type ActualizarAgendaInput,
  type AgendaRow,
} from "../repositories/agendas.repository";
import { googleCalendarService, clasificarErrorCalendar, type CalendarErrorCategory } from "../integrations/google/googleCalendar.service";
import { actaPdfService } from "./actaPdf.service";
import { prisma } from "../repositories/prisma";
import { DomainError } from "../core/errors/types";

function esperarMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
function jitterMs(): number {
  return Math.floor(Math.random() * 250);
}
function toDomainCalendarError(err: unknown): DomainError {
  if (err instanceof DomainError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  return new DomainError(`Error de sincronización con Google Calendar: ${msg}`, "CALENDAR_SYNC_ERROR");
}

const ESTADOS_VALIDOS = ["PENDIENTE", "ACTIVA", "FINALIZADA", "CANCELADA"];
const TIPOS_VALIDOS = ["REUNION", "CAPACITACION"];
const RESULTADOS_VALIDOS = ["REALIZADA", "SIN_REALIZAR", "CANCELADA"];

/** Transiciones permitidas para agendas */
const TRANSICIONES_PERMITIDAS: Record<string, string[]> = {
  PENDIENTE: ["ACTIVA", "CANCELADA"],
  ACTIVA: ["FINALIZADA", "CANCELADA"],
  FINALIZADA: [],
  CANCELADA: [],
};

/**
 * Combinaciones válidas de estado + resultado.
 * Si un estado no está en el mapa, cualquier resultado (incluido NULL) es válido.
 */
const RESULTADO_POR_ESTADO: Record<string, string[]> = {
  FINALIZADA: ["REALIZADA", "SIN_REALIZAR"],
  CANCELADA: ["CANCELADA"],
};

function validarCrear(input: CrearAgendaInput) {
  if (!input.asesorId?.trim()) throw new DomainError("El asesor es obligatorio", "ASESOR_REQUERIDO");
  if (!input.asesorCorreo?.trim()) throw new DomainError("El correo del asesor es obligatorio", "CORREO_REQUERIDO");
  if (!input.fecha?.trim()) throw new DomainError("La fecha es obligatoria", "FECHA_REQUERIDA");
  if (!input.horaInicio?.trim()) throw new DomainError("La hora de inicio es obligatoria", "HORA_INICIO_REQUERIDA");
  if (!input.horaFin?.trim()) throw new DomainError("La hora de fin es obligatoria", "HORA_FIN_REQUERIDA");
  if (!TIPOS_VALIDOS.includes(input.tipo)) {
    throw new DomainError(`Tipo inválido: ${input.tipo}`, "TIPO_INVALIDO");
  }
  if (input.horaInicio >= input.horaFin) {
    throw new DomainError("La hora de fin debe ser posterior a la hora de inicio", "HORA_INVALIDA");
  }
}

function calcularDuracionReal(inicioReal: string, finReal: string): number {
  const [h1, m1] = inicioReal.split(":").map(Number);
  const [h2, m2] = finReal.split(":").map(Number);
  const inicioMin = h1 * 60 + m1;
  const finMin = h2 * 60 + m2;
  return finMin - inicioMin;
}

function validarResultado(estado: string, resultado: string | null | undefined) {
  if (resultado === undefined || resultado === null) return;
  if (!RESULTADOS_VALIDOS.includes(resultado)) {
    throw new DomainError(`Resultado inválido: ${resultado}`, "RESULTADO_INVALIDO");
  }
  const permitidos = RESULTADO_POR_ESTADO[estado];
  if (permitidos && !permitidos.includes(resultado)) {
    throw new DomainError(
      `Resultado "${resultado}" no es válido para el estado "${estado}"`,
      "RESULTADO_INCOMPATIBLE"
    );
  }
}

export const agendasService = {
  async listar(filtros?: Parameters<typeof agendasRepository.listar>[0]) {
    return agendasRepository.listar(filtros);
  },

  async porId(id: string) {
    return agendasRepository.porId(id);
  },

  async crear(input: CrearAgendaInput, createdBy: string | null) {
    validarCrear(input);
    return agendasRepository.crear(input, createdBy);
  },

  async actualizar(id: string, input: ActualizarAgendaInput) {
    const existente = await agendasRepository.porId(id);
    if (!existente) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    if (existente.estado === "FINALIZADA" || existente.estado === "CANCELADA") {
      throw new DomainError("No se puede modificar una agenda finalizada o cancelada", "AGENDA_CERRADA");
    }
    if (input.estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(input.estado)) {
        throw new DomainError(`Estado inválido: ${input.estado}`, "ESTADO_INVALIDO");
      }
      const permitidos = TRANSICIONES_PERMITIDAS[existente.estado] ?? [];
      if (!permitidos.includes(input.estado)) {
        throw new DomainError(
          `Transición no permitida: ${existente.estado} → ${input.estado}`,
          "TRANSICION_INVALIDA"
        );
      }
      // Validar resultado contra el nuevo estado
      validarResultado(input.estado, input.resultado);
    } else {
      // Validar resultado contra el estado actual
      validarResultado(existente.estado, input.resultado);
    }
    if (input.tipo && !TIPOS_VALIDOS.includes(input.tipo)) {
      throw new DomainError(`Tipo inválido: ${input.tipo}`, "TIPO_INVALIDO");
    }
    return agendasRepository.actualizar(id, input);
  },

  async actualizarEstado(id: string, estado: string, calendarEventId?: string | null) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      throw new DomainError(`Estado inválido: ${estado}`, "ESTADO_INVALIDO");
    }
    const existente = await agendasRepository.porId(id);
    if (!existente) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    const permitidos = TRANSICIONES_PERMITIDAS[existente.estado] ?? [];
    if (!permitidos.includes(estado)) {
      throw new DomainError(
        `Transición no permitida: ${existente.estado} → ${estado}`,
        "TRANSICION_INVALIDA"
      );
    }
    // Auto-asignar resultado al cambiar a estado terminal
    let resultado: string | null = null;
    if (estado === "CANCELADA") {
      resultado = "CANCELADA";
    }
    // Transacción + CAS: el estado esperado es el leído; si dos requests
    // cambian el estado simultáneamente, solo una gana (AUD-230).
    const updated = await prisma.$transaction(async (tx) => {
      if (resultado) {
        await agendasRepository.registrarTiempoReal(id, { resultado }, tx);
      }
      const fila = await agendasRepository.actualizarEstado(id, estado, calendarEventId, existente.estado, tx);
      if (!fila) {
        throw new DomainError(
          `Estado de la agenda cambió concurrentemente: ${existente.estado} → ${estado}`,
          "TRANSICION_CONFLICTO"
        );
      }
      return fila;
    });
    // Side effect externo (Google Calendar) FUERA de la transacción.
    if (estado === "CANCELADA" && existente.calendar_event_id) {
      await this.cancelarEnCalendar(id).catch(() => {});
    }
    return updated;
  },

  async setResultado(id: string, resultado: string | null) {
    if (resultado !== null && !RESULTADOS_VALIDOS.includes(resultado)) {
      throw new DomainError(`Resultado inválido: ${resultado}`, "RESULTADO_INVALIDO");
    }
    const existente = await agendasRepository.porId(id);
    if (!existente) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    validarResultado(existente.estado, resultado);
    return agendasRepository.registrarTiempoReal(id, { resultado });
  },

  async registrarInicioReal(id: string, horaInicioReal: string) {
    const existente = await agendasRepository.porId(id);
    if (!existente) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    if (existente.estado === "CANCELADA") {
      throw new DomainError("No se puede registrar tiempo real de una agenda cancelada", "AGENDA_CANCELADA");
    }
    if (existente.estado === "FINALIZADA") {
      throw new DomainError("No se puede modificar el tiempo real de una agenda finalizada", "AGENDA_FINALIZADA");
    }
    if (existente.hora_inicio_real) {
      throw new DomainError("Ya se registró el inicio real. Use editar si necesita corregirlo.", "YA_REGISTRADO");
    }
    return agendasRepository.registrarTiempoReal(id, {
      hora_inicio_real: horaInicioReal,
      hora_fin_real: null,
      duracion_real_min: null,
    });
  },

  async registrarFinReal(id: string, horaFinReal: string) {
    const existente = await agendasRepository.porId(id);
    if (!existente) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    if (existente.estado === "CANCELADA") {
      throw new DomainError("No se puede registrar tiempo real de una agenda cancelada", "AGENDA_CANCELADA");
    }
    if (!existente.hora_inicio_real) {
      throw new DomainError("Debe registrar el inicio real antes del fin real", "SIN_INICIO_REAL");
    }
    if (horaFinReal <= existente.hora_inicio_real) {
      throw new DomainError("La hora fin real debe ser posterior a la hora inicio real", "HORA_FIN_REAL_INVALIDA");
    }
    const duracionReal = calcularDuracionReal(existente.hora_inicio_real, horaFinReal);
    // Auto-asignar resultado REALIZADA al registrar fin real
    return agendasRepository.registrarTiempoReal(id, {
      hora_fin_real: horaFinReal,
      duracion_real_min: duracionReal,
      resultado: "REALIZADA",
    });
  },

  async eliminar(id: string) {
    const existente = await agendasRepository.porId(id);
    if (!existente) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    // Eliminar evento de Google Calendar si existe (fire-and-forget)
    if (existente.calendar_event_id) {
      this.cancelarEnCalendar(id).catch(() => {});
    }
    return agendasRepository.eliminar(id);
  },

  async kpis() {
    const porEstado = await agendasRepository.contarPorEstado();
    const total = Object.values(porEstado).reduce((sum, n) => sum + n, 0);
    return {
      total,
      pendientes: porEstado["PENDIENTE"] ?? 0,
      activas: porEstado["ACTIVA"] ?? 0,
      finalizadas: porEstado["FINALIZADA"] ?? 0,
      canceladas: porEstado["CANCELADA"] ?? 0,
    };
  },

  async porRangoFecha(desde: string, hasta: string) {
    return agendasRepository.listarPorFechaRango(desde, hasta);
  },

  // ── Google Calendar ──

  /**
   * Retorna el estado de conexión de Google Calendar.
   */
  async getGoogleCalendarStatus() {
    const configured = googleCalendarService.isConfigured();
    const connected = configured ? await googleCalendarService.isConnected() : false;
    return { configured, connected };
  },

  /**
   * Genera la URL de autorización OAuth para Google Calendar.
   */
  async getGoogleCalendarAuthUrl() {
    if (!googleCalendarService.isConfigured()) {
      throw new DomainError(
        "Google Calendar no está configurado. Verifique GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
        "GOOGLE_NOT_CONFIGURED"
      );
    }
    const { url, state } = googleCalendarService.generateAuthUrl();
    return { authUrl: url, state };
  },

  /**
   * Maneja el callback de OAuth de Google Calendar.
   */
  async handleGoogleCalendarCallback(code: string, state?: string) {
    return googleCalendarService.handleCallback(code, state);
  },

  /**
   * Desconecta la cuenta de Google Calendar.
   */
  async disconnectGoogleCalendar() {
    return googleCalendarService.disconnect();
  },

  /**
   * Sincroniza una Agenda con Google Calendar (O5-C: retry seguro + reconciliación).
   * - UPDATE si existe `calendar_event_id` (retry acotado solo para transitorios; 404 → recrear).
   * - CREATE con reconciliación por `extendedProperties.copeAgendaId` (sin retry ciego en AMBIGUOUS).
   */
  async sincronizarCalendar(id: string): Promise<{
    action: "created" | "updated" | "already_synced";
    eventId: string;
    htmlLink: string;
    meetLink?: string;
  }> {
    if (!googleCalendarService.isConfigured()) {
      throw new DomainError(
        "Google Calendar no está configurado. Verifique GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
        "GOOGLE_NOT_CONFIGURED"
      );
    }
    if (!(await googleCalendarService.isConnected())) {
      throw new DomainError(
        "Google Calendar no está conectado. Solicite al administrador que autorice la cuenta.",
        "GOOGLE_NOT_CONNECTED"
      );
    }

    const agenda = await agendasRepository.porId(id);
    if (!agenda) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    if (agenda.estado === "CANCELADA") {
      throw new DomainError("No se puede sincronizar una agenda cancelada", "AGENDA_CANCELADA");
    }
    if (!agenda.asesor_correo) {
      throw new DomainError("La agenda no tiene correo de asesor asociado", "ASESOR_SIN_CORREO");
    }

    const evento = googleCalendarService.buildEventoFromAgenda({ ...agenda, id });

    // UPDATE (event_id conocido): retry acotado solo para transitorios; 404 → recrear.
    if (agenda.calendar_event_id) {
      const existing = await googleCalendarService.obtenerEvento(agenda.calendar_event_id);
      if (existing.exists) {
        return this.actualizarConRetry(id, agenda, evento);
      }
      // evento ya no existe en Google → se crea de nuevo (reconciliando por identificador).
    }

    // CREATE con reconciliación ante ambigüedad (nunca retry ciego).
    return this.crearConRetryYReconciliacion(id, agenda, evento);
  },

  /** UPDATE idempotente con retry acotado (RETRYABLE/AMBIGUOUS); 404 → recrear. */
  async actualizarConRetry(id: string, agenda: AgendaRow, evento: ReturnType<typeof googleCalendarService.buildEventoFromAgenda>) {
    const backoffs = [1000, 2000, 4000];
    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        const result = await googleCalendarService.actualizarEvento(agenda.calendar_event_id!, evento);
        await agendasRepository.actualizarSyncCalendar(id, {
          calendar_sync_status: "SYNCED",
          calendar_sync_error: null,
          calendar_html_link: result.htmlLink || null,
          calendar_meet_link: result.meetLink ?? agenda.calendar_meet_link ?? null,
        });
        // eslint-disable-next-line no-console
        console.warn(`[CALENDAR] sync operation=update agendaId=${id} attempt=${attempt + 1} result=ok`);
        return { action: "updated" as const, eventId: result.eventId, htmlLink: result.htmlLink, meetLink: result.meetLink };
      } catch (err) {
        const { category, statusCode } = clasificarErrorCalendar(err);
        if (category === "NON_RETRYABLE" || category === "AUTH") {
          if (category === "NON_RETRYABLE" && statusCode === 404) {
            // evento borrado en Google → recrear (reconciliando).
            return this.crearConRetryYReconciliacion(id, agenda, evento);
          }
          await this.persistirErrorCalendar(id, err, category, statusCode, "update");
          throw toDomainCalendarError(err);
        }
        if (attempt < 3) {
          await esperarMs(backoffs[attempt] + jitterMs());
          continue;
        }
        await this.persistirErrorCalendar(id, err, category, statusCode, "update");
        throw toDomainCalendarError(err);
      }
    }
    throw new DomainError("Error al actualizar evento en Google Calendar", "CALENDAR_UPDATE_ERROR");
  },

  /** CREATE con reconciliación por identificador estable; sin retry ciego en AMBIGUOUS. */
  async crearConRetryYReconciliacion(id: string, agenda: AgendaRow, evento: ReturnType<typeof googleCalendarService.buildEventoFromAgenda>) {
    const backoffs = [1000, 2000, 4000];
    for (let attempt = 0; attempt <= 3; attempt++) {
      // Reconciliar antes de cada create (cubre intentos ambiguos previos).
      const reconciliado = await googleCalendarService.buscarEventoPorIdentificador(agenda.id).catch(() => null);
      if (reconciliado?.eventId) {
        await agendasRepository.actualizarSyncCalendar(id, {
          calendar_event_id: reconciliado.eventId,
          calendar_html_link: reconciliado.htmlLink ?? null,
          calendar_sync_status: "SYNCED",
          calendar_sync_error: null,
        });
        // eslint-disable-next-line no-console
        console.warn(`[CALENDAR] sync operation=create agendaId=${id} attempt=${attempt + 1} result=reconciled`);
        return { action: "created" as const, eventId: reconciliado.eventId, htmlLink: reconciliado.htmlLink ?? "", meetLink: undefined };
      }

      try {
        const result = await googleCalendarService.crearEvento(evento);
        await agendasRepository.actualizarSyncCalendar(id, {
          calendar_event_id: result.eventId,
          calendar_html_link: result.htmlLink || null,
          calendar_sync_status: "SYNCED",
          calendar_sync_error: null,
          calendar_meet_link: result.meetLink ?? null,
        });
        // eslint-disable-next-line no-console
        console.warn(`[CALENDAR] sync operation=create agendaId=${id} attempt=${attempt + 1} result=ok`);
        return { action: "created" as const, eventId: result.eventId, htmlLink: result.htmlLink, meetLink: result.meetLink };
      } catch (err) {
        const { category, statusCode } = clasificarErrorCalendar(err);
        if (category === "NON_RETRYABLE" || category === "AUTH") {
          await this.persistirErrorCalendar(id, err, category, statusCode, "create");
          throw toDomainCalendarError(err);
        }
        if (category === "AMBIGUOUS") {
          // Puede haber creado el evento y perderse la respuesta: reconciliar una vez más.
          const r2 = await googleCalendarService.buscarEventoPorIdentificador(agenda.id).catch(() => null);
          if (r2?.eventId) {
            await agendasRepository.actualizarSyncCalendar(id, {
              calendar_event_id: r2.eventId,
              calendar_html_link: r2.htmlLink ?? null,
              calendar_sync_status: "SYNCED",
              calendar_sync_error: null,
            });
            // eslint-disable-next-line no-console
            console.warn(`[CALENDAR] sync operation=create agendaId=${id} attempt=${attempt + 1} result=reconciled-after-ambiguous`);
            return { action: "created" as const, eventId: r2.eventId, htmlLink: r2.htmlLink ?? "", meetLink: undefined };
          }
          // No confirmado y no reconciliado → NO recrear ciegamente: ERROR (retry manual).
          await this.persistirErrorCalendar(id, err, "AMBIGUOUS", undefined, "create");
          throw toDomainCalendarError(err);
        }
        // RETRYABLE (429/5xx): Google no procesó → reintento acotado.
        if (attempt < 3) {
          await esperarMs(backoffs[attempt] + jitterMs());
          continue;
        }
        await this.persistirErrorCalendar(id, err, category, statusCode, "create");
        throw toDomainCalendarError(err);
      }
    }
    throw new DomainError("Error al crear evento en Google Calendar", "CALENDAR_CREATE_ERROR");
  },

  async persistirErrorCalendar(id: string, err: unknown, category: CalendarErrorCategory, statusCode: number | undefined, operation: string) {
    const msg = err instanceof Error ? err.message : String(err);
    await agendasRepository.actualizarSyncCalendar(id, {
      calendar_sync_status: "ERROR",
      calendar_sync_error: msg.slice(0, 500),
    });
    // eslint-disable-next-line no-console
    console.warn(`[CALENDAR] sync operation=${operation} agendaId=${id} result=error errorCategory=${category}${statusCode !== undefined ? ` statusCode=${statusCode}` : ""}`);
  },

  /**
   * Reintenta sincronizar una agenda que falló.
   */
  async reintentarSyncCalendar(id: string) {
    const agenda = await agendasRepository.porId(id);
    if (!agenda) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    if (agenda.calendar_sync_status !== "ERROR") {
      throw new DomainError("Solo se puede reintentar sincronización con estado ERROR", "SYNC_NO_ERROR");
    }
    return this.sincronizarCalendar(id);
  },

  /**
   * Cancela/elimina el evento de Google Calendar cuando una agenda se cancela o elimina.
   * Idempotente: si el evento ya no existe en Google (404), se marca como DISABLED.
   */
  async cancelarEnCalendar(id: string): Promise<void> {
    const agenda = await agendasRepository.porId(id);
    if (!agenda) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    if (!agenda.calendar_event_id) return;
    if (!googleCalendarService.isConfigured()) return;
    if (!(await googleCalendarService.isConnected())) return;

    try {
      await googleCalendarService.eliminarEvento(agenda.calendar_event_id);
      await agendasRepository.actualizarSyncCalendar(id, {
        calendar_sync_status: "DISABLED",
        calendar_sync_error: null,
      });
    } catch (err: any) {
      // 404 = ya eliminado externamente → marcar DISABLED (idempotente)
      if (err.code === 404 || err.status === 404 || err.message?.includes("404")) {
        await agendasRepository.actualizarSyncCalendar(id, {
          calendar_sync_status: "DISABLED",
          calendar_sync_error: null,
        });
        return;
      }
      await agendasRepository.actualizarSyncCalendar(id, {
        calendar_sync_status: "ERROR",
        calendar_sync_error: `Error al cancelar evento: ${err.message ?? "desconocido"}`,
      });
    }
  },

  /**
   * Retorna la URL de Google Calendar para ver el evento.
   */
  getCalendarEventUrl(calendarEventId: string): string {
    return `https://calendar.google.com/calendar/r/eventedit?eid=${calendarEventId}`;
  },

  /**
   * Retorna información del calendario configurado (para diagnóstico).
   */
  async getGoogleCalendarInfo() {
    if (!googleCalendarService.isConfigured()) {
      throw new DomainError(
        "Google Calendar no está configurado.",
        "GOOGLE_NOT_CONFIGURED"
      );
    }
    if (!(await googleCalendarService.isConnected())) {
      throw new DomainError(
        "Google Calendar no está conectado.",
        "GOOGLE_NOT_CONNECTED"
      );
    }
    return googleCalendarService.getCalendarInfo();
  },

  /**
   * Verifica disponibilidad en el calendario usando FreeBusy API.
   */
  async verificarDisponibilidad(desde: string, hasta: string) {
    if (!googleCalendarService.isConfigured()) {
      throw new DomainError(
        "Google Calendar no está configurado.",
        "GOOGLE_NOT_CONFIGURED"
      );
    }
    if (!(await googleCalendarService.isConnected())) {
      throw new DomainError(
        "Google Calendar no está conectado.",
        "GOOGLE_NOT_CONNECTED"
      );
    }
    return googleCalendarService.verificarDisponibilidad(desde, hasta);
  },

  /**
   * Reconcilia una agenda: verifica que el evento en Google Calendar
   * coincida con los datos de COPE y corrige si es necesario.
   */
  async reconciliarAgenda(id: string) {
    const agenda = await agendasRepository.porId(id);
    if (!agenda) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");
    if (!agenda.calendar_event_id) {
      return { action: "no_event" as const };
    }

    const result = await googleCalendarService.reconcileAgenda(agenda.calendar_event_id, agenda);

    // Actualizar BD según resultado
    if (result.action === "missing") {
      await agendasRepository.actualizarSyncCalendar(id, {
        calendar_event_id: null,
        calendar_sync_status: "DISABLED",
        calendar_sync_error: null,
        calendar_meet_link: null,
      });
    } else if (result.action === "corrected") {
      await agendasRepository.actualizarSyncCalendar(id, {
        calendar_sync_status: "SYNCED",
        calendar_sync_error: null,
      });
    }

    return result;
  },

  async guardarActa(id: string, contenido: any, estado: string) {
    const ACTA_ESTADOS_VALIDOS = ["BORRADOR", "FINALIZADA"];
    if (!ACTA_ESTADOS_VALIDOS.includes(estado)) {
      throw new DomainError(`Estado de acta inválido: ${estado}`, "ACTA_ESTADO_INVALIDO");
    }
    const existente = await agendasRepository.porId(id);
    if (!existente) throw new DomainError("Agenda no encontrada", "NO_ENCONTRADO");

    // T3: separar PDF (filesystem) de la persistencia PostgreSQL.
    // El artefacto obligatorio se genera/verifica ANTES de marcar FINALIZADA.
    if (estado === "FINALIZADA") {
      // 1) Generar PDF en memoria (sin shell; O5-B/O5-F1).
      const buffer = await actaPdfService.generarAsync(existente, contenido);
      // 2) Escribir archivo a disco con nombre saneado (falla → NO persistir FINALIZADA).
      const { tamano } = actaPdfService.guardarPdf(existente.ticket, buffer);
      const nombrePdf = actaPdfService.nombreArchivoActa(existente.ticket);
      try {
        // 3) Persistir acta + metadatos ATÓMICAMENTE (una sola transacción PostgreSQL).
        await prisma.$transaction(async (tx) => {
          await agendasRepository.guardarActa(id, contenido, estado, tx);
          await agendasRepository.actualizarMetadatosActa(
            id,
            { acta_file_id: nombrePdf, acta_nombre: nombrePdf, acta_tipo: "application/pdf", acta_tamano: tamano },
            tx,
          );
        });
      } catch (err) {
        // Compensación: el archivo ya fue escrito; si la DB falló, eliminar el temporal.
        actaPdfService.eliminarPdf(existente.ticket);
        throw err;
      }
    } else {
      // BORRADOR: solo DB, sin artefacto obligatorio.
      await prisma.$transaction(async (tx) => {
        await agendasRepository.guardarActa(id, contenido, estado, tx);
      });
    }

    // Re-leer para retornar con metadatos actualizados
    return agendasRepository.porId(id);
  },
};
