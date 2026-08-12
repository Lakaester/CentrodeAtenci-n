import { prisma } from "../repositories/prisma";
import type { Ticket } from "../domain/tickets/Ticket";
import { WorkspaceFactory } from "../builders/WorkspaceFactory";
import { MicroserviceRepository } from "../repositories/MicroserviceRepository";
import type { MicroserviceResponseDTO } from "../dto/MicroserviceDTOs";
import { MotorContexto } from "../domain/contexto/MotorContexto";

export interface ActividadResponse {
  id: string;
  tipo: string;
  subtipo: string;
  fecha: string;
  autor: string;
  autorId?: string;
  descripcion: string;
  origen: string;
  resultado: string;
  observaciones?: string;
}

export interface WorkspaceResponse {
  ticket: ReturnType<Ticket["toJSON"]>;
  origen?: { canal: string; ticketOriginalId: string; ticketOriginalStatus: string };
  contacto: {
    nombre: string;
    dominio: string;
    correo: string | null;
    telefono: string | null;
    pais: string;
    tipoCliente: string | null;
    producto: string | null;
    versionInstalada: string | null;
    categoriaActual: string | null;
  };
  historial: {
    id: string;
    fecha: string;
    canal: string;
    categoria: string | null;
    subcategoria: string | null;
    asesor: string | null;
    estado: string | null;
  }[];
  metricas: {
    slaPorcentaje: number;
    slaVencido: boolean;
    primeraRespuestaMin: number | null;
    resolucionMin: number | null;
    totalAtencionesCliente: number;
    categoriasFrecuentes: string[];
    asesorFrecuente: string | null;
  };
  estadoServicio: string | null;
  ticketsDev: { id: string; proyecto: string; estado: string }[];
  comprobantesEncolados: number | null;
  cliente360: {
    salud: { nivel: string | null; ultimaActividad: string | null; antiguedad: string | null };
    microservice: MicroserviceResponseDTO | null;
  };
  herramientas: { categoria: string; herramientas: string[] }[];
  workspaceEspecializado: import("../builders/WorkspaceDefinition").WorkspaceEspecializadoData | null;
  conversacion: {
    items: { id: string; tipo: string; emisor: string; contenido: string; timestamp: string }[];
    total: number;
  };
  centroResolucion: {
    objetivo: string;
    tiempoTranscurrido: string;
    tiempoRestanteSLA: string;
    informacionPendiente: { campo: string; mensaje: string }[];
    diagnostico: {
      informacionRecopilada: string[];
      informacionPendiente: string[];
      hipotesis: string[];
      resultado: string | null;
    };
    accionesRapidas: { id: string; nombre: string; icono?: string; accion: string }[];
    checklist: { id: string; nombre: string; descripcion: string; obligatorio: boolean; completado: boolean; orden: number }[];
    etapas: { id: string; nombre: string; activa: boolean; completada: boolean }[];
    notasOperativas: string[];
    riesgos: { texto: string; tipo: "alta" | "media" | "baja" }[];
  };
  areaTrabajo: {
    diagnostico: { problemaIdentificado: string; causa: string; analisisRealizado: string };
    respuesta: { contenido: string; variables: string[] };
    resultado: { accionRealizada: string; estadoFinal: string; observaciones: string };
    clasificacion: { tipoAtencion: string; subcategoria: string; dominio: string; canal: string };
  };
  contextoOperativo: {
    tipoAtencion: {
      id: string; nombre: string; descripcion: string;
      widgets: { id: string; tipo: string; titulo: string; descripcion: string; icono?: string; acciones: { id: string; label: string; icono: string; disponible: boolean }[]; orden: number; seccion: string; datosDisponibles: boolean; mensajeNoDisponible?: string }[];
      herramientas: string[];
      guia: { objetivo: string; pasos: string[]; buenasPracticas: string[] } | null;
    } | null;
    widgets: { id: string; tipo: string; titulo: string; descripcion: string; icono?: string; acciones: { id: string; label: string; icono: string; disponible: boolean }[]; orden: number; seccion: string; datosDisponibles: boolean; mensajeNoDisponible?: string }[];
    herramientas: string[];
    guia: { objetivo: string; pasos: string[]; buenasPracticas: string[] } | null;
  };
}

