import type { IWorkspaceBuilder, WorkspaceEspecializadoData } from "./WorkspaceContext";
import type { Ticket } from "../domain/tickets/Ticket";
import { herramientasStore } from "../data/HerramientasStore";

export class IntegracionesWorkspaceBuilder implements IWorkspaceBuilder {
  readonly tipo = "Integraciones";

  async construir(ticket: Ticket): Promise<WorkspaceEspecializadoData> {
    const herramientas = herramientasStore.getNombresPorTipo(this.tipo);
    const herramientasConPrefijo = herramientas.length > 0
      ? herramientas.map((h) => `Abrir ${h}`)
      : [
          "Abrir Dominio",
          "Abrir Monitor Integraciones",
          "Abrir Configuración",
          "Abrir Carta",
          "Abrir Webhook",
        ];

    return {
      tipo: this.tipo,
      cliente: {
        dominio: ticket.clienteDominio,
        contacto: ticket.clienteNombre,
        producto: null,
        pais: ticket.pais ?? "—",
        tipoCliente: ticket.tipoCliente ?? null,
      },
      guia: {
        objetivo: "Diagnosticar y resolver problemas de integraciones externas",
        procesoRecomendado: [
          "Identificar qué integración presenta el problema",
          "Revisar el Monitor de Integraciones",
          "Verificar estado de conexión de cada plataforma",
          "Revisar errores recientes de sincronización",
          "Validar configuración de webhooks",
          "Ejecutar prueba de conexión",
          "Informar al cliente sobre el resultado",
        ],
        buenasPracticas: [
          "Revisar el monitor antes de escalar a desarrollo",
          "Documentar el error exacto mostrado en la integración",
        ],
        informacionNecesaria: [
          "Plataforma afectada (PedidosYa, Rappi, Uber, Didi)",
          "Última sincronización exitosa",
          "Código de error mostrado",
        ],
        criteriosResolucion: [
          "Monitor muestra todas las integraciones como conectadas",
          "Prueba de sincronización exitosa",
          "Cliente confirma que la integración funciona",
        ],
      },
      posiblesCausas: [
        "Token de acceso expirado",
        "Cambio en API de la plataforma externa",
        "Error de configuración en webhooks",
        "Problema de red o conectividad",
        "Límite de tasa de API excedido",
        "Plataforma externa en mantenimiento",
      ],
      herramientas: herramientasConPrefijo,
      estadoOperativo: [
        { label: "Estado Webhooks", valor: null },
        { label: "Última sincronización", valor: null },
        { label: "Errores recientes", valor: null },
        { label: "Pedidos pendientes", valor: null },
        { label: "Integraciones activas", valor: null },
      ],
      resultado: null,
    };
  }
}
