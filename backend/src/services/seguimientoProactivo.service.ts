/**
 * Servicio de Seguimiento Proactivo.
 *
 * Reglas:
 *  - La detección reutiliza la misma lógica del reporte Clientes
 *    (unificadoRepository.clientesV2 → seguimiento).
 *  - El lote semanal es manual e idempotente.
 *  - Un cliente tiene un solo caso abierto.
 *  - El asesor ve todo, pero solo edita sus casos; supervisor/admin editan todo.
 */
import { DomainError } from "../core/errors/types";
import type { AuthMe } from "./auth.service";
import { unificadoRepository } from "../repositories/unificado.repository";
import { seguimientoProactivoRepository as repo } from "../repositories/seguimientoProactivo.repository";
import { fechaLimaHoy } from "../utils/fechaQyd";
import type {
  SeguimientoActualizarInput,
  SeguimientoCandidato,
  SeguimientoCrearLoteResult,
  SeguimientoDetalle,
  SeguimientoEstado,
  SeguimientoFiltrosLista,
  SeguimientoGestionInput,
  SeguimientoLista,
  SeguimientoAtencionesLista,
} from "../types/seguimientoProactivo";

const ESTADOS: SeguimientoEstado[] = ["sin_seguimiento", "con_pendientes", "finalizado"];