interface HistorialRow {
  ctid: string;
  fecha: Date | null;
  canal: string;
  categoria: string | null;
  subcategoria: string | null;
  asesor: string | null;
  estado_homologado: string | null;
}

const HERRAMIENTAS_POR_CATEGORIA: Record<string, string[]> = {
  "Facturación Electrónica": ["Abrir Restafact", "Abrir Dashboard FE", "Abrir SUNAT", "Abrir NotebookLM"],
  "Facturación": ["Abrir Restafact", "Abrir Dashboard FE", "Abrir NotebookLM"],
  "Integraciones": ["Abrir Monitor", "Abrir Carta", "Abrir Productos", "Abrir Dashboard"],
  "Logística": ["Abrir Dashboard Logística", "Abrir Inventarios", "Abrir NotebookLM"],
  "Soporte Técnico": ["Abrir Microservice", "Abrir Configuración", "Abrir NotebookLM"],
  "Software": ["Abrir Configuración", "Abrir Actualizaciones", "Abrir NotebookLM"],
  "default": ["Abrir Dominio", "Abrir Microservice", "Abrir NotebookLM"],
};

export class TicketWorkspaceAssembler {
  async assemble(ticket: Ticket): Promise<WorkspaceResponse> {
    const dominio = ticket.clienteDominio;
    const categoria = ticket.categoriaFinal ?? "default";

    const microservice = new MicroserviceRepository();
    WorkspaceFactory.inicializar();
    MotorContexto.inicializar();
    const contextoOp = MotorContexto.resolver({ categoria, subcategoria: ticket.subcategoriaFinal, canal: ticket.channel, dominio: ticket.clienteDominio });
    const [historialRows, categorias, asesorFrecuente, data, workspaceEsp, msData] = await Promise.all([
      this.obtenerHistorial(dominio, ticket.id),
      this.obtenerCategoriasFrecuentes(dominio),
      this.obtenerAsesorFrecuente(dominio),
      this.obtenerDatosCliente(dominio),
      WorkspaceFactory.construir(ticket),
      microservice.consultarPorDominio(dominio),
    ]);

    const herramientas = [
      {
        categoria: categoria,
        herramientas: HERRAMIENTAS_POR_CATEGORIA[categoria] ?? HERRAMIENTAS_POR_CATEGORIA["default"],
      },
    ];

    const sinDominio = !dominio || dominio === "";
    const infoPendiente: { campo: string; mensaje: string }[] = [];
    if (sinDominio) infoPendiente.push({ campo: "dominio", mensaje: "Dominio del cliente no registrado" });
    infoPendiente.push({ campo: "ruc", mensaje: "RUC del cliente pendiente" });
    infoPendiente.push({ campo: "cliente", mensaje: "Identificación del cliente pendiente" });

    const historialItems = (historialRows ?? []).map((h) => ({
      id: h.ctid,
      tipo: "sistema" as const,
      emisor: h.asesor ?? "Sistema",
      contenido: `${h.canal}: ${h.categoria ?? "Sin categoría"}${h.subcategoria ? ` - ${h.subcategoria}` : ""}${h.asesor ? ` (${h.asesor})` : ""}`,
      timestamp: h.fecha?.toISOString() ?? new Date().toISOString(),
    }));

    const canalMap: Record<string, string> = { whaticket: "whaticket", meta: "wameta", zendesk: "zendesk", correo: "correo", api: "api" };

    return {
      ticket: ticket.toJSON(),
      origen: {
        canal: canalMap[ticket.channel] ?? ticket.channel,
        ticketOriginalId: ticket.externalId ?? ticket.id,
        ticketOriginalStatus: ticket.status,
      },
      cliente360: {
        salud: {
          nivel: null,
          ultimaActividad: historialItems[0]?.timestamp ?? null,
          antiguedad: ticket.createdAt ? this.calcularAntiguedad(ticket.createdAt) : null,
        },
        microservice: msData,
      },
      conversacion: {
        items: [
          {
            id: `msg_${ticket.id}_creado`,
            tipo: "sistema",
            emisor: "Sistema",
            contenido: `Ticket creado - ${ticket.asunto}`,
            timestamp: ticket.createdAt,
          },
          ...historialItems,
        ],
        total: historialItems.length + 1,
      },
      workspaceEspecializado: workspaceEsp,
      areaTrabajo: {
        diagnostico: { problemaIdentificado: "", causa: "", analisisRealizado: "" },
        respuesta: { contenido: "", variables: [] },
        resultado: { accionRealizada: "", estadoFinal: ticket.status ?? "PENDIENTE", observaciones: "" },
        clasificacion: {
          tipoAtencion: ticket.categoriaFinal ?? ticket.categoriaSugerida ?? "",
          subcategoria: ticket.subcategoriaFinal ?? "",
          dominio: ticket.clienteDominio,
          canal: ticket.channel,
        },
      },
      centroResolucion: {
        objetivo: "Objetivo pendiente de definir.",
        tiempoTranscurrido: ticket.createdAt ? this.calcularTiempoTranscurrido(ticket.createdAt) : "—",
        tiempoRestanteSLA: ticket.slaVencido ? "Vencido" : `${Math.max(0, 120 - this.calcularMinutosTranscurridos(ticket.createdAt))} min restantes`,
        informacionPendiente: infoPendiente,
        diagnostico: {
          informacionRecopilada: [],
          informacionPendiente: ["Dominio", "RUC", "Versión del producto"],
          hipotesis: [],
          resultado: null,
        },
        accionesRapidas: [
          { id: "ar_dominio", nombre: "Abrir Dominio", accion: "abrir_dominio" },
          { id: "ar_restafact", nombre: "Abrir Restafact", accion: "abrir_restafact" },
          { id: "ar_fe", nombre: "Abrir Dashboard FE", accion: "abrir_dashboard_fe" },
          { id: "ar_notebook", nombre: "Abrir NotebookLM", accion: "abrir_notebooklm" },
        ],
        checklist: [
          { id: "cl_diagnostico", nombre: "Diagnóstico realizado", descripcion: "Completar análisis del caso", obligatorio: true, completado: false, orden: 1 },
          { id: "cl_cliente", nombre: "Cliente informado", descripcion: "Informar al cliente sobre la resolución", obligatorio: true, completado: false, orden: 2 },
          { id: "cl_solucion", nombre: "Solución aplicada", descripcion: "Ejecutar la solución definida", obligatorio: true, completado: false, orden: 3 },
          { id: "cl_categoria", nombre: "Caso categorizado", descripcion: "Asignar categoría y subcategoría correcta", obligatorio: true, completado: false, orden: 4 },
          { id: "cl_cierre", nombre: "Ticket listo para cerrar", descripcion: "Verificar que todo esté completo antes de cerrar", obligatorio: true, completado: false, orden: 5 },
        ],
        etapas: [
          { id: "et_identificacion", nombre: "Identificación", activa: false, completada: true },
          { id: "et_diagnostico", nombre: "Diagnóstico", activa: true, completada: false },
          { id: "et_resolucion", nombre: "Resolución", activa: false, completada: false },
          { id: "et_validacion", nombre: "Validación", activa: false, completada: false },
          { id: "et_cierre", nombre: "Listo para cerrar", activa: false, completada: false },
        ],
        notasOperativas: [],
        riesgos: ticket.slaVencido
          ? [{ texto: "SLA vencido — atención prioritaria", tipo: "alta" as const }]
          : ticket.slaPorcentaje >= 70
            ? [{ texto: "SLA próximo a vencer", tipo: "media" as const }]
            : [],
      },
      contacto: {
        nombre: ticket.clienteNombre,
        dominio: ticket.clienteDominio,
        correo: data?.correo ?? ticket.clienteDominio,
        telefono: data?.telefono ?? null,
        pais: ticket.pais ?? data?.pais ?? "",
        tipoCliente: ticket.tipoCliente ?? null,
        producto: data?.producto ?? null,
        versionInstalada: data?.version ?? null,
        categoriaActual: ticket.categoriaFinal ?? ticket.categoriaSugerida ?? null,
      },
      historial: (historialRows ?? []).map((h) => ({
        id: h.ctid,
        fecha: h.fecha?.toISOString() ?? "",
        canal: h.canal,
        categoria: h.categoria,
        subcategoria: h.subcategoria,
        asesor: h.asesor,
        estado: h.estado_homologado,
      })),
      metricas: {
        slaPorcentaje: ticket.slaPorcentaje,
        slaVencido: ticket.slaVencido,
        primeraRespuestaMin: null,
        resolucionMin: null,
        totalAtencionesCliente: (historialRows ?? []).length + 1,
        categoriasFrecuentes: categorias,
        asesorFrecuente,
      },
      estadoServicio: null,
      ticketsDev: [],
      comprobantesEncolados: null,
      actividades: [],
      contextoOperativo: contextoOp,
      herramientas,
    };
  }

