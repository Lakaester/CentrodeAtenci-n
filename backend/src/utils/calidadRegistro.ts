/**
 * Utilidades puras del módulo Calidad de Registro.
 *
 * Reglas de integridad:
 *  - catHomologadas <= catRegistradas <= total
 *  - domValidos <= domInformados <= total
 *  - cumpleAmbas + soloCategoriaHomologada + soloDominioValido + ningunaCondicion = total
 *
 * Las funciones lanzan error si una fila viola estas invariantes. Es preferible
 * fallar a devolver un indicador inconsistente.
 */
import type {
  CalidadResumen,
  CalidadVariaciones,
  Granularidad,
} from "../types/calidadRegistro";

export const CANAL_ORDER = ["WHATICKET", "WHATMETA", "ZENDESK"] as const;

export const CANAL_LABELS: Record<string, string> = {
  WHATICKET: "WATICKET",
  WHATMETA: "WAMETA",
  ZENDESK: "ZENDESK",
  TODOS: "TODOS",
};

export function etiquetaCanal(canal: string): string {
  return CANAL_LABELS[canal] ?? canal;
}

export function redondear1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function porcentaje(parte: number, total: number): number | null {
  if (!total || total <= 0) return null;
  return redondear1((parte / total) * 100);
}

export function variacionPp(
  actual: number | null | undefined,
  anterior: number | null | undefined,
): number | null {
  if (actual == null || anterior == null) return null;
  return redondear1(actual - anterior);
}

export function variacionRel(
  actual: number | null | undefined,
  anterior: number | null | undefined,
): number | null {
  if (actual == null || anterior == null || anterior === 0) return null;
  return redondear1(((actual - anterior) / anterior) * 100);
}

export interface ConteosCalidad {
  total: number;
  catReg: number;
  catHom: number;
  domInf: number;
  domVal: number;
  ambas: number;
  soloCat: number;
  soloDom: number;
  ninguna: number;
}

export function conteosVacios(): ConteosCalidad {
  return {
    total: 0,
    catReg: 0,
    catHom: 0,
    domInf: 0,
    domVal: 0,
    ambas: 0,
    soloCat: 0,
    soloDom: 0,
    ninguna: 0,
  };
}

export function agregarConteos(rows: ConteosCalidad[]): ConteosCalidad {
  return rows.reduce<ConteosCalidad>(
    (acc, r) => ({
      total: acc.total + r.total,
      catReg: acc.catReg + r.catReg,
      catHom: acc.catHom + r.catHom,
      domInf: acc.domInf + r.domInf,
      domVal: acc.domVal + r.domVal,
      ambas: acc.ambas + r.ambas,
      soloCat: acc.soloCat + r.soloCat,
      soloDom: acc.soloDom + r.soloDom,
      ninguna: acc.ninguna + r.ninguna,
    }),
    conteosVacios(),
  );
}

function validarConteos(c: ConteosCalidad): void {
  if (c.catReg < 0 || c.catHom < 0 || c.domInf < 0 || c.domVal < 0) {
    throw new Error("Calidad de Registro: conteos negativos.");
  }
  if (c.catHom > c.catReg || c.catReg > c.total) {
    throw new Error(
      `Calidad de Registro: se violó catHomologadas <= catRegistradas <= total (${c.catHom} <= ${c.catReg} <= ${c.total}).`,
    );
  }
  if (c.domVal > c.domInf || c.domInf > c.total) {
    throw new Error(
      `Calidad de Registro: se violó domValidos <= domInformados <= total (${c.domVal} <= ${c.domInf} <= ${c.total}).`,
    );
  }
  if (c.ambas + c.soloCat !== c.catHom) {
    throw new Error(
      `Calidad de Registro: cumpleAmbas + soloCategoriaHomologada debe ser igual a catHomologadas (${c.ambas} + ${c.soloCat} != ${c.catHom}).`,
    );
  }
  if (c.ambas + c.soloDom !== c.domVal) {
    throw new Error(
      `Calidad de Registro: cumpleAmbas + soloDominioValido debe ser igual a domValidos (${c.ambas} + ${c.soloDom} != ${c.domVal}).`,
    );
  }
  const escenarios = c.ambas + c.soloCat + c.soloDom + c.ninguna;
  if (escenarios !== c.total) {
    throw new Error(
      `Calidad de Registro: los cuatro escenarios suman ${escenarios}, pero el total es ${c.total}.`,
    );
  }
}

