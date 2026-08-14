export { useQdLista, useQdDetalle, useQdPorTicket, useQdCrear, useQdActualizar, useQdAsociarInteraccion, useQdEliminar, useQdEstados, useQdResultados, useQdAreas, useQdProductos, useQdTiposQueja } from "./hooks/useQd";
export { qdService } from "./services/qdService";
export type { CrearCasoInput, ActualizarCasoInput, ExportFiltros } from "./services/qdService";
export type { QdCaso, QdDetalle, QdAuditoriaItem, QdCatalogoItem, QdInteraccion, QdTipo } from "./types";