  private async obtenerDatosCliente(dominio: string): Promise<{ correo: string | null; telefono: string | null; pais: string | null; producto: string | null; version: string | null } | null> {
    if (!dominio) return null;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        COALESCE(NULLIF(TRIM(dominio), ''), '') AS correo,
        NULL AS telefono,
        COALESCE(NULLIF(TRIM(pais), ''), '') AS pais,
        NULL AS producto,
        NULL AS version
      FROM public.v_unificado_norm
      WHERE dominio ILIKE ${dominio}
      LIMIT 1
    `;
    if (!rows.length) return null;
    return { correo: rows[0].correo, telefono: null, pais: rows[0].pais, producto: null, version: null };
  }

  private async obtenerHistorial(dominio: string, excludeId: string): Promise<HistorialRow[]> {
    if (!dominio) return [];
    return prisma.$queryRaw<HistorialRow[]>`
      SELECT ctid::text, fecha, canal, categoria, subcategoria, asesor, estado_homologado
      FROM public.v_unificado_norm
      WHERE dominio ILIKE ${dominio} AND ctid::text != ${excludeId}
      ORDER BY fecha DESC NULLS LAST
      LIMIT 20
    `;
  }

  private async obtenerCategoriasFrecuentes(dominio: string): Promise<string[]> {
    if (!dominio) return [];
    const rows = await prisma.$queryRaw<{ categoria: string; total: number }[]>`
      SELECT COALESCE(NULLIF(TRIM(categoria), ''), 'Sin categoría') AS categoria, COUNT(*)::int AS total
      FROM public.v_unificado_norm
      WHERE dominio ILIKE ${dominio} AND categoria IS NOT NULL AND TRIM(categoria) != ''
      GROUP BY categoria ORDER BY total DESC LIMIT 5
    `;
    return rows.map((r) => `${r.categoria} (${r.total})`);
  }

  private calcularTiempoTranscurrido(creadoEn: string): string {
    const min = this.calcularMinutosTranscurridos(creadoEn);
    if (min < 1) return "Menos de 1 min";
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  }

  private calcularMinutosTranscurridos(creadoEn: string): number {
    return Math.floor((Date.now() - new Date(creadoEn).getTime()) / 60000);
  }

  private calcularAntiguedad(creadoEn: string): string {
    const diff = Date.now() - new Date(creadoEn).getTime();
    const dias = Math.floor(diff / 86400000);
    if (dias < 1) return "Hoy";
    if (dias < 30) return `${dias} días`;
    const meses = Math.floor(dias / 30);
    if (meses < 12) return `${meses} meses`;
    const anios = Math.floor(dias / 365);
    return `${anios} año${anios > 1 ? "s" : ""}`;
  }

  private async obtenerAsesorFrecuente(dominio: string): Promise<string | null> {
    if (!dominio) return null;
    const rows = await prisma.$queryRaw<{ asesor: string; total: number }[]>`
      SELECT COALESCE(NULLIF(TRIM(asesor), ''), 'Sin asesor') AS asesor, COUNT(*)::int AS total
      FROM public.v_unificado_norm
      WHERE dominio ILIKE ${dominio} AND asesor IS NOT NULL AND TRIM(asesor) != ''
      GROUP BY asesor ORDER BY total DESC LIMIT 1
    `;
    return rows[0]?.asesor ?? null;
  }
}
