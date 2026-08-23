/**
 * ContactoResolucionService — motor de resolución CONTACTO → DOMINIO.
 *
 * Independiente de infraestructura (no importa HTTP, LocalBI ni repositorios
 * de integración). La capa de aplicación (ContactoDominioService) es la que
 * consulta LocalBI y homologa el dominio; aquí solo se resuelve la identidad
 * a partir de los datos que recibe.
 *
 * Estados de resolución:
 *   IDENTIFICADO_AUTO      → hay un dominio decidido (único / explícito / hilo).
 *   REQUIERE_SELECCION     → varios dominios sin evidencia suficiente.
 *   SIN_IDENTIFICAR        → el contacto no tiene dominios activos.
 *   DOMINIO_INVALIDO       → el dominio propuesto no tiene formato válido.
 *   DOMINIO_NO_HOMOLOGADO  → dominio válido pero no homologado en LocalBI.
 *   LOCALBI_NO_DISPONIBLE  → LocalBI no pudo validarse (indeterminado).
 *
 * Prioridad de resolución:
 *   1. Dominio explícito de Zendesk/atención (si presente y homologado).
 *   2. Dominio del contexto/hilo actual (si existe).
 *   3. Único dominio activo del contacto.
 *   4. Dominio principal (solo si existe una regla real; por ahora no aplica).
 *   5. Varios dominios sin evidencia → REQUIERE_SELECCION.
 *   6. Sin dominios → SIN_IDENTIFICAR.
 *
 * NO se selecciona dominios[0] arbitrariamente.
 * NO se usa ultima_utilizacion/contador_uso como criterio automático todavía.
 */
import {
  normalizeDomain,
  isValidDomainFormat,
  normalizeContactIdentifier,
  type ContactoTipo,
} from "./normalizacion";

export type EstadoIdentidad =
  | "IDENTIFICADO_AUTO"
  | "REQUIERE_SELECCION"
  | "SIN_IDENTIFICAR"
  | "DOMINIO_INVALIDO"
  | "DOMINIO_NO_HOMOLOGADO"
  | "LOCALBI_NO_DISPONIBLE";

export interface DominioVinculadoInput {
  dominio: string;
  origen?: string | null;
}

export interface ResultadoResolucion {
  tipo: ContactoTipo;
  valor_normalizado: string;
  estado: EstadoIdentidad;
  dominios: DominioVinculadoInput[];
  dominioSeleccionado: string | null;
  origen: string | null;
  /** Info de homologación LocalBI si se proveyó. */
  homologado?: boolean;
  mensaje?: string;
}

export interface ResolverEntrada {
  tipo: ContactoTipo;
  valor: string;
  /** Dominio explícito de la interacción (Zendesk custom field), sin normalizar. */
  dominioExplicito?: string | null;
  /** Dominio del hilo/conversación actual (normalizado). */
  dominioHilo?: string | null;
  /** Dominios activos del contacto (desde el repository). */
  dominios?: DominioVinculadoInput[];
  /** True si el dominio propuesto/explícito fue homologado en LocalBI. */
  homologado?: boolean;
}

/** Resuelve la identidad siguiendo la prioridad establecida. */
export function resolverIdentidad(entrada: ResolverEntrada): ResultadoResolucion {
  const valorNorm = normalizeContactIdentifier(entrada.tipo, entrada.valor);
  if (!valorNorm) {
    return { tipo: entrada.tipo, valor_normalizado: "", estado: "SIN_IDENTIFICAR", dominios: [], dominioSeleccionado: null, origen: null };
  }

  const dominios = (entrada.dominios ?? []).filter((d) => isValidDomainFormat(d.dominio));

  // ── Prioridad 1: dominio explícito de la interacción ──
  if (entrada.dominioExplicito) {
    const d = normalizeDomain(entrada.dominioExplicito);
    if (!isValidDomainFormat(d)) {
      return {
        tipo: entrada.tipo, valor_normalizado: valorNorm, estado: "DOMINIO_INVALIDO",
        dominios, dominioSeleccionado: null, origen: null,
        mensaje: "El dominio proporcionado no tiene un formato válido.",
      };
    }
    if (entrada.homologado === false) {
      return {
        tipo: entrada.tipo, valor_normalizado: valorNorm, estado: "DOMINIO_NO_HOMOLOGADO",
        dominios, dominioSeleccionado: d, origen: "ZENDESK_EXPLICITO",
        homologado: false,
        mensaje: "El dominio tiene un formato válido, pero no se encontró información en LocalBI.",
      };
    }
    if (entrada.homologado === true || dominios.some((x) => x.dominio === d)) {
      return {
        tipo: entrada.tipo, valor_normalizado: valorNorm, estado: "IDENTIFICADO_AUTO",
        dominios, dominioSeleccionado: d, origen: "ZENDESK_EXPLICITO", homologado: true,
      };
    }
    // Dominio explícito no homologado y no vinculado → requiere confirmación.
    return {
      tipo: entrada.tipo, valor_normalizado: valorNorm, estado: "DOMINIO_NO_HOMOLOGADO",
      dominios, dominioSeleccionado: d, origen: "ZENDESK_EXPLICITO", homologado: false,
      mensaje: "El dominio no está homologado. Confirma antes de vincular.",
    };
  }

  // ── Prioridad 2: dominio del hilo actual ──
  if (entrada.dominioHilo) {
    const d = normalizeDomain(entrada.dominioHilo);
    if (isValidDomainFormat(d) && (entrada.homologado === true || dominios.some((x) => x.dominio === d))) {
      return {
        tipo: entrada.tipo, valor_normalizado: valorNorm, estado: "IDENTIFICADO_AUTO",
        dominios, dominioSeleccionado: d, origen: "HISTORIAL", homologado: true,
      };
    }
  }

  // ── Prioridad 3: único dominio activo ──
  if (dominios.length === 1) {
    return {
      tipo: entrada.tipo, valor_normalizado: valorNorm, estado: "IDENTIFICADO_AUTO",
      dominios, dominioSeleccionado: dominios[0].dominio, origen: dominios[0].origen ?? "HISTORIAL",
    };
  }

  // ── Prioridad 5: varios dominios sin evidencia suficiente ──
  if (dominios.length > 1) {
    return {
      tipo: entrada.tipo, valor_normalizado: valorNorm, estado: "REQUIERE_SELECCION",
      dominios, dominioSeleccionado: null, origen: null,
      mensaje: "Este contacto tiene varios dominios vinculados. Selecciona uno.",
    };
  }

  // ── Prioridad 6: sin dominios ──
  return {
    tipo: entrada.tipo, valor_normalizado: valorNorm, estado: "SIN_IDENTIFICAR",
    dominios: [], dominioSeleccionado: null, origen: null,
  };
}
