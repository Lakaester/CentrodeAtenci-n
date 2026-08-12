import { Workspace, type WorkspaceData, type AccionRapida } from "./Workspace";
import type { WorkspaceContext } from "./WorkspaceContext";
import type { TipoSeccion } from "./WorkspaceSection";
import type { WidgetData, TamanoWidget } from "./WorkspaceWidget";

type ConstructorWorkspace = (contexto: WorkspaceContext) => WorkspaceData;

export class WorkspaceFactory {
  private static registros: Map<string, ConstructorWorkspace> = new Map();

  static registrar(tipo: string, constructor: ConstructorWorkspace): void {
    WorkspaceFactory.registros.set(tipo, constructor);
  }

  static crear(tipo: string, contexto: WorkspaceContext): Workspace {
    const constructor = WorkspaceFactory.registros.get(tipo);
    if (!constructor) {
      return WorkspaceFactory.crearPorDefecto(contexto);
    }
    return new Workspace(constructor(contexto));
  }

  static crearTodos(contexto: WorkspaceContext): Workspace[] {
    return Array.from(WorkspaceFactory.registros.entries()).map(
      ([, constructor]) => new Workspace(constructor(contexto)),
    );
  }

  static crearPorDefecto(contexto: WorkspaceContext): Workspace {
    return new Workspace({
      id: `ws_default_${Date.now()}`,
      categoriaId: contexto.obtenerCategoriaId() ?? "default",
      header: { titulo: "Workspace", descripcion: "Workspace por defecto" },
      secciones: [],
      accionesRapidas: [],
      plugins: [],
    });
  }

  /* ── Registros de workspaces por categoría ── */

  static registrarFacturacion(): void {
    WorkspaceFactory.registrar("Facturación Electrónica", (ctx) => ({
      id: `ws_fe_${ctx.atencion?.id ?? Date.now()}`,
      categoriaId: ctx.obtenerCategoriaId() ?? "cat_fe",
      header: { titulo: "Facturación Electrónica", icono: "FileText", color: "#2563EB" },
      secciones: [
        seccion("cliente", "Cliente", 1, [widget("w_cliente_nombre", "Nombre", "User", "sm", 1)]),
        seccion("diagnostico", "Diagnóstico", 2, [
          widget("w_fe_cdt", "Estado CDT", "FileText", "sm", 1, "restafact"),
          widget("w_fe_cert", "Certificado", "Shield", "sm", 2, "restafact"),
        ]),
        seccion("herramientas", "Herramientas", 3, []),
        seccion("checklist", "Checklist", 4, []),
      ],
      accionesRapidas: [
        accion("ar_dominio", "Abrir Dominio", "Globe"),
        accion("ar_restafact", "Abrir Restafact", "FileText", "restafact"),
        accion("ar_fe", "Abrir Dashboard FE", "BarChart3", "dashboard-fe"),
      ],
      plugins: [{ id: "restafact", nombre: "Restafact", icono: "FileText", disponible: true }],
    }));
  }

  static registrarLogistica(): void {
    WorkspaceFactory.registrar("Logística", (ctx) => ({
      id: `ws_log_${ctx.atencion?.id ?? Date.now()}`,
      categoriaId: ctx.obtenerCategoriaId() ?? "cat_log",
      header: { titulo: "Logística", icono: "Truck", color: "#F97316" },
      secciones: [
        seccion("cliente", "Cliente", 1, []),
        seccion("diagnostico", "Diagnóstico", 2, [
          widget("w_log_sincro", "Sincronización", "RefreshCw", "sm", 1),
          widget("w_log_inv", "Inventarios", "Package", "sm", 2),
        ]),
        seccion("herramientas", "Herramientas", 3, []),
      ],
      accionesRapidas: [
        accion("ar_dominio", "Abrir Dominio", "Globe"),
      ],
      plugins: [],
    }));
  }

  static registrarIntegraciones(): void {
    WorkspaceFactory.registrar("Integraciones", (ctx) => ({
      id: `ws_int_${ctx.atencion?.id ?? Date.now()}`,
      categoriaId: ctx.obtenerCategoriaId() ?? "cat_int",
      header: { titulo: "Integraciones", icono: "Grid3X3", color: "#10B981" },
      secciones: [
        seccion("cliente", "Cliente", 1, []),
        seccion("diagnostico", "Diagnóstico", 2, [
          widget("w_int_monitor", "Monitor", "Monitor", "sm", 1, "integraciones"),
        ]),
        seccion("herramientas", "Herramientas", 3, []),
      ],
      accionesRapidas: [
        accion("ar_dominio", "Abrir Dominio", "Globe"),
      ],
      plugins: [{ id: "integraciones", nombre: "Integraciones", icono: "Grid3X3", disponible: true }],
    }));
  }
}

function seccion(tipo: TipoSeccion, titulo: string, orden: number, widgets: WidgetData[]): SectionData_ {
  return { id: `sec_${tipo}_${orden}`, tipo, titulo, orden, widgets, colapsable: true, abiertoPorDefecto: true };
}

function widget(id: string, nombre: string, icono: string, tamano: TamanoWidget, orden: number, pluginId?: string): WidgetData {
  return { id, nombre, icono, tipo: "metric", orden, tamano, prioridad: 1, pluginId };
}

function accion(id: string, nombre: string, icono: string, pluginId?: string): AccionRapida {
  return { id, nombre, icono, pluginId };
}

interface SectionData_ {
  id: string;
  tipo: TipoSeccion;
  titulo: string;
  orden: number;
  widgets: WidgetData[];
  colapsable: boolean;
  abiertoPorDefecto: boolean;
}
