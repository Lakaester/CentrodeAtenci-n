/**
 * Contrato del módulo Calidad de Registro.
 *
 * Niveles independientes:
 *  - Categorización registrada: texto de categoría de origen válido.
 *  - Categorización homologada: categoría presente en el catálogo de homologación.
 *  - Dominio informado: dominio no vacío.
 *  - Dominio válido: cumple isValidDomainFormat del backend.
 *  - Cumplimiento integral: categoría homologada + dominio válido.
 */

export type Granularidad = "semana" | "mes" | "trimestre";

export interface CalidadCategorizacion {
  registradas: number;
  noRegistradas: number;
  pctRegistrada: number | null;

  homologadas: number;
  registradasNoHomologadas: number;
  noHomologadasTotal: number;
  pctHomologada: number | null;

  brechaHomologacionPp: number | null;
  brechaHomologacionCount: number;
}

export interface CalidadDominio {
  informados: number;
  noInformados: number;
  pctInformado: number | null;

  validos: number;
  informadosNoValidos: number;
  noValidosTotal: number;
  pctValido: number | null;

  brechaDominioPp: number | null;
  brechaDominioCount: number;
}

export interface CalidadIntegral {
  cumpleAmbas: number;
  soloCategoriaHomologada: number;
  soloDominioValido: number;
  ningunaCondicion: number;
  pctCumplimientoIntegral: number | null;
}

export interface CalidadResumen {
  total: number;
  categorizacion: CalidadCategorizacion;
  dominio: CalidadDominio;
  integral: CalidadIntegral;
}

export interface CalidadVariaciones {
  totalPct: number | null;

  catRegistradaPp: number | null;
  catRegistradaRel: number | null;

  catHomologadaPp: number | null;
  catHomologadaRel: number | null;

  domInformadoPp: number | null;
  domInformadoRel: number | null;

  domValidoPp: number | null;
  domValidoRel: number | null;

  integralPp: number | null;
  integralRel: number | null;
}

export interface CalidadPeriodo extends CalidadResumen {
  periodo: string;
  periodoInicio: string;
  periodoFin: string;
  variacion: CalidadVariaciones;
}

export interface CalidadCanal extends CalidadResumen {
  canal: string;
  canalLabel: string;
  variacion: CalidadVariaciones;
}

export interface CalidadFila extends CalidadPeriodo {
  canal: string;
  canalLabel: string;
}

export interface CalidadRegistroResponse {
  rango: {
    inicio: string | null;
    fin: string | null;
    comparadoCon: { inicio: string; fin: string } | null;
  };
  granularidad: Granularidad;
  resumen: {
    actual: CalidadResumen;
    anterior: CalidadResumen | null;
    variacion: CalidadVariaciones;
  };
  evolucion: CalidadPeriodo[];
  evolucionPorCanal: {
    canal: string;
    canalLabel: string;
    periodos: CalidadPeriodo[];
  }[];
  comparativo: CalidadCanal[];
  tabla: CalidadFila[];
  generadoEn: string;
}

/** Fila cruda devuelta por la consulta agregada del repositorio. */
export interface CalidadAggRow {
  nivel: "canal" | "consolidado";
  tipo_rango: "actual" | "previo";
  periodo_inicio: string;
  periodo: string;
  subcanal: string | null;
  total: number;
  cat_reg: number;
  cat_hom: number;
  dom_inf: number;
  dom_val: number;
  ambas: number;
  solo_cat: number;
  solo_dom: number;
  ninguna: number;
}
