/**
 * Interfaz del servicio Printer.
 * Pendiente de implementar en FASE 2.
 */
export interface IPrinterService {
  listFeatureFlags(): Promise<unknown>;
  updateFeatureFlag(nombre: string, habilitado: boolean): Promise<unknown>;
  getLogs(numeroLineas: number, tipoArchivo: string): Promise<unknown>;
}
