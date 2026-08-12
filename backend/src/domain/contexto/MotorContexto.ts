import { TipoAtencion, type TipoAtencionDef } from "./TipoAtencion";
import type { WidgetOperativoDef } from "./WidgetOperativo";

export interface ContextoAtencionParams {
  categoria?: string;
  subcategoria?: string;
  canal?: string;
  clienteId?: string;
  dominio?: string;
}

export interface ContextoOperativo {
  tipoAtencion: TipoAtencionDef | null;
  widgets: WidgetOperativoDef[];
  herramientas: string[];
  guia: TipoAtencionDef["guia"] | null;
}

export class MotorContexto {
  private static registros: Map<string, TipoAtencion> = new Map();

  static registrar(tipo: TipoAtencion): void {
    MotorContexto.registros.set(tipo.id, tipo);
  }

  static resolver(params: ContextoAtencionParams): ContextoOperativo {
    const categoria = params.categoria ?? "";
    const subcategoria = params.subcategoria ?? "";

    const tipos = Array.from(MotorContexto.registros.values());
    const coincidente = tipos.find((t) => t.coincideCon(categoria, subcategoria)) ?? null;

    if (!coincidente) {
      return {
        tipoAtencion: null,
        widgets: [],
        herramientas: [],
        guia: null,
      };
    }

    return {
      tipoAtencion: coincidente.toJSON(),
      widgets: coincidente.widgets.map((w) => w.toJSON()),
      herramientas: coincidente.herramientas,
      guia: coincidente.guia ?? null,
    };
  }

  static limpiar(): void {
    MotorContexto.registros.clear();
  }

  static inicializar(): void {
    MotorContexto.registrarFacturacion();
  }

  private static registrarFacturacion(): void {
    const facturacion = new TipoAtencion({
      id: "facturacion_electronica",
      nombre: "Facturación Electrónica",
      descripcion: "Atenciones relacionadas con facturación electrónica, comprobantes, CDT y SUNAT",
      categorias: ["facturación", "facturacion", "fe", "cdt", "comprobante", "sunat"],
      widgets: [
        {
          id: "w_estado_cdt",
          tipo: "status",
          titulo: "Estado CDT",
          descripcion: "Certificado Digital Tributario",
          icono: "FileText",
          orden: 1,
          seccion: "diagnostico",
          datosDisponibles: false,
          mensajeNoDisponible: "Información no disponible. La integración con SUNAT no está configurada.",
          acciones: [
            { id: "renovar_cdt", label: "Renovar CDT", icono: "RefreshCw", disponible: false },
          ],
        },
        {
          id: "w_comprobantes_encolados",
          tipo: "metric",
          titulo: "Comprobantes encolados",
          descripcion: "Documentos pendientes de envío a SUNAT",
          icono: "Clock",
          orden: 2,
          seccion: "diagnostico",
          datosDisponibles: false,
          mensajeNoDisponible: "Información no disponible. La integración con SUNAT no está configurada.",
          acciones: [
            { id: "reenviar_comprobantes", label: "Reenviar comprobantes", icono: "Send", disponible: false },
          ],
        },
        {
          id: "w_estado_sunat",
          tipo: "status",
          titulo: "Estado SUNAT",
          descripcion: "Estado de la comunicación con SUNAT",
          icono: "Shield",
          orden: 3,
          seccion: "diagnostico",
          datosDisponibles: false,
          mensajeNoDisponible: "Información no disponible. La integración con SUNAT no está configurada.",
          acciones: [],
        },
        {
          id: "w_dashboard_fe",
          tipo: "embed",
          titulo: "Dashboard FE",
          descripcion: "Panel de facturación electrónica",
          icono: "BarChart3",
          orden: 4,
          seccion: "herramientas",
          datosDisponibles: false,
          mensajeNoDisponible: "Información no disponible. El Dashboard FE no está disponible.",
          acciones: [
            { id: "abrir_dashboard_fe", label: "Abrir Dashboard FE", icono: "ExternalLink", disponible: false },
          ],
        },
        {
          id: "w_restafact",
          tipo: "embed",
          titulo: "Restafact",
          descripcion: "Sistema de facturación",
          icono: "FileText",
          orden: 5,
          seccion: "herramientas",
          datosDisponibles: false,
          mensajeNoDisponible: "Información no disponible. Restafact no está conectado.",
          acciones: [
            { id: "abrir_restafact", label: "Abrir Restafact", icono: "ExternalLink", disponible: false },
          ],
        },
        {
          id: "w_ultimos_comprobantes",
          tipo: "list",
          titulo: "Últimos comprobantes",
          descripcion: "Comprobantes emitidos recientemente",
          icono: "List",
          orden: 6,
          seccion: "diagnostico",
          datosDisponibles: false,
          mensajeNoDisponible: "Información no disponible. No se pudo obtener el historial de comprobantes.",
          acciones: [],
        },
      ],
      herramientas: ["Abrir Dominio", "Abrir Restafact", "Abrir Dashboard FE", "Abrir SUNAT", "Abrir NotebookLM"],
      guia: {
        objetivo: "Resolver problemas de facturación electrónica, comprobantes y comunicación con SUNAT.",
        pasos: [
          "Verificar estado del CDT del cliente",
          "Revisar comprobantes encolados",
          "Consultar Dashboard FE",
          "Identificar errores de facturación",
          "Aplicar corrección o escalar",
        ],
        buenasPracticas: [
          "Siempre verificar el CDT antes de escalar a DEV",
          "Revisar el historial de comprobantes antes de reenviar",
          "Documentar el error exacto de SUNAT",
        ],
      },
    });

    MotorContexto.registrar(facturacion);
  }
}
