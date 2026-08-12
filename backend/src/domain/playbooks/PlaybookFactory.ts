import { Playbook, type CategoriaPlaybook, type PlaybookData } from "./Playbook";
import type { PlaybookStepData } from "./PlaybookStep";
import type { PlaybookActionData } from "./PlaybookAction";
import type { PlaybookConditionData } from "./PlaybookCondition";

type ConstructorPlaybook = () => PlaybookData;

export class PlaybookFactory {
  private static registros: Map<string, ConstructorPlaybook> = new Map();

  static registrar(tipo: string, constructor: ConstructorPlaybook): void {
    PlaybookFactory.registros.set(tipo, constructor);
  }

  static crear(categoria: CategoriaPlaybook): Playbook {
    const constructor = PlaybookFactory.registros.get(categoria);
    if (!constructor) return PlaybookFactory.crearVacio(categoria);
    return new Playbook(constructor());
  }

  static crearTodos(): Playbook[] {
    return Array.from(PlaybookFactory.registros.entries()).map(([, c]) => new Playbook(c()));
  }

  static crearVacio(categoria: CategoriaPlaybook): Playbook {
    return new Playbook({
      id: `pb_${categoria.toLowerCase().replace(/\s+/g, "_")}`,
      nombre: categoria,
      categoria,
      descripcion: `Playbook para ${categoria}`,
      prioridad: 5,
      pasos: [],
      checklist: [],
      herramientas: [],
      plugins: [],
      macros: [],
      verificacionesObligatorias: [],
      condicionesCierre: [],
    });
  }

  /* ── Playbooks predefinidos ── */

  static registrarFacturacionElectronica(): void {
    PlaybookFactory.registrar("Facturación Electrónica", () => ({
      id: "pb_fe",
      nombre: "Resolución de Facturación Electrónica",
      categoria: "Facturación Electrónica",
      descripcion: "Pasos para diagnosticar y resolver problemas de facturación electrónica",
      prioridad: 1,
      pasos: [
        paso(1, "Revisar CDT", "Verificar estado y vencimiento del CDT", true, "restafact", "restafact", "2 min"),
        paso(2, "Revisar Certificado", "Verificar vigencia del certificado digital", true, "restafact", "restafact", "2 min"),
        paso(3, "Revisar Comprobantes", "Verificar comprobantes en cola y rechazados", true, "dashboard-fe", "dashboard-fe", "3 min"),
        paso(4, "Revisar SUNAT", "Verificar estado de SUNAT", false, "dashboard-fe", undefined, "1 min"),
        paso(5, "Informar al Cliente", "Explicar la situación y los pasos a seguir", true),
        paso(6, "Categorizar", "Asignar categoría y subcategoría correcta", true),
        paso(7, "Cerrar Caso", "Completar resolución y cerrar el caso", true),
      ],
      checklist: [
        "CDT verificado",
        "Certificado verificado",
        "Comprobantes revisados",
        "Cliente informado",
        "Caso categorizado",
      ],
      herramientas: ["Restafact", "Dashboard FE", "NotebookLM"],
      plugins: ["restafact", "dashboard-fe", "notebooklm"],
      macros: ["Macro FE — Revisión rápida de CDT", "Macro FE — Corrección de comprobantes"],
      notebookRecomendado: "Guía de resolución de problemas de Facturación Electrónica",
      verificacionesObligatorias: [{ tipo: "CATEGORIA", operador: "igual", valor: "Facturación Electrónica" }],
      condicionesCierre: [
        { tipo: "TIENE_PLUGIN", operador: "existe", valor: "restafact", etiqueta: "Restafact utilizado" },
      ],
    }));
  }

  static registrarIntegraciones(): void {
    PlaybookFactory.registrar("Integraciones", () => ({
      id: "pb_int",
      nombre: "Diagnóstico de Integraciones",
      categoria: "Integraciones",
      descripcion: "Pasos para diagnosticar problemas con integraciones externas",
      prioridad: 2,
      pasos: [
        paso(1, "Revisar Monitor", "Verificar estado del monitor de integraciones", true, "integraciones", "integraciones", "2 min"),
        paso(2, "Revisar Conexiones", "Verificar estado de PedidosYa, Rappi, Uber, Didi", true, "integraciones", "integraciones", "3 min"),
        paso(3, "Revisar Logs", "Revisar errores recientes de sincronización", true, "integraciones", undefined, "3 min"),
        paso(4, "Informar al Cliente", "Explicar el estado de las integraciones", true),
      ],
      checklist: ["Monitor revisado", "Conexiones validadas", "Logs revisados", "Cliente informado"],
      herramientas: ["Monitor de Integraciones", "NotebookLM"],
      plugins: ["integraciones", "notebooklm"],
      macros: ["Macro Integraciones — Verificación rápida"],
      notebookRecomendado: "Documentación de APIs y solución de errores de conexión",
      verificacionesObligatorias: [{ tipo: "CATEGORIA", operador: "igual", valor: "Integraciones" }],
      condicionesCierre: [],
    }));
  }

  static registrarLogistica(): void {
    PlaybookFactory.registrar("Logística", () => ({
      id: "pb_log",
      nombre: "Resolución Logística",
      categoria: "Logística",
      descripcion: "Pasos para resolver problemas de logística e inventarios",
      prioridad: 3,
      pasos: [
        paso(1, "Revisar Sincronización", "Verificar estado de sincronización de inventarios", true, undefined, undefined, "2 min"),
        paso(2, "Revisar Inventarios", "Consultar inventarios actuales del cliente", true, undefined, undefined, "3 min"),
        paso(3, "Revisar Pendientes", "Revisar pedidos pendientes y errores", true, undefined, undefined, "2 min"),
        paso(4, "Informar al Cliente", "Explicar el estado logístico", true),
      ],
      checklist: ["Sincronización verificada", "Inventarios revisados", "Cliente informado"],
      herramientas: ["NotebookLM"],
      plugins: ["notebooklm"],
      macros: [],
      notebookRecomendado: "Guías de sincronización de inventarios",
      verificacionesObligatorias: [{ tipo: "CATEGORIA", operador: "igual", valor: "Logística" }],
      condicionesCierre: [],
    }));
  }

  static inicializar(): void {
    PlaybookFactory.registrarFacturacionElectronica();
    PlaybookFactory.registrarIntegraciones();
    PlaybookFactory.registrarLogistica();
  }
}

function paso(
  orden: number, nombre: string, descripcion: string, obligatorio: boolean,
  herramientaId?: string, pluginId?: string, tiempoEstimado?: string,
): PlaybookStepData {
  return {
    id: `step_${orden}`,
    orden,
    nombre,
    descripcion,
    obligatorio,
    completado: false,
    herramientaId,
    pluginId,
    tiempoEstimado,
    acciones: [],
    condiciones: [],
  };
}
