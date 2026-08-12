import type { IWorkspaceBuilder, WorkspaceEspecializadoData } from "./WorkspaceContext";
import type { Ticket } from "../domain/tickets/Ticket";
import { herramientasStore } from "../data/HerramientasStore";

export class FacturacionWorkspaceBuilder implements IWorkspaceBuilder {
  readonly tipo = "Facturación Electrónica";

  async construir(ticket: Ticket): Promise<WorkspaceEspecializadoData> {
    const herramientas = herramientasStore.getNombresPorTipo(this.tipo);
    const herramientasConPrefijo = herramientas.length > 0
      ? herramientas.map((h) => `Abrir ${h}`)
      : [
          "Abrir Dashboard FE",
          "Abrir Restafact",
          "Abrir Dominio",
          "Abrir SUNAT",
          "Abrir Postman",
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
        objetivo: "Resolver incidencias relacionadas con la emisión y envío de comprobantes electrónicos.",
        procesoRecomendado: [
          "Revisar Dashboard FE para verificar el estado general",
          "Revisar Restafact (CDT, certificado, comprobantes)",
          "Validar comprobantes encolados y rechazados",
          "Confirmar resultado con el cliente",
          "Informar al cliente sobre la resolución",
        ],
        buenasPracticas: [
          "Siempre confirmar el último comprobante afectado antes de cerrar el caso.",
        ],
        informacionNecesaria: [
          "Dominio del cliente",
          "RUC",
          "País",
          "Facturador",
        ],
        criteriosResolucion: [
          "Cliente informado",
          "Problema identificado",
          "Acción ejecutada o gestión iniciada",
        ],
      },
      posiblesCausas: [
        "CDT vencido",
        "Certificado digital vencido",
        "Comprobantes en cola sin procesar",
        "Error de comunicación con SUNAT",
        "Error del facturador electrónico",
      ],
      herramientas: herramientasConPrefijo,
      estadoOperativo: [
        { label: "Estado CDT", valor: null },
        { label: "Estado Certificado", valor: null },
        { label: "Comprobantes pendientes", valor: null },
        { label: "Último envío", valor: null },
        { label: "Facturador", valor: null },
      ],
      resultado: null,
    };
  }
}
