/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import { AutomationRule } from "./AutomationRule";
import { AutomationExecution, type AutomationExecutionData } from "./AutomationExecution";
import { AutomationFactory } from "./AutomationFactory";
import type { TipoTrigger } from "./AutomationTrigger";

export interface EventoAutomation {
  trigger: TipoTrigger;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class AutomationEngine {
  private reglas: AutomationRule[] = [];
  private ejecuciones: AutomationExecution[] = [];

  inicializar(): void {
    this.reglas = AutomationFactory.crearReglasPorDefecto();
  }

  cargarReglas(reglas: AutomationRule[]): void {
    this.reglas = reglas;
  }

  async procesarEvento(evento: EventoAutomation): Promise<AutomationExecution[]> {
    const reglasDisparadas = this.reglas.filter((regla) => {
      if (!regla.activa) return false;
      return regla.triggers.some((t) => t.tipo === evento.trigger);
    });

    const ejecuciones: AutomationExecution[] = [];

    for (const regla of reglasDisparadas.sort((a, b) => a.prioridad - b.prioridad)) {
      const inicio = Date.now();
      try {
        const condicionesCumplidas = this.evaluarCondiciones(regla, evento);
        if (!condicionesCumplidas) continue;

        const resultado = `Regla "${regla.nombre}" ejecutada (${regla.acciones.length} acciones)`;
        const ejecucion = new AutomationExecution({
          id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          reglaId: regla.id,
          trigger: evento.trigger,
          resultado,
          fecha: new Date().toISOString(),
          duracionMs: Date.now() - inicio,
          estado: "completado",
          metadata: { acciones: regla.acciones.map((a) => a.tipo) },
        });
        this.ejecuciones.push(ejecucion);
        ejecuciones.push(ejecucion);
      } catch (err) {
        const ejecucion = new AutomationExecution({
          id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          reglaId: regla.id,
          trigger: evento.trigger,
          resultado: "Error en ejecuciÃ³n",
          fecha: new Date().toISOString(),
          duracionMs: Date.now() - inicio,
          estado: "fallido",
          error: (err as Error).message,
        });
        this.ejecuciones.push(ejecucion);
        ejecuciones.push(ejecucion);
      }
    }

    return ejecuciones;
  }

  obtenerReglas(): AutomationRule[] {
    return this.reglas;
  }

  obtenerEjecuciones(limite?: number): AutomationExecution[] {
    const ordenadas = [...this.ejecuciones].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
    return limite ? ordenadas.slice(0, limite) : ordenadas;
  }

  private evaluarCondiciones(regla: AutomationRule, evento: EventoAutomation): boolean {
    if (regla.condiciones.length === 0) return true;
    return regla.condiciones.every((cond) => {
      switch (cond.tipo) {
        case "CLIENTE_HIGH_TOUCH":
          return evento.payload?.tipoCliente === "high_touch";
        case "SLA":
          return (evento.payload?.slaPorcentaje as number ?? 0) >= (cond.valor as number ?? 0);
        case "TIENE_TICKET_DEV":
          return evento.payload?.tieneTicketDev === true;
        case "CANAL":
          return evento.payload?.canal === cond.valor;
        default:
          return true;
      }
    });
  }
}

