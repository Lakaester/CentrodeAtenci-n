export { useQdLista, useQdDetalle, useQdPorTicket, useQdCrear, useQdActualizar, useQdAsociarInteraccion, useQdEliminar, useQdAsignarDominio, useQdCerrarCaso, useQdReabrirCaso, useQdConsolidarCasos, useQdVincularTicket, useQdEstados, useQdResultados, useQdAreas, useQdProductos, useQdTiposQueja, useQdDominios } from "./hooks/useQd";
export { qdService } from "./services/qdService";
export type { CrearCasoInput, ActualizarCasoInput, ExportFiltros } from "./services/qdService";
export type { QdCaso, QdDetalle, QdAuditoriaItem, QdCatalogoItem, QdInteraccion, QdTipo } from "./types";
