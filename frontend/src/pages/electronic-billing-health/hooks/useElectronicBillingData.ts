import { useQuery } from "@tanstack/react-query";
import { ElectronicBillingService } from "../services/ElectronicBillingService";
import { billingProvider } from "../providers";
import type { BillingData } from "../services/ElectronicBillingService";

const REFETCH_INTERVAL = 30_000;
const service = new ElectronicBillingService(billingProvider);

interface DataResult { data: BillingData | undefined; isLoading: boolean; isError: boolean; error: string | null; dataUpdatedAt: number; refetch: () => void; }

export function useElectronicBillingData(): DataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["electronic-billing"], queryFn: () => service.fetchAll(),
    refetchInterval: REFETCH_INTERVAL, staleTime: REFETCH_INTERVAL,
  });
  return { data, isLoading, isError, error: error instanceof Error ? error.message : isError ? "Error al cargar facturación" : null, dataUpdatedAt, refetch };
}
