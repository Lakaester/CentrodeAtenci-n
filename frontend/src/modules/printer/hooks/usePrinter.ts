import { useState } from "react";
import { printerService } from "../services/printerService";
import type { FeatureFlag } from "../types/FeatureFlag";
import type { PrinterLog } from "../types/PrinterLog";

const DEFAULT_DOMAIN = "demo.restaurant.pe";

export function usePrinter() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [logs, setLogs] = useState<PrinterLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeatureFlags = async (dominio: string = DEFAULT_DOMAIN) => {
    setLoading(true);
    setError(null);
    try {
      const data = await printerService.listFeatureFlags(dominio);
      setFeatureFlags(data.flags ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err.message ?? "Error al cargar flags");
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (dominio: string, nombre: string, habilitado: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await printerService.updateFeatureFlag(dominio, nombre, habilitado);
      setFeatureFlags((prev) =>
        prev.map((f) => (f.nombre === nombre ? { ...f, habilitado } : f)),
      );
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err.message ?? "Error al actualizar flag");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (dominio: string, numeroLineas: number, tipoArchivo: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await printerService.getLogs(dominio, numeroLineas, tipoArchivo);
      setLogs(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err.message ?? "Error al cargar logs");
    } finally {
      setLoading(false);
    }
  };

  return {
    featureFlags,
    logs,
    loading,
    error,
    loadFeatureFlags,
    toggleFlag,
    loadLogs,
  };
}
