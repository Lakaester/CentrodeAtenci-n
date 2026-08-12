import { useState } from "react";
import { operationsService } from "../services/operationsService";
import type { OperationsDashboard } from "../types";

export function useOperations() {
  const [dashboard, setDashboard] = useState<OperationsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await operationsService.getDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return { dashboard, loading, error, load };
}
