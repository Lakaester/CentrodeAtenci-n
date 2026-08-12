import { PlaybookStep, type PlaybookStepData } from "./PlaybookStep";
import { PlaybookCondition, type PlaybookConditionData } from "./PlaybookCondition";

export type CategoriaPlaybook =
  | "Facturación Electrónica"
  | "Integraciones"
  | "Logística"
  | "Software"
  | "Capacitación"
  | "Administrativo"
  | "Gestión"
  | "Operativo";

export interface PlaybookData {
  id: string;
  nombre: string;
  categoria: CategoriaPlaybook;
  descripcion: string;
  prioridad: number;
  pasos: PlaybookStepData[];
  checklist: string[];
  herramientas: string[];
  plugins: string[];
  macros: string[];
  notebookRecomendado?: string;
  verificacionesObligatorias: PlaybookConditionData[];
  condicionesCierre: PlaybookConditionData[];
}

export class Playbook {
  readonly id: string;
  readonly nombre: string;
  readonly categoria: CategoriaPlaybook;
  readonly descripcion: string;
  readonly prioridad: number;
  readonly pasos: PlaybookStep[];
  readonly checklist: string[];
  readonly herramientas: string[];
  readonly plugins: string[];
  readonly macros: string[];
  readonly notebookRecomendado?: string;
  readonly verificacionesObligatorias: PlaybookCondition[];
  readonly condicionesCierre: PlaybookCondition[];

  constructor(data: PlaybookData) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.categoria = data.categoria;
    this.descripcion = data.descripcion;
    this.prioridad = data.prioridad;
    this.pasos = data.pasos.map((p) => new PlaybookStep(p));
    this.checklist = data.checklist;
    this.herramientas = data.herramientas;
    this.plugins = data.plugins;
    this.macros = data.macros;
    this.notebookRecomendado = data.notebookRecomendado;
    this.verificacionesObligatorias = data.verificacionesObligatorias.map((c) => new PlaybookCondition(c));
    this.condicionesCierre = data.condicionesCierre.map((c) => new PlaybookCondition(c));
  }

  get pasosPendientes(): PlaybookStep[] {
    return this.pasos.filter((p) => !p.completado);
  }

  get pasosCompletados(): PlaybookStep[] {
    return this.pasos.filter((p) => p.completado);
  }

  get progreso(): number {
    if (this.pasos.length === 0) return 0;
    return Math.round((this.pasosCompletados.length / this.pasos.length) * 100);
  }

  toJSON(): PlaybookData {
    return {
      id: this.id,
      nombre: this.nombre,
      categoria: this.categoria,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      pasos: this.pasos.map((p) => p.toJSON()),
      checklist: this.checklist,
      herramientas: this.herramientas,
      plugins: this.plugins,
      macros: this.macros,
      notebookRecomendado: this.notebookRecomendado,
      verificacionesObligatorias: this.verificacionesObligatorias.map((c) => c.toJSON()),
      condicionesCierre: this.condicionesCierre.map((c) => c.toJSON()),
    };
  }
}