const TRANSICIONES: Record<SeguimientoEstado, SeguimientoEstado[]> = {
  sin_seguimiento: ["con_pendientes", "finalizado"],
  con_pendientes: ["con_pendientes", "finalizado"],
  finalizado: ["con_pendientes"],
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Semana ISO (lunes a domingo) y mes de gestión de una fecha YYYY-MM-DD. */
function weekOf(iso: string): { semana: string; periodo: string; lunes: string; domingo: string } {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = d.getUTCDay() || 7;
  const lunes = new Date(d);
  lunes.setUTCDate(d.getUTCDate() - dow + 1);
  const jueves = new Date(lunes);
  jueves.setUTCDate(lunes.getUTCDate() + 3);
  const year = jueves.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((jueves.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const domingo = new Date(lunes);
  domingo.setUTCDate(lunes.getUTCDate() + 6);
  const lunesIso = lunes.toISOString().slice(0, 10);
  return {
    semana: `${year}-W${String(week).padStart(2, "0")}`,
    periodo: lunesIso.slice(0, 7),
    lunes: lunesIso,
    domingo: domingo.toISOString().slice(0, 10),
  };
}

function weekFromIso(semana: string): { semana: string; periodo: string; lunes: string; domingo: string } {
  const m = /^(\d{4})-W(\d{2})$/.exec(semana);
  if (!m) throw new DomainError("Semana inválida. Usa el formato YYYY-Www.", "SEMANA_INVALIDA");
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) throw new DomainError("Semana fuera de rango.", "SEMANA_INVALIDA");
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - dow + 1);
  const lunes = new Date(week1);
  lunes.setUTCDate(week1.getUTCDate() + (week - 1) * 7);
  const domingo = new Date(lunes);
  domingo.setUTCDate(lunes.getUTCDate() + 6);
  const lunesIso = lunes.toISOString().slice(0, 10);
  return {
    semana: `${year}-W${String(week).padStart(2, "0")}`,
    periodo: lunesIso.slice(0, 7),
    lunes: lunesIso,
    domingo: domingo.toISOString().slice(0, 10),
  };
}

const LOCAL_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/;

function normalizarFechaHora(value: string, campo: string): string {
  const s = String(value ?? "").trim().replace("T", " ");
  if (!LOCAL_RE.test(s)) {
    throw new DomainError(`Formato inválido en ${campo}. Usa YYYY-MM-DD HH:mm.`, "FECHA_INVALIDA");
  }
  const parsed = new Date(`${s.replace(" ", "T")}:00-05:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError(`Fecha inválida en ${campo}.`, "FECHA_INVALIDA");
  }
  return s;
}

function esGestor(auth: AuthMe): boolean {
  return auth.rol === "rol-admin" || auth.rol === "rol-supervisor";
}

function validarAccesoCaso(
  auth: AuthMe,
  caso: { asesorId: string | null },
  opts: { requiereGestor?: boolean } = {},
): void {
  if (esGestor(auth)) return;
  if (opts.requiereGestor) {
    throw new DomainError("Solo un supervisor puede realizar esta acción.", "SIN_PERMISO");
  }
  if (caso.asesorId && caso.asesorId !== auth.id) {
    throw new DomainError("El caso está asignado a otro asesor.", "SIN_PERMISO");
  }
}

function construirCandidato(
  s: {
    clave: string;
    cliente: string;
    total: number;
    totalAnterior: number;
    variacionPct: number | null;
    reincidenciaMax: number;
    subcategoriaRecurrente: string | null;
    tiempoPromedio: number | null;
    conDato: number;
    noCumple: number;
    pctIncumple: number | null;
    motivos: string[];
    senales: number;
  },
  abiertos: Map<string, { id: string; estado: SeguimientoEstado }>,
): SeguimientoCandidato {
  const abierto = abiertos.get(s.clave);
  return {
    clave: s.clave,
    cliente: s.cliente,
    total: s.total,
    totalAnterior: s.totalAnterior,
    variacionPct: s.variacionPct,
    reincidenciaMax: s.reincidenciaMax,
    subcategoriaRecurrente: s.subcategoriaRecurrente,
    tiempoPromedio: s.tiempoPromedio,
    conDato: s.conDato,
    noCumple: s.noCumple,
    pctIncumple: s.pctIncumple,
    motivos: s.motivos,
    senales: s.senales,
    yaEnSeguimiento: Boolean(abierto),
    casoId: abierto?.id ?? null,
    estadoCaso: abierto?.estado ?? null,
  };
}

export const seguimientoProactivoService = {
  async candidatos(params: { desde?: string; hasta?: string }): Promise<{
    desde: string;
    hasta: string;
    total: number;
    rows: SeguimientoCandidato[];
  }> {
    const hoy = fechaLimaHoy();
    const hasta = params.hasta ?? hoy;
    const desde = params.desde ?? addDays(hasta, -29);
    if (desde > hasta) throw new DomainError("La fecha inicial no puede ser mayor que la final.", "RANGO_INVALIDO");

    const data = await unificadoRepository.clientesV2({
      fechaHoraInicio: `${desde} 00:00`,
      fechaHoraFin: `${hasta} 23:59`,
    });
    const abiertos = await repo.abiertosPorClaves(data.seguimiento.map((s) => s.clave));
    const rows = data.seguimiento.map((s) => construirCandidato(s, abiertos));

    return { desde, hasta, total: rows.length, rows };
  },

  async resumen(params: { semana?: string; periodo?: string }) {
    const hoy = weekOf(fechaLimaHoy());
    const semana = params.semana ?? hoy.semana;
    const periodo = params.periodo ?? (params.semana ? weekFromIso(params.semana).periodo : hoy.periodo);
    return repo.resumen(semana, periodo);
  },

  async crearLote(
    params: { semana?: string; desde?: string; hasta?: string; claves?: string[] },
    auth: AuthMe,
  ): Promise<SeguimientoCrearLoteResult> {
    const hoy = fechaLimaHoy();
    const actual = weekOf(hoy);
    const info = params.semana ? weekFromIso(params.semana) : actual;
    const esSemanaActual = info.semana === actual.semana;
    const hasta = params.hasta ?? (esSemanaActual ? hoy : info.domingo);
    const desde = params.desde ?? addDays(hasta, -29);
    if (desde > hasta) throw new DomainError("La fecha inicial no puede ser mayor que la final.", "RANGO_INVALIDO");

    const data = await unificadoRepository.clientesV2({
      fechaHoraInicio: `${desde} 00:00`,
      fechaHoraFin: `${hasta} 23:59`,
    });
    const abiertos = await repo.abiertosPorClaves(data.seguimiento.map((s) => s.clave));
    const evaluados = data.seguimiento.length;
    let candidatos = data.seguimiento.map((s) => construirCandidato(s, abiertos));

    const solicitados = params.claves?.length ?? 0;
    if (solicitados) {
      const set = new Set(params.claves);
      candidatos = candidatos.filter((c) => set.has(c.clave));
    }

    const result = await repo.crearLote({
      periodo: info.periodo,
      semanaIso: info.semana,
      desde,
      hasta,
      usuarioId: auth.id,
      usuario: auth.nombre,
      totalCandidatos: evaluados,
      candidatos,
    });

    return {
      ...result,
      omitidos: solicitados ? Math.max(0, solicitados - candidatos.length) : 0,
      candidatos: candidatos.length,
    };
  },

  async listar(
    params: SeguimientoFiltrosLista,
    auth: AuthMe,
  ): Promise<SeguimientoLista> {
    const hoy = weekOf(fechaLimaHoy());
    const semanaActual = params.semana ?? hoy.semana;
    const periodoActual = params.periodo ?? (params.semana ? weekFromIso(params.semana).periodo : hoy.periodo);
    const asesorId = params.soloMisCasos ? auth.id : params.asesorId;

    return repo.listarCasos({
      ...params,
      asesorId,
      semanaActual,
      periodoActual,
    });
  },

  async detalle(id: string): Promise<SeguimientoDetalle> {
    const hoy = weekOf(fechaLimaHoy());
    const data = await repo.detalle(id, hoy.semana);
    if (!data) throw new DomainError("Caso de seguimiento no encontrado.", "NO_ENCONTRADO");
    return { ...data.caso, gestiones: data.gestiones };
  },

  async gestionar(id: string, input: SeguimientoGestionInput, auth: AuthMe): Promise<SeguimientoDetalle> {
    const caso = await this.detalle(id);
    validarAccesoCaso(auth, caso);

    if (!ESTADOS.includes(input.estadoNuevo)) {
      throw new DomainError("Estado inválido.", "ESTADO_INVALIDO");
    }
    if (!TRANSICIONES[caso.estado].includes(input.estadoNuevo)) {
      throw new DomainError(
        `No se puede pasar de "${caso.estado}" a "${input.estadoNuevo}".`,
        "TRANSICION_INVALIDA",
      );
    }

    const resumen = String(input.resumen ?? "").trim();
    if (resumen.length < 10) {
      throw new DomainError("El resumen del contacto debe tener al menos 10 caracteres.", "RESUMEN_CORTO");
    }

    const contactoAt = normalizarFechaHora(input.contactoAt, "hora de contacto");
    const contactoMs = new Date(`${contactoAt.replace(" ", "T")}:00-05:00`).getTime();
    if (contactoMs > Date.now() + 5 * 60 * 1000) {
      throw new DomainError("La hora de contacto no puede estar en el futuro.", "FECHA_FUTURA");
    }

    let proximo: string | null = null;
    if (input.estadoNuevo === "con_pendientes") {
      if (!input.proximoContactoAt) {
        throw new DomainError("Para 'Con pendientes' debes indicar el próximo contacto.", "PROXIMO_REQUERIDO");
      }
      proximo = normalizarFechaHora(input.proximoContactoAt, "próximo contacto");
      const proximoMs = new Date(`${proximo.replace(" ", "T")}:00-05:00`).getTime();
      if (proximoMs < contactoMs) {
        throw new DomainError("El próximo contacto no puede ser anterior al contacto actual.", "FECHA_INVALIDA");
      }
    } else if (input.estadoNuevo === "finalizado" && input.proximoContactoAt) {
      throw new DomainError("Un caso finalizado no puede tener próximo contacto.", "ESTADO_INVALIDO");
    }

    await repo.crearGestion({
      casoId: id,
      contactoAt,
      proximoContactoAt: proximo,
      resumen,
      estadoNuevo: input.estadoNuevo,
      asesorId: caso.asesorId ?? auth.id,
      asesorNombre: caso.asesorNombre ?? auth.nombre,
      usuarioId: auth.id,
      usuario: auth.nombre,
    });

    return this.detalle(id);
  },

  async actualizar(id: string, input: SeguimientoActualizarInput, auth: AuthMe): Promise<SeguimientoDetalle> {
    const caso = await this.detalle(id);
    validarAccesoCaso(auth, caso, { requiereGestor: input.asesorId !== undefined });

    let asesorNombre: string | null | undefined;
    if (input.asesorId !== undefined) {
      if (input.asesorId === null) {
        asesorNombre = null;
      } else {
        const nombre = await repo.nombreAsesor(input.asesorId);
        if (!nombre) throw new DomainError("El asesor indicado no existe.", "ASESOR_INVALIDO");
        asesorNombre = nombre;
      }
    }

    let proximo: string | null | undefined;
    if (input.proximoContactoAt !== undefined) {
      proximo = input.proximoContactoAt
        ? normalizarFechaHora(input.proximoContactoAt, "próximo contacto")
        : null;
    }

    await repo.actualizarCaso({
      casoId: id,
      asesorId: input.asesorId,
      asesorNombre,
      proximoContactoAt: proximo,
      usuarioId: auth.id,
      usuario: auth.nombre,
    });

    return this.detalle(id);
  },

  async atenciones(
    id: string,
    params: { page?: number; pageSize?: number; categoria?: string; subcategoria?: string },
  ): Promise<SeguimientoAtencionesLista> {
    const caso = await this.detalle(id);
    return repo.atenciones({
      clave: caso.claveCliente,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
      categoria: params.categoria,
      subcategoria: params.subcategoria,
    });
  },
};
