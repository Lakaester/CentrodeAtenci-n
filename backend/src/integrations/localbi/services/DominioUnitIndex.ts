/**
 * DominioUnitIndex — Índice en memoria que resuelve dominio / localbi_id → unidad de negocio.
 *
 * ensure() dispara la construcción en background SIN esperar.
 *   resolve() y getDominiosPorUnidad() devuelven null si el índice no está listo.
 *
 * Al construirse, ejecuta:
 *   1. getListaUnidadesNegocio() → nombres de unidades
 *   2. Para cada unidad, getHistoriaClinicaPorPath() → dominios + locales
 *
 * Mapas:
 *   - dominio → { unidad_negocio, local, localbi_id }
 *   - localbi_id → unidad_negocio
 *   - unidad_negocio (lowercase) → { unidad_negocio, dominios[] }
 *
 * Se cachea 24 h.
 */
import { LocalbiClient } from "../client/LocalbiClient";
import { normalizeDomain } from "../../../domain/contacto/normalizacion";

const CONCURRENCY = 20;
const DELAY_BETWEEN_BATCHES_MS = 200;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface DominioEntry {
  unidad_negocio: string;
  local: string;
  localbi_id: string;
}

interface UnitEntry {
  unidad_negocio: string;
  dominios: Array<{ dominio: string; local: string; localbi_id: string }>;
}

export class DominioUnitIndex {
  private dominioMap = new Map<string, DominioEntry>();
  private localbiIdMap = new Map<string, { unidad_negocio: string }>();
  private unitMap = new Map<string, UnitEntry>();

  private building = false;
  private builtAt = 0;
  private stats = { dominios: 0, localbiIds: 0, units: 0 };

  private client = new LocalbiClient();

  /** true si el índice ya fue construido y no expiró. */
  isReady(): boolean {
    return this.builtAt > 0 && Date.now() - this.builtAt < CACHE_TTL_MS;
  }

  getStats() {
    return { ...this.stats, ready: this.isReady(), builtAt: this.builtAt };
  }

  /**
   * Dispara la construcción del índice en background SIN bloquear al consumidor.
   * Si ya está construido, no hace nada.
   * Si ya está construyéndose, no inicia otro build.
   * Los errores del build se registran y el flag `building` se limpia correctamente.
   */
  ensure(): void {
    if (this.isReady() || this.building) return;
    this.build();
  }

  /** Fuerza reconstrucción del índice (bloqueante). */
  async reload(): Promise<void> {
    await this.build();
  }

  /**
   * Resuelve un dominio o localbi_id a unidad de negocio.
   * Devuelve { unidad_negocio, local, localbi_id, coincidencia } o null si el índice no está listo.
   */
  resolve(query: string): { unidad_negocio: string; local: string; localbi_id: string; coincidencia: string } | null {
    if (!this.isReady()) return null;

    // 1. Dominio normalizado
    const normDom = normalizeDomain(query);
    if (normDom) {
      const entry = this.dominioMap.get(normDom);
      if (entry) {
        return { unidad_negocio: entry.unidad_negocio, local: entry.local, localbi_id: entry.localbi_id, coincidencia: normDom };
      }
    }

    // 2. localbi_id exacto
    const idEntry = this.localbiIdMap.get(query.trim());
    if (idEntry) {
      return { unidad_negocio: idEntry.unidad_negocio, local: "", localbi_id: query.trim(), coincidencia: `localbi_id: ${query.trim()}` };
    }

    return null;
  }

  /**
   * Devuelve todos los dominios de una unidad de negocio.
   * Útil cuando LocalBI retorna una unidad por nombre y necesitamos sus dominios.
   */
  getDominiosPorUnidad(unidadNegocio: string): Array<{ dominio: string; local: string; localbi_id: string }> | null {
    if (!this.isReady()) return null;
    const entry = this.unitMap.get(unidadNegocio.toLowerCase());
    return entry?.dominios ?? null;
  }

  // ---------------------------------------------------------------------------
  // Construcción del índice
  // ---------------------------------------------------------------------------

  private async build(): Promise<void> {
    if (this.building) return;
    this.building = true;
    const t0 = Date.now();
    console.log("[DominioUnitIndex] Iniciando construcción del índice…");

    try {
      // 1. Obtener lista de todas las unidades
      let unitNames: string[];
      try {
        const lista = await this.client.getListaUnidadesNegocio();
        const data = (lista.data ?? []) as Array<{ unidad_negocio?: string }>;
        unitNames = data
          .map((u) => (u.unidad_negocio ?? "").trim())
          .filter(Boolean);
        console.log(`[DominioUnitIndex] ${unitNames.length} unidades obtenidas`);
      } catch (err) {
        console.error("[DominioUnitIndex] Error obteniendo lista de unidades:", err);
        return;
      }

      // 2. Resetear mapas
      this.dominioMap.clear();
      this.localbiIdMap.clear();
      this.unitMap.clear();

      // 3. Procesar historia clínica en batches paralelos
      let processed = 0;
      let errors = 0;

      for (let i = 0; i < unitNames.length; i += CONCURRENCY) {
        const batch = unitNames.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map((name) => this.loadHistoriaForUnit(name))
        );

        for (const r of results) {
          if (r.status === "fulfilled") processed++;
          else errors++;
        }

        if (i + CONCURRENCY < unitNames.length) {
          await delay(DELAY_BETWEEN_BATCHES_MS);
        }

        if (processed % 200 === 0 || i + CONCURRENCY >= unitNames.length) {
          console.log(
            `[DominioUnitIndex] Progreso: ${processed}/${unitNames.length}, ${errors} errores`
          );
        }
      }

      this.builtAt = Date.now();
      this.stats = {
        dominios: this.dominioMap.size,
        localbiIds: this.localbiIdMap.size,
        units: this.unitMap.size,
      };

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(
        `[DominioUnitIndex] Índice construido en ${elapsed}s: ` +
        `${this.stats.dominios} dominios, ${this.stats.localbiIds} localbi_ids, ${this.stats.units} unidades`
      );
    } finally {
      this.building = false;
    }
  }

  private async loadHistoriaForUnit(unidadNegocio: string): Promise<void> {
    const resp = await this.client.getHistoriaClinicaPorPath(unidadNegocio);
    const tipo = String(resp.tipo ?? "3");
    if (tipo !== "1" && tipo !== "2") return;

    const ficha = resp.data;
    if (!ficha) return;

    const dominios: Array<{ dominio: string; local: string; localbi_id: string }> = [];

    for (const dom of ficha.dominios ?? []) {
      const normDom = normalizeDomain(dom.dominio);
      if (!normDom) continue;

      const localName = dom.locales?.[0]?.nombre ?? "";
      const localbiId = dom.locales?.[0]?.localbi_id ?? "";

      if (!this.dominioMap.has(normDom)) {
        this.dominioMap.set(normDom, { unidad_negocio: unidadNegocio, local: localName, localbi_id: localbiId });
      }

      for (const loc of dom.locales ?? []) {
        const lid = (loc.localbi_id ?? "").trim();
        if (lid && !this.localbiIdMap.has(lid)) {
          this.localbiIdMap.set(lid, { unidad_negocio: unidadNegocio });
        }
      }

      dominios.push({
        dominio: normDom,
        local: localName,
        localbi_id: dom.locales?.[0]?.localbi_id ?? "",
      });
    }

    if (dominios.length > 0) {
      this.unitMap.set(unidadNegocio.toLowerCase(), { unidad_negocio: unidadNegocio, dominios });
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Instancia singleton del índice. */
export const dominioUnitIndex = new DominioUnitIndex();