export function calcularResumen(c: ConteosCalidad): CalidadResumen {
  validarConteos(c);

  const pctRegistrada = porcentaje(c.catReg, c.total);
  const pctHomologada = porcentaje(c.catHom, c.total);
  const pctInformado = porcentaje(c.domInf, c.total);
  const pctValido = porcentaje(c.domVal, c.total);
  const pctIntegral = porcentaje(c.ambas, c.total);

  const registradasNoHomologadas = c.catReg - c.catHom;
  const informadosNoValidos = c.domInf - c.domVal;

  return {
    total: c.total,
    categorizacion: {
      registradas: c.catReg,
      noRegistradas: c.total - c.catReg,
      pctRegistrada,
      homologadas: c.catHom,
      registradasNoHomologadas,
      noHomologadasTotal: c.total - c.catHom,
      pctHomologada,
      brechaHomologacionPp: variacionPp(pctRegistrada, pctHomologada),
      brechaHomologacionCount: registradasNoHomologadas,
    },
    dominio: {
      informados: c.domInf,
      noInformados: c.total - c.domInf,
      pctInformado,
      validos: c.domVal,
      informadosNoValidos,
      noValidosTotal: c.total - c.domVal,
      pctValido,
      brechaDominioPp: variacionPp(pctInformado, pctValido),
      brechaDominioCount: informadosNoValidos,
    },
    integral: {
      cumpleAmbas: c.ambas,
      soloCategoriaHomologada: c.soloCat,
      soloDominioValido: c.soloDom,
      ningunaCondicion: c.ninguna,
      pctCumplimientoIntegral: pctIntegral,
    },
  };
}

export function calcularVariaciones(
  actual: CalidadResumen,
  anterior: CalidadResumen | null,
): CalidadVariaciones {
  const a = actual;
  const p = anterior;
  return {
    totalPct: p ? variacionRel(a.total, p.total) : null,

    catRegistradaPp: p
      ? variacionPp(a.categorizacion.pctRegistrada, p.categorizacion.pctRegistrada)
      : null,
    catRegistradaRel: p
      ? variacionRel(a.categorizacion.pctRegistrada, p.categorizacion.pctRegistrada)
      : null,

    catHomologadaPp: p
      ? variacionPp(a.categorizacion.pctHomologada, p.categorizacion.pctHomologada)
      : null,
    catHomologadaRel: p
      ? variacionRel(a.categorizacion.pctHomologada, p.categorizacion.pctHomologada)
      : null,

    domInformadoPp: p
      ? variacionPp(a.dominio.pctInformado, p.dominio.pctInformado)
      : null,
    domInformadoRel: p
      ? variacionRel(a.dominio.pctInformado, p.dominio.pctInformado)
      : null,

    domValidoPp: p ? variacionPp(a.dominio.pctValido, p.dominio.pctValido) : null,
    domValidoRel: p ? variacionRel(a.dominio.pctValido, p.dominio.pctValido) : null,

    integralPp: p
      ? variacionPp(a.integral.pctCumplimientoIntegral, p.integral.pctCumplimientoIntegral)
      : null,
    integralRel: p
      ? variacionRel(
          a.integral.pctCumplimientoIntegral,
          p.integral.pctCumplimientoIntegral,
        )
      : null,
  };
}

function fechaUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmtFecha(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Etiqueta de periodo equivalente a la usada en SQL. */
export function etiquetaPeriodo(iso: string, granularidad: Granularidad): string {
  const d = fechaUtc(iso);
  if (granularidad === "mes") return iso.slice(0, 7);
  if (granularidad === "trimestre") {
    const q = Math.floor(d.getUTCMonth() / 3) + 1;
    return `${d.getUTCFullYear()}-T${q}`;
  }
  // Semana ISO: mover al jueves de la semana y calcular la semana del año.
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Último día del periodo que inicia en `iso`. */
export function finPeriodo(iso: string, granularidad: Granularidad): string {
  const d = fechaUtc(iso);
  if (granularidad === "semana") {
    d.setUTCDate(d.getUTCDate() + 6);
    return fmtFecha(d);
  }
  if (granularidad === "mes") {
    return fmtFecha(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
  }
  const trimestreInicio = Math.floor(d.getUTCMonth() / 3) * 3;
  return fmtFecha(new Date(Date.UTC(d.getUTCFullYear(), trimestreInicio + 3, 0)));
}

/** Siguiente inicio de periodo. */
export function siguientePeriodo(iso: string, granularidad: Granularidad): string {
  const d = fechaUtc(iso);
  if (granularidad === "semana") {
    d.setUTCDate(d.getUTCDate() + 7);
    return fmtFecha(d);
  }
  const meses = granularidad === "mes" ? 1 : 3;
  return fmtFecha(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + meses, 1)));
}

/** Lista completa de inicios de periodo entre min y max, ambos inclusive. */
export function generarPeriodos(
  minIso: string,
  maxIso: string,
  granularidad: Granularidad,
): string[] {
  if (!minIso || !maxIso || minIso > maxIso) return [];
  const out: string[] = [];
  let cur = minIso;
  let guard = 0;
  while (cur <= maxIso && guard < 10000) {
    out.push(cur);
    cur = siguientePeriodo(cur, granularidad);
    guard += 1;
  }
  return out;
}
