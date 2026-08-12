import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface OrigenCanalInfo {
  canal: string;
  ticketOriginalId: string;
  ticketOriginalStatus: string;
}

export interface WidgetAccionFE {
  id: string;
  label: string;
  icono: string;
  disponible: boolean;
}

export interface WidgetOperativoFE {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  icono?: string;
  acciones: WidgetAccionFE[];
  orden: number;
  seccion: string;
  datosDisponibles: boolean;
  mensajeNoDisponible?: string;
}

export interface GuiaOperativaFE {
  objetivo: string;
  pasos: string[];
  buenasPracticas: string[];
}

export interface ActividadFE {
  id: string;
  tipo: "identificacion" | "diagnostico" | "consulta" | "gestion" | "comunicacion" | "clasificacion" | "cierre";
  subtipo: string;
  fecha: string;
  autor: string;
  autorId?: string;
  descripcion: string;
  origen: string;
  resultado: "ok" | "error" | "pendiente" | "informacion_no_disponible";
  observaciones?: string;
}

export interface ContextoOperativoFE {
  tipoAtencion: {
    id: string;
    nombre: string;
    descripcion: string;
    widgets: WidgetOperativoFE[];
    herramientas: string[];
    guia: GuiaOperativaFE | null;
  } | null;
  widgets: WidgetOperativoFE[];
  herramientas: string[];
  guia: GuiaOperativaFE | null;
}

export interface WorkspaceResponse {
  ticket: Record<string, unknown>;
  origen?: OrigenCanalInfo;
  actividades?: ActividadFE[];
  contextoOperativo?: ContextoOperativoFE;
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
    microservice: {
      cliente: { dominio: string; razonSocial: string | null; ruc: string | null; pais: string | null; tipoCliente: string | null; estado: string | null; productos: string[]; ltv: string | null; cantidadLocales: number | null; estadoSalud: string | null };
      soporte: { historial: { fecha: string; tipo: string; descripcion: string }[]; ultimasIncidencias: { fecha: string; categoria: string; estado: string }[]; reincidencias: number };
      comercial: { csm: string | null; reuniones: number; churn: string | null; estadoComercial: string | null };
      desarrollo: { tickets: { id: string; proyecto: string; estado: string; prioridad: string; responsable: string }[] };
    } | null;
  };
  workspaceEspecializado: {
    tipo: string;
    cliente: { dominio: string; contacto: string; producto: string | null; pais: string; tipoCliente: string | null };
    guia: {
      objetivo: string;
      procesoRecomendado: string[];
      buenasPracticas: string[];
      informacionNecesaria: string[];
      criteriosResolucion: string[];
    };
    posiblesCausas: string[];
    herramientas: string[];
    estadoOperativo: { label: string; valor: string | null }[];
    resultado: { resumen: string; causaIdentificada: string; accionRealizada: string; resultado: string; observaciones: string } | null;
  } | null;
  herramientas: { categoria: string; herramientas: string[] }[];
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
}

export function useTicketWorkspace(ticketId: string | null) {
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) {
      setWorkspace(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.get(`/tickets/${ticketId}/workspace`)
      .then((res) => { if (!cancelled) { setWorkspace(res.data.data ?? null); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticketId]);

  return { workspace, loading, error };
}
